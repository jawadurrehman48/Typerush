'use client';

import { useState, useMemo } from 'react';
import {
  collection,
  query,
  where,
  doc,
} from 'firebase/firestore';
import {
  useFirestore,
  useCollection,
  useUser,
  useUserProfile,
  WithId,
  useMemoFirebase,
} from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getRandomParagraph } from '@/lib/paragraphs';
import { setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Badge } from '../ui/badge';
import { toast } from '@/hooks/use-toast';

type RaceData = {
  name: string;
  host: string;
  status: 'waiting' | 'running' | 'finished';
  playerCount?: number;
};

type RaceLobbyProps = {
  onJoinRace: (raceId: string) => void;
};

export default function RaceLobby({ onJoinRace }: RaceLobbyProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { data: userProfile } = useUserProfile();

  const [raceName, setRaceName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [joiningRaceId, setJoiningRaceId] = useState<string | null>(null);

  const openRacesQuery = useMemoFirebase(
    () =>
      firestore
        ? query(collection(firestore, 'races'), where('status', '==', 'waiting'))
        : null,
    [firestore]
  );
  const { data: openRaces, isLoading: racesLoading } = useCollection<RaceData>(openRacesQuery);

  const createRace = async () => {
    if (!user || !userProfile || !raceName.trim()) return;
    setIsCreating(true);

    try {
      const { paragraph, id: paragraphId } = await getRandomParagraph(firestore);

      const newRace = {
        name: raceName.trim(),
        host: userProfile.username,
        paragraphId: paragraphId,
        paragraphText: paragraph,
        status: 'waiting',
        startTime: null,
        winnerId: null,
        createdAt: new Date(),
        playerCount: 1,
      };
      
      const racesRef = collection(firestore, 'races');
      const raceDocRef = await addDocumentNonBlocking(racesRef, newRace);
      
      if(raceDocRef) {
        const playerRef = doc(firestore, 'races', raceDocRef.id, 'players', user.uid);
        const playerData = {
          id: user.uid,
          username: userProfile.username,
          progress: 0,
          wpm: 0,
          finishedTime: null,
        };
        setDocumentNonBlocking(playerRef, playerData, { merge: true });
        onJoinRace(raceDocRef.id);
      } else {
        throw new Error("Failed to create race document.");
      }

    } catch (error) {
       toast({
        variant: "destructive",
        title: "Failed to create race",
        description: "Please try again later.",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const joinRace = (raceId: string) => {
    if (!user || !userProfile) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "You must be logged in to join a race.",
        });
        return;
    };
    
    setJoiningRaceId(raceId);

    const playerRef = doc(firestore, 'races', raceId, 'players', user.uid);
    const playerData = {
        id: user.uid,
        username: userProfile.username,
        progress: 0,
        wpm: 0,
        finishedTime: null,
    };
    
    // Join the race, then transition
    setDocumentNonBlocking(playerRef, playerData, { merge: true });
    onJoinRace(raceId);
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
          <CardTitle>Join an Open Race</CardTitle>
          <CardDescription>See who is waiting for a challenger.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Host</TableHead>
                <TableHead>Players</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {racesLoading && (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    Loading open races...
                  </TableCell>
                </TableRow>
              )}
              {!racesLoading && openRaces?.length === 0 && (
                 <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No open races found. Why not create one?
                  </TableCell>
                </TableRow>
              )}
              {openRaces?.map((race: WithId<RaceData>) => (
                <TableRow key={race.id}>
                  <TableCell className="font-medium">{race.name}</TableCell>
                  <TableCell>{race.host}</TableCell>
                   <TableCell>
                    <Badge variant="outline">{race.playerCount || 1}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      onClick={() => joinRace(race.id)}
                      disabled={joiningRaceId === race.id || !userProfile}
                      size="sm"
                    >
                      {joiningRaceId === race.id ? "Joining..." : "Join"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
