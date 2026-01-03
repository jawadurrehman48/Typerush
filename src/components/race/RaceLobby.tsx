
'use client';

import {
  collection,
  query,
  where,
  doc,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { useCollection, useFirestore, useUser } from '@/firebase';
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
import { useMemo } from 'react';

type Race = {
  id: string;
  status: 'waiting' | 'running' | 'finished';
  players: any[];
  createdAt: any;
};

type RaceLobbyProps = {
  onJoinRace: (raceId: string) => void;
};

export default function RaceLobby({ onJoinRace }: RaceLobbyProps) {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const racesRef = collection(firestore, 'races');

  const memoizedQuery = useMemo(() => 
    query(racesRef, where('status', '==', 'waiting')),
   [racesRef]);

  const { data: races, isLoading } = useCollection<Race>(memoizedQuery);

  const createRace = async () => {
    if (!user) return;

    const { paragraph, id: paragraphId } = await getRandomParagraph(firestore);

    const newRace = {
      paragraphId: paragraphId,
      paragraphText: paragraph,
      status: 'waiting',
      startTime: null,
      winnerId: null,
      createdAt: serverTimestamp(),
    };

    const raceDocRef = await addDoc(racesRef, newRace);
    joinRace(raceDocRef.id);
  };

  const joinRace = (raceId: string) => {
    if (!user || !user.displayName) {
        console.error("User not logged in or display name not set.");
        return;
    };

    const playerRef = doc(firestore, 'races', raceId, 'players', user.uid);
    const playerData = {
      id: user.uid,
      username: user.displayName,
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
        <Button onClick={createRace}>
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
            {races && races.length > 0 ? (
              races.map((race) => (
                <TableRow key={race.id}>
                  <TableCell>Anonymous</TableCell>
                  <TableCell>1 / 5</TableCell>
                  <TableCell>
                    {race.createdAt?.toDate().toLocaleTimeString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => joinRace(race.id)}
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
