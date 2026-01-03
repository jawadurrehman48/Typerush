'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  doc,
  collection,
  serverTimestamp,
} from 'firebase/firestore';
import {
  useFirestore,
  useUser,
  useDoc,
  useCollection,
  useMemoFirebase,
} from '@/firebase';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { RefreshCw, LogOut, Trophy } from 'lucide-react';
import { Badge } from '../ui/badge';
import Image from 'next/image';

type RaceStatus = 'waiting' | 'running' | 'finished';

type RaceData = {
  name: string;
  paragraphText: string;
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
    () => doc(firestore, 'races', raceId),
    [firestore, raceId]
  );

  const playersRef = useMemoFirebase(
    () => collection(firestore, 'races', raceId, 'players'),
    [firestore, raceId]
  );

  const { data: raceData, isLoading: isRaceLoading } =
    useDoc<RaceData>(raceRef);

  const { data: playersData, isLoading: arePlayersLoading } =
    useCollection<PlayerData>(playersRef);

  const localPlayerRef = useMemoFirebase(
    () =>
      user
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

  /* ------------------ DERIVED DATA (ALL HOOKS FIRST) ------------------ */

  const sortedPlayers = useMemo(
    () =>
      playersData
        ? [...playersData].sort((a, b) => b.progress - a.progress)
        : [],
    [playersData]
  );

  const winner = useMemo(
    () => playersData?.find(p => p.id === raceData?.winnerId),
    [playersData, raceData]
  );

  const accuracy = useMemo(() => {
    if (!isFinished || !text || !userInput) return 0;
    const correct = userInput
      .split('')
      .filter((char, i) => char === text[i]).length;
    return Math.round((correct / text.length) * 100);
  }, [isFinished, text, userInput]);

  const { wpm, progress } = useMemo(() => {
    if (!raceData?.startTime || !text) return { wpm: 0, progress: 0 };

    const start = raceData.startTime.toDate().getTime();
    const minutes = (Date.now() - start) / 1000 / 60;
    if (minutes <= 0) return { wpm: 0, progress: 0 };

    const correct = userInput
      .split('')
      .filter((char, i) => char === text[i]).length;

    return {
      wpm: Math.round((correct / 5) / minutes),
      progress: Math.min(
        100,
        Math.round((userInput.length / text.length) * 100)
      ),
    };
  }, [userInput, text, raceData]);

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
    if (status === 'running' && localPlayerRef && !isFinished) {
      updateDocumentNonBlocking(localPlayerRef, { progress, wpm });
    }
  }, [status, localPlayerRef, isFinished, progress, wpm]);

  /* ------------------ EARLY RETURN (SAFE) ------------------ */

  if (isRaceLoading || arePlayersLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        Setting up the race...
      </div>
    );
  }

  /* ------------------ HANDLERS ------------------ */

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isFinished || status !== 'running') return;

    const value = e.target.value;
    setUserInput(value);

    if (value.length === text.length && text.length > 0) {
      const start = raceData?.startTime?.toDate().getTime();
      if (!start) return;

      const duration = (Date.now() - start) / 1000;
      const correct = value
        .split('')
        .filter((char, i) => char === text[i]).length;

      const finalWpm = Math.round((correct / 5) / (duration / 60));

      localPlayerRef &&
        updateDocumentNonBlocking(localPlayerRef, {
          finishedTime: duration,
          progress: 100,
          wpm: finalWpm,
        });

      if (!raceData?.winnerId) {
        updateDocumentNonBlocking(raceRef, {
          status: 'finished',
          winnerId: user?.uid,
        });
      }
    }
  };

  const startGame = () => {
    if (status === 'waiting' && raceData?.host === user?.displayName) {
      updateDocumentNonBlocking(raceRef, {
        status: 'running',
        startTime: serverTimestamp(),
      });
    }
  };

  /* ------------------ UI ------------------ */

  return (
    <Card className="w-full shadow-lg border-2">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tighter text-primary">{raceData?.name}</h2>
            <p className="text-sm text-muted-foreground">Race ID: {raceId}</p>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <Badge className="capitalize text-sm font-semibold" variant={status === 'running' ? 'destructive' : 'default'}>{status}</Badge>
            <Button size="sm" variant="outline" onClick={onLeave}>
              <LogOut className="mr-2 h-4 w-4" /> Leave Race
            </Button>
          </div>
        </div>

        <div className='space-y-4 mb-8'>
        {sortedPlayers.map(player => (
          <div key={player.id} className="space-y-2">
            <div className="flex justify-between items-center text-sm">
                <div className='flex items-center gap-2'>
                    <Image src={player.photoURL || `https://picsum.photos/seed/${player.username}/40/40`} alt={player.username} width={24} height={24} className='rounded-full' />
                    <span className='font-medium'>{player.username} {player.id === user?.uid && '(You)'}</span>
                    {player.finishedTime && <Badge variant="secondary">Finished!</Badge>}
                </div>
              <span className='font-mono font-semibold text-primary'>{player.wpm} WPM</span>
            </div>
            <Progress value={player.progress} className='h-3' />
          </div>
        ))}
        </div>


        <div
          className="mt-6 p-4 bg-muted/30 rounded-lg relative text-lg tracking-wide leading-relaxed font-mono"
          onClick={() => inputRef.current?.focus()}
        >
          <input
            ref={inputRef}
            value={userInput}
            onChange={handleInputChange}
            className="absolute inset-0 opacity-0 cursor-text"
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
                'relative': userInput.length === i && status === 'running' && !isFinished
              })}
            >
               {userInput.length === i && status === 'running' && !isFinished && (
                  <span className="animate-ping absolute inline-flex h-full w-px bg-primary opacity-75 left-0 top-0"></span>
               )}
              {char === ' ' && state === 'incorrect' ? (
                 <span className="bg-destructive/20 rounded-[2px]">&nbsp;</span>
               ) : (
                 char
               )}
            </span>
          ))}

          {status === 'waiting' && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
                {raceData?.host === user?.displayName ? (
                    <Button onClick={startGame} size="lg">Start Race</Button>
                ) : (
                    <p className='text-lg font-semibold text-primary animate-pulse'>Waiting for host to start...</p>
                )}
            </div>
          )}
        </div>

        {isFinished && (
          <div className="text-center mt-6 p-4 rounded-lg bg-background">
            <h2 className="text-3xl font-bold mb-2 text-primary">You Finished!</h2>
             {winner?.id === user?.uid && status === 'finished' && (
                <div className="flex items-center justify-center gap-2 mb-4 text-yellow-500">
                    <Trophy className="h-8 w-8" />
                    <p className="text-2xl font-bold">You Won!</p>
                </div>
            )}
            <div className="flex justify-center gap-8 mb-6">
                <div className="text-primary">
                    <p className="text-sm text-muted-foreground">WPM</p>
                    <p className="text-4xl font-bold font-mono">{localPlayer?.wpm}</p>
                </div>
                <div className="text-primary">
                    <p className="text-sm text-muted-foreground">Accuracy</p>
                    <p className="text-4xl font-bold font-mono">{accuracy}%</p>
                </div>
            </div>
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
