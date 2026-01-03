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
import { RefreshCw, LogOut } from 'lucide-react';
import { Badge } from '../ui/badge';

type RaceStatus = 'waiting' | 'running' | 'finished';

type RaceData = {
  name: string;
  paragraphText: string;
  status: RaceStatus;
  startTime: { toDate: () => Date } | null;
  winnerId: string | null;
};

type PlayerData = {
  username: string;
  progress: number;
  wpm: number;
  finishedTime: number | null;
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
    if (status === 'waiting') {
      updateDocumentNonBlocking(raceRef, {
        status: 'running',
        startTime: serverTimestamp(),
      });
    }
  };

  /* ------------------ UI ------------------ */

  return (
    <Card className="w-full shadow-lg">
      <CardContent className="p-6">
        <div className="flex justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">{raceData?.name}</h2>
            <p className="text-sm text-muted-foreground">Race ID: {raceId}</p>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <Badge className="capitalize">{status}</Badge>
            <Button size="sm" variant="outline" onClick={onLeave}>
              <LogOut className="mr-2 h-4 w-4" /> Leave
            </Button>
          </div>
        </div>

        {sortedPlayers.map(player => (
          <div key={player.id} className="mb-3">
            <div className="flex justify-between mb-1">
              <span>
                {player.username}
                {player.id === user?.uid && ' (You)'}
                {winner?.id === player.id && (
                  <Badge className="ml-2 bg-yellow-400 text-black">
                    Winner
                  </Badge>
                )}
              </span>
              <span>{player.wpm} WPM</span>
            </div>
            <Progress value={player.progress} />
          </div>
        ))}

        <div
          className="mt-6 p-4 bg-muted/20 rounded-md relative"
          onClick={() => inputRef.current?.focus()}
        >
          <input
            ref={inputRef}
            value={userInput}
            onChange={handleInputChange}
            className="absolute inset-0 opacity-0"
            disabled={isFinished || status !== 'running'}
          />

          {characters.map(({ char, state }, i) => (
            <span
              key={i}
              className={cn({
                'text-muted-foreground': state === 'untyped',
                'text-primary': state === 'correct',
                'text-destructive': state === 'incorrect',
              })}
            >
              {char}
            </span>
          ))}

          {status === 'waiting' && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <Button onClick={startGame}>Start Race</Button>
            </div>
          )}
        </div>

        {isFinished && (
          <div className="text-center mt-6">
            <h2 className="text-3xl font-bold mb-2">Finished!</h2>
            <p>WPM: {localPlayer?.wpm}</p>
            <p>Accuracy: {accuracy}%</p>
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
