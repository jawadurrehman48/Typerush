
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
  WithId,
  useMemoFirebase
} from '@/firebase';
import {
  updateDocumentNonBlocking,
} from '@/firebase/non-blocking-updates';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { RefreshCw, Zap, Target, Flag, Users, LogOut } from 'lucide-react';
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

  const raceRef = useMemoFirebase(() => doc(firestore, 'races', raceId), [firestore, raceId]);
  const playersRef = useMemoFirebase(() => collection(firestore, 'races', raceId, 'players'), [firestore, raceId]);
  
  const { data: raceData, isLoading: isRaceLoading } = useDoc<RaceData>(raceRef);
  const { data: playersData, isLoading: arePlayersLoading } = useCollection<PlayerData>(playersRef);

  const [userInput, setUserInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  const localPlayerRef = useMemoFirebase(() => user ? doc(firestore, 'races', raceId, 'players', user.uid) : null, [firestore, raceId, user]);
  
  const text = raceData?.paragraphText || '';
  const status = raceData?.status || 'waiting';

  const localPlayer = useMemo(() => playersData?.find((p) => p.id === user?.uid), [playersData, user]);
  const isFinished = localPlayer && localPlayer.finishedTime !== null;

  // Focus input when race starts
  useEffect(() => {
    if (status === 'running' && !isFinished && inputRef.current) {
      inputRef.current.focus();
    }
  }, [status, isFinished]);


  const { wpm, progress } = useMemo(() => {
    if (!raceData || !raceData.startTime || !text) return { wpm: 0, progress: 0 };
    
    const startTime = raceData.startTime.toDate().getTime();
    const durationInMinutes = (Date.now() - startTime) / 1000 / 60;
    if (durationInMinutes === 0) return { wpm: 0, progress: 0 };
  
    const correctChars = userInput.split('').filter((char, index) => char === text[index]).length;
    const wpm = Math.round((correctChars / 5) / durationInMinutes);
    const progress = userInput.length > 0 ? Math.round((userInput.length / text.length) * 100) : 0;
  
    return { wpm, progress };
  }, [userInput, text, raceData]);

  // Update player progress in Firestore
  useEffect(() => {
    if (status === 'running' && localPlayerRef && !isFinished) {
      updateDocumentNonBlocking(localPlayerRef, { progress, wpm });
    }
  }, [progress, wpm, status, localPlayerRef, isFinished]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isFinished || status !== 'running') return;
    
    const value = e.target.value;
    setUserInput(value);

    // FINISH condition
    if (value.length === text.length && text.length > 0) {
      const endTime = Date.now();
      const startTime = raceData?.startTime?.toDate().getTime();
      const finishedTime = (endTime - startTime!) / 1000;
      
      const correctChars = value.split('').filter((char, index) => char === text[index]).length;
      const finalWpm = Math.round((correctChars / 5) / (finishedTime / 60));

      if (localPlayerRef) {
        updateDocumentNonBlocking(localPlayerRef, { finishedTime, progress: 100, wpm: finalWpm });
      }

      // If this is the first player to finish, update the race status
      if (!raceData?.winnerId) {
        updateDocumentNonBlocking(raceRef, { status: 'finished', winnerId: user?.uid });
      }
    }
  };
  
  const startGame = () => {
    if(status === 'waiting') {
        updateDocumentNonBlocking(raceRef, { status: 'running', startTime: serverTimestamp() });
    }
  }

  const characters = useMemo(() => {
    return text.split('').map((char, index) => {
      let state: 'correct' | 'incorrect' | 'untyped' = 'untyped';
      if (index < userInput.length) {
        state = char === userInput[index] ? 'correct' : 'incorrect';
      }
      return { char, state };
    });
  }, [text, userInput]);

  if (isRaceLoading || arePlayersLoading) {
    return <div className="flex justify-center items-center h-48">Setting up the race...</div>;
  }
  
  const sortedPlayers = playersData ? [...playersData].sort((a,b) => b.progress - a.progress) : [];
  const winner = useMemo(() => playersData?.find(p => p.id === raceData?.winnerId), [playersData, raceData]);

  const accuracy = useMemo(() => {
    if (!isFinished || !text || !userInput) return 0;
    const correctChars = userInput.split('').filter((char, index) => char === text[index]).length;
    return Math.round((correctChars / text.length) * 100);
  }, [isFinished, text, userInput]);

  return (
    <Card className="w-full relative shadow-lg">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
            <div>
                <h2 className="text-2xl font-bold text-primary mb-1">{raceData?.name || 'Race Track'}</h2>
                <p className="text-sm text-muted-foreground mb-4">Race ID: {raceId}</p>
                <div className="space-y-3 w-full">
                    {sortedPlayers.map((player) => (
                        <div key={player.id}>
                            <div className="flex justify-between mb-1">
                                <span className="text-base font-medium text-primary flex items-center">
                                    {player.username} {player.id === user?.uid && '(You)'}
                                    {winner?.id === player.id && <Badge className='ml-2 bg-yellow-400 text-yellow-900'>Winner!</Badge>}
                                    {player.finishedTime && winner?.id !== player.id && <Badge variant="secondary" className='ml-2'>Finished</Badge>}
                                </span>
                                <span className="text-sm font-medium text-accent">{player.wpm} WPM</span>
                            </div>
                            <Progress value={player.progress} className="w-full" />
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex flex-col items-end gap-2">
                <Badge variant={status === 'running' ? 'default' : 'secondary'} className="capitalize">{status}</Badge>
                <Button variant="outline" size="sm" onClick={onLeave}><LogOut className="mr-2 h-4 w-4" /> Leave</Button>
            </div>
        </div>

        <div
          className="text-2xl tracking-wider leading-relaxed text-left p-4 rounded-md bg-muted/20 relative"
          onClick={() => inputRef.current?.focus()}
        >
          <input
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={handleInputChange}
            className="absolute inset-0 opacity-0 cursor-text"
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
            disabled={isFinished || status !== 'running'}
          />
          {characters.map(({ char, state }, index) => (
            <span
              key={index}
              className={cn({
                'text-muted-foreground': state === 'untyped',
                'text-primary': state === 'correct',
                'text-destructive': state === 'incorrect',
                'relative': userInput.length === index && !isFinished && status === 'running',
              })}
            >
              {userInput.length === index && !isFinished && status === 'running' && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-sm bg-primary/50 opacity-75"></span>
              )}
               {char === ' ' && state === 'incorrect' ? (
                 <span className="bg-destructive/20 rounded-[2px]"> </span>
               ) : (
                 char
               )}
            </span>
          ))}
          {status === 'waiting' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-md">
                <p className="text-lg text-primary mb-4">Waiting for the host to start the race...</p>
                <Button onClick={startGame} size="lg" disabled={user?.uid !== winner?.id && sortedPlayers[0]?.id !== user?.uid}>Start Race</Button>
            </div>
          )}
        </div>
        {isFinished && (
          <div className="mt-6 text-center">
             <h2 className="text-3xl font-bold text-primary mb-2">You Finished!</h2>
             {status === 'finished' && winner && (
                <p className="text-muted-foreground mb-4">
                  {winner.id === user?.uid ? "You won the race! 🎉" : `The winner is ${winner.username}!`}
                </p>
             )}
            <div className="flex justify-center gap-8 mb-6">
                <div className="text-primary">
                    <p className="text-sm text-muted-foreground">Your WPM</p>
                    <p className="text-4xl font-bold font-mono">{localPlayer?.wpm}</p>
                </div>
                <div className="text-primary">
                    <p className="text-sm text-muted-foreground">Your Accuracy</p>
                    <p className="text-4xl font-bold font-mono">{accuracy}%</p>
                </div>
            </div>
            <div className="flex justify-center gap-4">
              <Button onClick={onLeave} size="lg">
                <RefreshCw className="mr-2 h-4 w-4" /> Find New Race
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Race;

    