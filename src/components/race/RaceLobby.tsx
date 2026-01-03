'use client';

import { useState } from 'react';
import {
  doc,
  getDoc,
  setDoc,
  runTransaction,
  serverTimestamp,
  addDoc,
  collection,
} from 'firebase/firestore';
import { useFirestore, useUser, useUserProfile } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getRandomParagraph } from '@/lib/paragraphs';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clipboard, ClipboardCheck } from 'lucide-react';
import { setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';

type RaceLobbyProps = {
  onJoinRace: (raceId: string) => void;
};

export default function RaceLobby({ onJoinRace }: RaceLobbyProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { data: userProfile } = useUserProfile();
  
  const [raceName, setRaceName] = useState('');
  const [joinRaceId, setJoinRaceId] = useState('');
  const [createdRaceId, setCreatedRaceId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const generateUniqueRaceId = async (): Promise<string> => {
    let raceId: string;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 100;

    while (!isUnique && attempts < maxAttempts) {
      raceId = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit ID
      const raceDocRef = doc(firestore, 'races', raceId);
      const docSnap = await getDoc(raceDocRef);
      if (!docSnap.exists()) {
        isUnique = true;
        return raceId;
      }
      attempts++;
    }
    
    if (attempts >= maxAttempts) {
        throw new Error("Could not find a unique race ID. Please try again.");
    }
    
    // Fallback in the unlikely event of loop failure
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  const createRace = async () => {
    if (!user || !userProfile || !raceName.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Race name is required.",
      });
      return;
    }
    
    setIsCreating(true);

    try {
      const { paragraph } = await getRandomParagraph(firestore);
      
      const newRace = {
        name: raceName.trim(),
        host: userProfile.username,
        paragraphText: paragraph,
        status: 'waiting',
        startTime: null,
        winnerId: null,
        createdAt: serverTimestamp(),
        playerCount: 1, 
      };

      const racesCollection = collection(firestore, 'races');
      const raceDocRef = await addDoc(racesCollection, newRace);
      const newRaceId = raceDocRef.id;

      const playerRef = doc(firestore, 'races', newRaceId, 'players', user.uid);
      const playerData = {
        id: user.uid,
        username: userProfile.username,
        progress: 0,
        wpm: 0,
        finishedTime: null,
      };
      await setDoc(playerRef, playerData);
      
      onJoinRace(newRaceId);
      
      toast({
        title: "Race Created!",
        description: "Your race is ready to start.",
      });
    } catch (error: any) {
       toast({
        variant: "destructive",
        title: "Failed to create race",
        description: error.message || "Please try again later.",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const joinRace = async () => {
    if (!joinRaceId.trim() || !user || !userProfile) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Race ID is required and you must be logged in.',
      });
      return;
    }
    setIsJoining(true);
  
    try {
      const raceDocRef = doc(firestore, 'races', joinRaceId.trim());
  
      await runTransaction(firestore, async (transaction) => {
        const raceSnap = await transaction.get(raceDocRef);
  
        if (!raceSnap.exists()) {
          throw new Error('Race not found. Please check the ID and try again.');
        }

        const playerDocRef = doc(firestore, 'races', joinRaceId.trim(), 'players', user.uid);
        const playerSnap = await transaction.get(playerDocRef);

        if (!playerSnap.exists()) {
          const playerData = {
            id: user.uid,
            username: userProfile.username,
            progress: 0,
            wpm: 0,
            finishedTime: null,
          };
          transaction.set(playerDocRef, playerData);
    
          const currentCount = raceSnap.data().playerCount || 0;
          transaction.update(raceDocRef, { playerCount: currentCount + 1 });
        }
      });
  
      onJoinRace(joinRaceId.trim());
  
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to join race',
        description: error.message || 'Please check the ID and try again.',
      });
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="grid gap-8 md:grid-cols-2">
         <Card>
        <CardHeader>
          <CardTitle>Create a New Race</CardTitle>
          <CardDescription>Start a new race and invite your friends.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="race-name">Race Name</Label>
            <Input
              id="race-name"
              placeholder="e.g., Friday Night Typing"
              value={raceName}
              onChange={(e) => setRaceName(e.target.value)}
              disabled={isCreating}
            />
          </div>
          <Button onClick={createRace} disabled={isCreating || !userProfile} className="w-full">
            {isCreating ? "Creating..." : "Create and Join Race"}
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
            <CardTitle>Join a Race</CardTitle>
            <CardDescription>Enter the Race ID you received from a friend.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="join-race-id">Race ID</Label>
                <Input
                id="join-race-id"
                placeholder="Enter Race ID"
                value={joinRaceId}
                onChange={(e) => setJoinRaceId(e.target.value)}
                disabled={isJoining}
                />
            </div>
            <Button onClick={joinRace} disabled={isJoining || !userProfile} className="w-full">
                {isJoining ? "Joining..." : "Join Race"}
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
