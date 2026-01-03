
'use client';

import { useState } from 'react';
import {
  doc,
  getDoc,
  setDoc,
  runTransaction,
  collection,
  serverTimestamp,
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

type JoinOrCreateRaceProps = {
  onJoinRace: (raceId: string) => void;
};

export default function JoinOrCreateRace({ onJoinRace }: JoinOrCreateRaceProps) {
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
      const { paragraph, id: paragraphId } = await getRandomParagraph(firestore);
      const uniqueRaceId = await generateUniqueRaceId();

      const newRace = {
        id: uniqueRaceId,
        paragraphId: paragraphId,
        paragraphText: paragraph,
        status: 'waiting',
        startTime: null,
        winnerId: null,
        createdAt: serverTimestamp(),
        host: userProfile.username,
        name: raceName.trim(),
        playerCount: 1, 
      };

      const raceDocRef = doc(firestore, 'races', uniqueRaceId);
      await setDoc(raceDocRef, newRace);

      const playerRef = doc(firestore, 'races', uniqueRaceId, 'players', user.uid);
      const playerData = {
        id: user.uid,
        username: userProfile.username,
        progress: 0,
        wpm: 0,
        finishedTime: null,
      };
      await setDoc(playerRef, playerData, { merge: true });
      
      setCreatedRaceId(uniqueRaceId);
      
      toast({
        title: "Race Created!",
        description: "Share the Race ID with your friends to have them join.",
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

  const handleJoinRace = async () => {
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

        // Only add player and increment count if they are not already in the race
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

  const copyToClipboard = () => {
    if (!createdRaceId) return;
    navigator.clipboard.writeText(createdRaceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
        <Tabs defaultValue="join">
             <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="join">Join Race</TabsTrigger>
                <TabsTrigger value="create">Create Race</TabsTrigger>
            </TabsList>
            <TabsContent value="join">
                <CardHeader>
                    <CardTitle>Join a Race</CardTitle>
                    <CardDescription>Enter the Race ID you received from a friend.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="space-y-2">
                        <Label htmlFor="join-race-id">Race ID</Label>
                        <Input
                        id="join-race-id"
                        placeholder="Enter 4-digit Race ID"
                        value={joinRaceId}
                        onChange={(e) => setJoinRaceId(e.target.value)}
                        disabled={isJoining}
                        maxLength={4}
                        />
                    </div>
                    <Button onClick={handleJoinRace} disabled={isJoining || !userProfile} className="w-full">
                        {isJoining ? "Joining..." : "Join Race"}
                    </Button>
                </CardContent>
            </TabsContent>
            <TabsContent value="create">
                 <CardHeader>
                    <CardTitle>Create a Race</CardTitle>
                    <CardDescription>Give your race a name to get started.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     {createdRaceId ? (
                        <div className="space-y-4 text-center">
                            <p className="text-muted-foreground">Your race has been created!</p>
                            <Label>Share this Race ID with your friends:</Label>
                             <div className="relative">
                                <Input type="text" readOnly value={createdRaceId} className="pr-10 text-center text-lg font-mono tracking-widest" />
                                <Button size="icon" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" onClick={copyToClipboard}>
                                    {copied ? <ClipboardCheck className="h-5 w-5 text-green-500" /> : <Clipboard className="h-5 w-5" />}
                                </Button>
                            </div>
                            <Button onClick={() => onJoinRace(createdRaceId)} className="w-full">
                                Go to Race
                            </Button>
                        </div>
                    ) : (
                        <>
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
                        </>
                    )}
                </CardContent>
            </TabsContent>
        </Tabs>
    </Card>
  );
}
