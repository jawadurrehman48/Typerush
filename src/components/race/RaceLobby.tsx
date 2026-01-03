
'use client';

import {
  collection,
  query,
  where,
  doc,
  addDoc,
  serverTimestamp,
  getDocs,
} from 'firebase/firestore';
import { useCollection, useFirestore, useUser, useMemoFirebase, useUserProfile } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getRandomParagraph } from '@/lib/paragraphs';
import { PlusCircle, ArrowRight } from 'lucide-react';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useEffect, useState } from 'react';

type Race = {
  id: string;
  status: 'waiting' | 'running' | 'finished';
  createdAt: any;
};

type RaceWithPlayerCount = Race & { playerCount: number };


type RaceLobbyProps = {
  onJoinRace: (raceId: string) => void;
};

export default function RaceLobby({ onJoinRace }: RaceLobbyProps) {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { data: userProfile } = useUserProfile();

  const racesRef = useMemoFirebase(() => collection(firestore, 'races'), [firestore]);

  const memoizedQuery = useMemoFirebase(() => 
    query(racesRef, where('status', '==', 'waiting')),
   [racesRef]);

  const { data: races, isLoading } = useCollection<Race>(memoizedQuery);
  const [racesWithCounts, setRacesWithCounts] = useState<RaceWithPlayerCount[]>([]);

  useEffect(() => {
    if (!races) return;

    const fetchPlayerCounts = async () => {
      const racesWithPlayerCounts = await Promise.all(
        races.map(async (race) => {
          const playersCol = collection(firestore, 'races', race.id, 'players');
          const snapshot = await getDocs(playersCol);
          return { ...race, playerCount: snapshot.size };
        })
      );
      setRacesWithCounts(racesWithPlayerCounts);
    };

    fetchPlayerCounts();
  }, [races, firestore]);

  const createRace = async () => {
    if (!user || !userProfile) return;

    const { paragraph, id: paragraphId } = await getRandomParagraph(firestore);

    const newRace = {
      paragraphId: paragraphId,
      paragraphText: paragraph,
      status: 'waiting',
      startTime: null,
      winnerId: null,
      createdAt: serverTimestamp(),
      host: userProfile.username,
    };

    const raceDocRef = await addDoc(racesRef, newRace);
    joinRace(raceDocRef.id);
  };

  const joinRace = (raceId: string) => {
    if (!user || !userProfile?.username) {
        console.error("User not logged in or username not available in profile.");
        return;
    };

    const playerRef = doc(firestore, 'races', raceId, 'players', user.uid);
    const playerData = {
      id: user.uid,
      username: userProfile.username,
      progress: 0,
      wpm: 0,
      finishedTime: null,
    };
    setDocumentNonBlocking(playerRef, playerData, { merge: true });
    onJoinRace(raceId);
  };

  if (isLoading || isUserLoading) {
    return <div>Loading races...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Open Races</CardTitle>
        <Button onClick={createRace} disabled={!userProfile}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Race
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Host</TableHead>
              <TableHead>Players</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {racesWithCounts && racesWithCounts.length > 0 ? (
              racesWithCounts.map((race) => (
                <TableRow key={race.id}>
                  <TableCell>{(race as any).host || 'Anonymous'}</TableCell>
                  <TableCell>{race.playerCount} / 5</TableCell>
                  <TableCell>
                    {race.createdAt?.toDate().toLocaleTimeString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => joinRace(race.id)}
                      disabled={!userProfile}
                    >
                      Join <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No open races. Why not create one?
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
