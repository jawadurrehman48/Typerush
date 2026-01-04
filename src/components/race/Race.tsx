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
import { LogOut, Trophy, Check, Copy, Crown } from 'lucide-react';
import { Badge } from '../ui/badge';
import Image from 'next/image';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { toast } from '@/hooks/use-toast';


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
  accuracy: number;
  photoURL?: string;
};

type RaceProps = {
  raceId: string;
  onLeave: () => void;
};

const Race = ({ raceId, onLeave }: RaceProps) => {
  const firestore = useFirestore();
  const { user } = useUser();

  const [copied, setCopied] = useState(false);

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
    if (!text || !userInput) return localPlayer?.accuracy ?? 0;
    const correct = userInput
      .split('')
      .filter((char, i) => char === text[i]).length;
    return Math.round((correct / userInput.length) * 100) || 0;
  }, [text, userInput, localPlayer]);

  const { wpm, progress } = useMemo(() => {
    if (status !== 'running' || !raceData?.startTime || !text) return { wpm: localPlayer?.wpm ?? 0, progress: localPlayer?.progress ?? 0 };

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
  }, [userInput, text, raceData, status, localPlayer]);

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
    if (status === 'running' && localPlayerRef && !isFinished && progress >= 0) {
      const updatePayload = {
        progress,
        wpm,
        accuracy
      };
      updateDocumentNonBlocking(localPlayerRef, updatePayload);
    }
  }, [status, localPlayerRef, isFinished, progress, wpm, accuracy]);


  /* ------------------ HANDLERS ------------------ */

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isFinished || status !== 'running' || !localPlayerRef || !raceRef || !firestore || !raceData) return;

    const value = e.target.value;
    setUserInput(value);

    if (value.length === text.length && text.length > 0) {
      const start = raceData?.startTime?.toDate().getTime();
      if (!start) return;

      const duration = (Date.now() - start) / 1000; // in seconds
      const correctChars = value.split('').filter((char, i) => char === text[i]).length;
      const finalWpm = Math.round((correctChars / 5) / (duration / 60));
      const finalAccuracy = Math.round((correctChars / value.length) * 100);

      const finalPlayerUpdate = {
        finishedTime: duration,
        progress: 100,
        wpm: finalWpm,
        accuracy: finalAccuracy,
      };

      await updateDoc(localPlayerRef, finalPlayerUpdate);

      // Atomically set winner if not already set
      if (raceData && !raceData.winnerId && user) {
        // We use the non-blocking version because another user might be finishing at the same time
        // The security rule is what actually enforces the atomic "first-write-wins"
        updateDocumentNonBlocking(raceRef, {
            winnerId: user.uid,
            status: 'finished',
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

  const copyRaceId = () => {
    navigator.clipboard.writeText(raceId);
    setCopied(true);
    toast({ title: "Race ID copied!" });
    setTimeout(() => setCopied(false), 2000);
  };

  /* ------------------ RENDER LOGIC ------------------ */

  if (isRaceLoading || arePlayersLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        Setting up the race...
      </div>
    );
  }

  // Final Results View
  if (raceData?.winnerId) {
    return (
        <Card className="w-full border-2 shadow-lg">
            <CardContent className="p-4 sm:p-6">
                <div className="text-center mb-6">
                    <h2 className="text-2xl sm:text-3xl font-bold text-primary">Race Finished!</h2>
                    {winner ? (
                        <div className="flex items-center justify-center gap-2 mt-2 text-yellow-500">
                            <Trophy className="h-6 w-6 sm:h-7 sm:w-7" />
                            <p className="text-lg sm:text-xl font-bold">{winner.username} won!</p>
                        </div>
                    ) : (
                        <p className="text-lg mt-2">The race is over.</p>
                    )}
                </div>

                <div className="space-y-3">
                    {sortedPlayers.map((player, index) => (
                        <Card key={player.id} className={cn("flex items-center justify-between p-2 sm:p-3", player.id === winner?.id && 'border-yellow-500 border-2')}>
                            <div className="flex items-center gap-2 sm:gap-4">
                                <span className="text-lg sm:text-xl font-bold w-5 sm:w-6 text-center">{index + 1}</span>
                                <Image src={player.photoURL || `https://picsum.photos/seed/${player.username}/40/40`} alt={player.username} width={40} height={40} className="rounded-full w-8 h-8 sm:w-10 sm:h-10" />
                                <div>
                                    <p className="font-semibold text-sm sm:text-base">{player.username} {player.id === user?.uid && '(You)'}</p>
                                    <p className="text-xs sm:text-sm text-muted-foreground">{player.finishedTime ? `${player.finishedTime.toFixed(2)}s` : 'DNF'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 sm:gap-6 font-mono text-right">
                                <div>
                                    <p className="text-xs sm:text-sm text-muted-foreground">WPM</p>
                                    <p className="text-base sm:text-lg font-bold text-primary">{player.wpm}</p>
                                </div>
                                <div>
                                    <p className="text-xs sm:text-sm text-muted-foreground">Acc</p>
                                    <p className="text-base sm:text-lg font-bold">{player.accuracy}%</p>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                <div className="text-center mt-8">
                    <Button size="lg" onClick={onLeave}>Find New Race</Button>
                </div>
            </CardContent>
        </Card>
    );
  }

  // Active Race or Lobby View
  return (
    <Card className="w-full border-2 shadow-lg">
      <CardContent className="p-4 sm:p-6">
        <div className="mb-6 flex flex-col sm:flex-row items-start justify-between gap-4">
          <div className="flex flex-col">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tighter text-primary">
              {raceData?.name}
            </h2>
            <div className="flex items-center gap-1">
                <p className="text-xs sm:text-sm font-mono text-muted-foreground">ID: {raceId}</p>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copyRaceId}>
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
            </div>
          </div>
          <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 w-full sm:w-auto justify-between">
            <Badge
              className="capitalize text-sm font-semibold"
              variant={status === 'running' ? 'destructive' : 'default'}
            >
              {status}
            </Badge>
            <Button size="sm" variant="outline" onClick={onLeave}>
              <LogOut className="mr-2 h-4 w-4" /> Leave
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
                  <span className="font-medium truncate max-w-[120px] sm:max-w-none">
                    {player.id === raceData?.host && <Crown className="h-4 w-4 inline-block mr-1 text-yellow-500" />}
                    {player.username} {player.id === user?.uid && '(You)'}
                  </span>
                  {player.finishedTime && (
                    <Badge variant="secondary" className="text-xs">Finished!</Badge>
                  )}
                </div>
                <span className="font-mono font-semibold text-primary">
                  {player.wpm} WPM
                </span>
              </div>
              <Progress value={player.progress} className="h-2 sm:h-3" />
            </div>
          ))}
        </div>

        <div
          className="relative mt-6 rounded-lg bg-muted/30 p-3 sm:p-4 font-mono text-base sm:text-lg leading-relaxed tracking-wide break-words"
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
                <p className="animate-pulse text-base sm:text-lg font-semibold text-primary text-center p-4">
                  Waiting for host to start...
                </p>
              )}
            </div>
          )}
        </div>

        {isFinished && status === 'running' && (
          <div className="mt-6 rounded-lg bg-background p-4 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-primary">You Finished!</h2>
            <p className="text-base sm:text-lg text-muted-foreground mt-2">Waiting for other players to finish...</p>
            <div className="my-6 flex justify-center gap-4 sm:gap-8">
              <div className="text-primary">
                <p className="text-xs sm:text-sm text-muted-foreground">Your WPM</p>
                <p className="font-mono text-3xl sm:text-4xl font-bold">
                  {localPlayer?.wpm}
                </p>
              </div>
              <div className="text-primary">
                <p className="text-xs sm:text-sm text-muted-foreground">Your Accuracy</p>
                <p className="font-mono text-3xl sm:text-4xl font-bold">{accuracy}%</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Race;
