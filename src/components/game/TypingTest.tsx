
'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getRandomParagraph } from '@/lib/paragraphs';
import { cn } from '@/lib/utils';
import { RefreshCw, Zap, Target } from 'lucide-react';
import Link from 'next/link';
import { useFirestore, useUser } from '@/firebase';
import {
  writeBatch,
  doc,
  serverTimestamp,
  runTransaction,
  collection,
} from 'firebase/firestore';

type GameStatus = 'waiting' | 'running' | 'finished';

const TypingTest = () => {
  const [text, setText] = useState('');
  const [userInput, setUserInput] = useState('');
  const [status, setStatus] = useState<GameStatus>('waiting');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const firestore = useFirestore();
  const { user } = useUser();
  const [lastParagraphId, setLastParagraphId] = useState<string | null>(null);

  const newGame = async () => {
    if (!firestore) return;
    const { paragraph, id } = await getRandomParagraph(firestore, lastParagraphId);
    setText(paragraph);
    setLastParagraphId(id);
    setUserInput('');
    setStatus('waiting');
    setStartTime(null);
    setEndTime(null);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  useEffect(() => {
    if (firestore) {
      newGame();
    }
  }, [firestore]);

  const { wpm, accuracy } = useMemo(() => {
    if (status !== 'running' && status !== 'finished') return { wpm: 0, accuracy: 0 };
    
    const durationInMinutes = ((endTime ?? Date.now()) - (startTime ?? Date.now())) / 1000 / 60;
    if (durationInMinutes <= 0) return { wpm: 0, accuracy: 0 };

    const correctChars = userInput.split('').filter((char, index) => char === text[index]).length;
    
    const wpm = Math.round((correctChars / 5) / durationInMinutes);

    const typedChars = userInput.length;
    const accuracy = typedChars > 0 ? Math.round((correctChars / typedChars) * 100) : 0;
    
    return { wpm, accuracy };
  }, [userInput, text, startTime, endTime, status]);

  useEffect(() => {
    if (status === 'running' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [status]);
  
  const handleGameFinish = async () => {
    setEndTime(Date.now());

    if (!user || !firestore) return;

    try {
        await runTransaction(firestore, async (transaction) => {
            const userRef = doc(firestore, 'users', user.uid);
            const userDoc = await transaction.get(userRef);

            if (!userDoc.exists()) {
                throw "User document does not exist!";
            }
            
            const gamesPlayed = (userDoc.data().gamesPlayed || 0) + 1;
            const currentHighestWPM = userDoc.data().highestWPM || 0;
            const newHighestWPM = Math.max(currentHighestWPM, wpm);

            // Update user's main profile stats
            transaction.update(userRef, {
                gamesPlayed: gamesPlayed,
                highestWPM: newHighestWPM
            });

            // Create a record for the game in a subcollection
            const gameRef = doc(collection(firestore, 'users', user.uid, 'games'));
            transaction.set(gameRef, {
                score: wpm,
                accuracy: accuracy,
                timestamp: serverTimestamp()
            });

            // Also create a leaderboard entry
            if(wpm > 0) {
              const leaderboardRef = doc(collection(firestore, "leaderboard"));
              transaction.set(leaderboardRef, {
                  userId: user.uid,
                  username: user.displayName,
                  photoURL: user.photoURL,
                  score: wpm,
                  accuracy: accuracy,
                  timestamp: serverTimestamp(),
              });
            }
        });
    } catch (e) {
        console.error("Game finish transaction failed: ", e);
    }
  };


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (status === 'waiting' && value.length > 0) {
      setStatus('running');
      setStartTime(Date.now());
    }

    if (status !== 'finished') {
      setUserInput(value);

      if (value.length === text.length) {
        setStatus('finished');
        handleGameFinish(); // Call the finish handler
      }
    }
  };

  const characters = useMemo(() => {
    return text.split('').map((char, index) => {
      let state: 'correct' | 'incorrect' | 'untyped' = 'untyped';
      if (index < userInput.length) {
        state = char === userInput[index] ? 'correct' : 'incorrect';
      }
      return { char, state };
    });
  }, [text, userInput]);

  return (
    <Card className="w-full relative shadow-lg">
      <CardContent className="p-4 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-4 sm:gap-8">
            <div className="flex items-center gap-1 sm:gap-2 text-primary">
              <Zap className="h-5 w-5" />
              <span className="text-lg sm:text-2xl font-bold font-mono">{wpm} WPM</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 text-primary">
              <Target className="h-5 w-5" />
              <span className="text-lg sm:text-2xl font-bold font-mono">{accuracy}%</span>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={newGame}>
            <RefreshCw className="h-5 w-5" />
          </Button>
        </div>

        <div
          className="text-xl sm:text-2xl tracking-wider leading-relaxed text-left p-4 rounded-md bg-muted/20 relative"
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
            disabled={status === 'finished'}
          />
          {characters.map(({ char, state }, index) => (
            <span
              key={index}
              className={cn({
                'text-muted-foreground': state === 'untyped',
                'text-primary': state === 'correct',
                'text-destructive': state === 'incorrect',
                'relative': userInput.length === index,
              })}
            >
              {userInput.length === index && status === 'running' && (
                <span className="animate-ping absolute inline-flex h-full w-[2px] bg-primary opacity-75"></span>
              )}
               {char === ' ' && state === 'incorrect' ? (
                 <span className="bg-destructive/20 rounded-[2px]">&nbsp;</span>
               ) : (
                 char
               )}
            </span>
          ))}
          {status === 'waiting' && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-md">
              {text ? <p className="text-lg text-primary animate-pulse">Start typing to begin...</p> : <p className="text-lg text-primary">Loading...</p>}
            </div>
          )}
        </div>
        {status === 'finished' && (
          <div className="mt-6 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-2">Race Complete!</h2>
            <div className="flex justify-center gap-4 sm:gap-8 mb-6">
                <div className="text-primary">
                    <p className="text-xs sm:text-sm text-muted-foreground">WPM</p>
                    <p className="text-3xl sm:text-4xl font-bold font-mono">{wpm}</p>
                </div>
                <div className="text-primary">
                    <p className="text-xs sm:text-sm text-muted-foreground">Accuracy</p>
                    <p className="text-3xl sm:text-4xl font-bold font-mono">{accuracy}%</p>
                </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4">
              <Button onClick={newGame} size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                <RefreshCw className="mr-2 h-4 w-4" /> Play Again
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/leaderboard">View Leaderboard</Link>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TypingTest;

    