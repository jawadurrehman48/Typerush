
'use client';

import { useState } from 'react';
import {
  doc,
  runTransaction,
  serverTimestamp,
  addDoc,
  collection,
  setDoc,
} from 'firebase/firestore';
import { useFirestore, useUser, useUserProfile } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getRandomParagraph } from '@/lib/paragraphs';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Swords, LogIn } from 'lucide-react';

type RaceLobbyProps = {
  onJoinRace: (raceId: string) => void;
};

export default function RaceLobby({ onJoinRace }: RaceLobbyProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { data: userProfile } = useUserProfile();
  
  const [raceName, setRaceName] = useState('');
  const [joinRaceId, setJoinRaceId] = useState('');
  
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const createRace = async () => {
    if (!user || !userProfile || !raceName.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in and provide a race name.",
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
        playerCount: 0, 
      };

      const racesCollection = collection(firestore, 'races');
      const raceDocRef = await addDoc(racesCollection, newRace);
      const newRaceId = raceDocRef.id;
      
      toast({
        title: "Race Created!",
        description: `Your race ID is ${newRaceId}. You can now join it.`,
        duration: 9000,
      });
      setRaceName(''); // Clear input after creation
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

        const raceData = raceSnap.data();
        if (raceData.status !== 'waiting') {
            throw new Error('This race has already started or is finished.');
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
            photoURL: userProfile.photoURL ?? null
          };
          transaction.set(playerDocRef, playerData);
    
          const currentCount = raceData.playerCount || 0;
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
    <Card className="w-full max-w-lg mx-auto">
      <CardContent className="p-0">
        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-14 rounded-t-lg rounded-b-none">
            <TabsTrigger value="create" className="h-full text-md font-semibold flex gap-2 items-center">
              <Swords className="h-5 w-5" /> Create Race
            </TabsTrigger>
            <TabsTrigger value="join" className="h-full text-md font-semibold flex gap-2 items-center">
              <LogIn className="h-5 w-5" /> Join Race
            </TabsTrigger>
          </TabsList>
          <TabsContent value="create" className="p-6">
            <CardHeader className="p-0 mb-4">
              <CardTitle>Create a New Race</CardTitle>
              <CardDescription>Start a new race and share the ID with your friends.</CardDescription>
            </CardHeader>
            <div className="space-y-4">
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
                {isCreating ? "Creating..." : "Create Race"}
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="join" className="p-6">
             <CardHeader className="p-0 mb-4">
                <CardTitle>Join a Race</CardTitle>
                <CardDescription>Enter the Race ID you want to join.</CardDescription>
            </CardHeader>
            <div className="space-y-4">
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
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
