
'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  doc,
  collection,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import {
  useFirestore,
  useUser,
  useDoc,
  useCollection,
  useMemoFirebase,
} from '@/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { RefreshCw, LogOut, Trophy } from 'lucide-react';
import { Badge } from '../ui/badge';
import Image from 'next/image';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

type RaceStatus = 'waiting' | 'running' | 'finished';

type RaceData = {
  name: string;
  paragraphText: string;
  host: string;
  status: RaceStatus;
  startTime: { toDate: () => Date } | null;
  winnerId: string | null;
};

type PlayerData = {
  id: string;
  username: string;
  progress: number;
  wpm: number;
  finishedTime: number | null;
  photoURL?: string;
};

type RaceProps = {
  raceId: string;
  onLeave: () => void;
};

const Race = ({ raceId, onLeave }: RaceProps) => {
  const firestore = useFirestore();
  const { user } = useUser();

  const raceRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'races', raceId) : null),
    [firestore, raceId]
  );

  const playersRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'races', raceId, 'players') : null),
    [firestore, raceId]
  );

  const { data: raceData, isLoading: isRaceLoading } = useDoc<RaceData>(raceRef);
  const { data: playersData, isLoading: arePlayersLoading } = useCollection<PlayerData>(playersRef);

  const localPlayerRef = useMemoFirebase(
    () =>
      user && firestore
        ? doc(firestore, 'races', raceId, 'players', user.uid)
        : null,
    [firestore, raceId, user]
  );

  const [userInput, setUserInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const text = raceData?.paragraphText || '';
  const status = raceData?.status || 'waiting';

  const localPlayer = useMemo(
    () => playersData?.find(p => p.id === user?.uid),
    [playersData, user]
  );

  const isFinished = !!localPlayer?.finishedTime;

  /* ------------------ DERIVED DATA ------------------ */

  const sortedPlayers = useMemo(
    () =>
      playersData
        ? [...playersData].sort((a, b) => {
            if (a.finishedTime && b.finishedTime) return a.finishedTime - b.finishedTime;
            if (a.finishedTime) return -1;
            if (b.finishedTime) return 1;
            return b.progress - a.progress;
          })
        : [],
    [playersData]
  );

  const winner = useMemo(
    () => playersData?.find(p => p.id === raceData?.winnerId),
    [playersData, raceData]
  );

  const accuracy = useMemo(() => {
    if (!text || !userInput) return 0;
    const correct = userInput
      .split('')
      .filter((char, i) => char === text[i]).length;
    return Math.round((correct / userInput.length) * 100);
  }, [text, userInput]);

  const { wpm, progress } = useMemo(() => {
    if (status !== 'running' || !raceData?.startTime || !text) return { wpm: 0, progress: 0 };

    const start = raceData.startTime.toDate().getTime();
    const minutes = (Date.now() - start) / 1000 / 60;
    if (minutes <= 0) return { wpm: 0, progress: 0 };

    const wordsTyped = userInput.length / 5;
    const currentWpm = Math.round(wordsTyped / minutes);

    return {
      wpm: currentWpm,
      progress: Math.min(
        100,
        Math.round((userInput.length / text.length) * 100)
      ),
    };
  }, [userInput, text, raceData, status]);

  const characters = useMemo(
    () =>
      text.split('').map((char, index) => {
        let state: 'correct' | 'incorrect' | 'untyped' = 'untyped';
        if (index < userInput.length) {
          state = char === userInput[index] ? 'correct' : 'incorrect';
        }
        return { char, state };
      }),
    [text, userInput]
  );

  /* ------------------ EFFECTS ------------------ */

  useEffect(() => {
    if (status === 'running' && !isFinished) {
      inputRef.current?.focus();
    }
  }, [status, isFinished]);
  
  useEffect(() => {
    // Only update progress if the game is running and the player hasn't finished
    if (status === 'running' && localPlayerRef && !isFinished && progress > 0) {
      const updatePayload = {
        progress,
        wpm,
      };
      updateDocumentNonBlocking(localPlayerRef, updatePayload);
    }
  }, [status, localPlayerRef, isFinished, progress, wpm]);


  /* ------------------ HANDLERS ------------------ */

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isFinished || status !== 'running' || !localPlayerRef || !raceRef || !firestore) return;

    const value = e.target.value;
    setUserInput(value);

    if (value.length === text.length && text.length > 0) {
      const start = raceData?.startTime?.toDate().getTime();
      if (!start) return;

      const duration = (Date.now() - start) / 1000; // in seconds
      const correctChars = value.split('').filter((char, i) => char === text[i]).length;
      const finalWpm = Math.round((correctChars / 5) / (duration / 60));

      // Mark the local player as finished
      await updateDoc(localPlayerRef, {
        finishedTime: duration,
        progress: 100,
        wpm: finalWpm,
      });

      // Atomically try to become the winner
      // This update will only succeed if winnerId is currently null
      if (!raceData.winnerId) {
        updateDocumentNonBlocking(raceRef, {
            status: 'finished',
            winnerId: user?.uid,
        });
      }
    }
  };
  
  const startGame = () => {
    if (status === 'waiting' && raceData?.host === user?.displayName && raceRef) {
      updateDocumentNonBlocking(raceRef, {
        status: 'running',
        startTime: serverTimestamp(),
      });
    }
  };

  /* ------------------ UI ------------------ */

  if (isRaceLoading || arePlayersLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        Setting up the race...
      </div>
    );
  }

  return (
    <Card className="w-full border-2 shadow-lg">
      <CardContent className="p-6">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tighter text-primary">
              {raceData?.name}
            </h2>
            <p className="text-sm text-muted-foreground">Race ID: {raceId}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge
              className="capitaize text-sm font-semibold"
              variant={status === 'running' ? 'destructive' : 'default'}
            >
              {status}
            </Badge>
            <Button size="sm" variant="outline" onClick={onLeave}>
              <LogOut className="mr-2 h-4 w-4" /> Leave Race
            </Button>
          </div>
        </div>

        <div className="mb-8 space-y-4">
          {sortedPlayers.map(player => (
            <div key={player.id} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Image
                    src={
                      player.photoURL ||
                      `https://picsum.photos/seed/${player.username}/40/40`
                    }
                    alt={player.username}
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                  <span className="font-medium">
                    {player.username} {player.id === user?.uid && '(You)'}
                  </span>
                  {player.finishedTime && (
                    <Badge variant="secondary">Finished!</Badge>
                  )}
                </div>
                <span className="font-mono font-semibold text-primary">
                  {player.wpm} WPM
                </span>
              </div>
              <Progress value={player.progress} className="h-3" />
            </div>
          ))}
        </div>

        <div
          className="relative mt-6 rounded-lg bg-muted/30 p-4 font-mono text-lg leading-relaxed tracking-wide"
          onClick={() => inputRef.current?.focus()}
        >
          <input
            ref={inputRef}
            value={userInput}
            onChange={handleInputChange}
            className="absolute inset-0 cursor-text opacity-0"
            disabled={isFinished || status !== 'running'}
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
          />

          {characters.map(({ char, state }, i) => (
            <span
              key={i}
              className={cn({
                'text-muted-foreground/70': state === 'untyped',
                'text-primary': state === 'correct',
                'text-destructive underline': state === 'incorrect',
                relative:
                  userInput.length === i && status === 'running' && !isFinished,
              })}
            >
              {userInput.length === i &&
                status === 'running' &&
                !isFinished && (
                  <span className="animate-ping absolute left-0 top-0 inline-flex h-full w-px bg-primary opacity-75"></span>
                )}
              {char === ' ' && state === 'incorrect' ? (
                <span className="rounded-[2px] bg-destructive/20">&nbsp;</span>
              ) : (
                char
              )}
            </span>
          ))}

          {status === 'waiting' && (
            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/80">
              {raceData?.host === user?.displayName ? (
                <Button onClick={startGame} size="lg">
                  Start Race
                </Button>
              ) : (
                <p className="animate-pulse text-lg font-semibold text-primary">
                  Waiting for host to start...
                </p>
              )}
            </div>
          )}
        </div>

        {isFinished && (
          <div className="mt-6 rounded-lg bg-background p-4 text-center">
            <h2 className="text-3xl font-bold text-primary">You Finished!</h2>
             {winner?.id === user?.uid && status === 'finished' && (
                <div className="mb-4 mt-2 flex items-center justify-center gap-2 text-yellow-500">
                    <Trophy className="h-8 w-8" />
                    <p className="text-2xl font-bold">You Won!</p>
                </div>
            )}
            <div className="my-6 flex justify-center gap-8">
              <div className="text-primary">
                <p className="text-sm text-muted-foreground">WPM</p>
                <p className="font-mono text-4xl font-bold">
                  {localPlayer?.wpm}
                </p>
              </div>
              <div className="text-primary">
                <p className="text-sm text-muted-foreground">Accuracy</p>
                <p className="font-mono text-4xl font-bold">{accuracy}%</p>
              </div>
            </div>
            {status === 'finished' && winner && winner.id !== user?.uid && (
                 <p className="mb-4 text-lg text-muted-foreground">{winner.username} won the race!</p>
            )}
            <Button className="mt-4" onClick={onLeave}>
              <RefreshCw className="mr-2 h-4 w-4" /> New Race
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Race;

    