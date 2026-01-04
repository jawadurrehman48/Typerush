
'use client';

import Image from 'next/image';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/layout/Header';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo } from 'react';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';

type LeaderboardEntry = {
  id: string;
  username: string;
  score: number;
  accuracy: number;
  timestamp: { toDate: () => Date };
  photoURL?: string | null;
};

const rankColor = (rank: number) => {
  if (rank === 1) return 'bg-yellow-400/80 text-yellow-900 border-yellow-400';
  if (rank === 2) return 'bg-gray-300/80 text-gray-900 border-gray-400';
  if (rank === 3) return 'bg-yellow-600/50 text-yellow-800 border-yellow-600';
  return 'bg-primary/10 text-primary border-primary/20';
};

export default function LeaderboardPage() {
  const firestore = useFirestore();

  const leaderboardQuery = useMemoFirebase(
    () =>
      firestore
        ? query(collection(firestore, 'leaderboard'), orderBy('score', 'desc'), limit(10))
        : null,
    [firestore]
  );
  
  const { data: leaderboardData, isLoading } = useCollection<LeaderboardEntry>(leaderboardQuery);

  const formattedData = useMemo(() => {
    return leaderboardData?.map((entry, index) => ({
      ...entry,
      rank: index + 1,
      date: entry.timestamp?.toDate().toLocaleDateString() ?? 'N/A',
    })) ?? [];
  }, [leaderboardData]);


  return (
    <>
    <Header />
    <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-center text-4xl font-bold tracking-tighter text-primary sm:text-5xl">
        Top Rushers
      </h1>
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Global Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px] text-center">Rank</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead className="text-right">WPM</TableHead>
                  <TableHead className="text-right">Accuracy</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && Array.from({length: 10}).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className='text-center'><Skeleton className="h-8 w-8 rounded-full mx-auto" /></TableCell>
                    <TableCell>
                      <div className='flex items-center gap-3'>
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <Skeleton className="h-6 w-24" />
                      </div>
                    </TableCell>
                    <TableCell className='text-right'><Skeleton className="h-6 w-8 ml-auto" /></TableCell>
                    <TableCell className='text-right'><Skeleton className="h-6 w-8 ml-auto" /></TableCell>
                    <TableCell className='text-right hidden sm:table-cell'><Skeleton className="h-6 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))}
                {formattedData.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={`font-bold text-base p-1.5 sm:text-lg sm:p-2 justify-center ${rankColor(entry.rank)}`}>
                        {entry.rank}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Image
                          src={entry.photoURL ?? `https://picsum.photos/seed/${entry.username}/40/40`}
                          alt={entry.username}
                          width={40}
                          height={40}
                          className="rounded-full"
                          data-ai-hint="person portrait"
                        />
                        <span className="font-medium truncate">{entry.username}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-base sm:text-lg text-accent">{entry.score}</TableCell>
                    <TableCell className="text-right font-mono text-base sm:text-lg">{entry.accuracy}%</TableCell>
                    <TableCell className="text-right text-muted-foreground hidden sm:table-cell">{entry.date}</TableCell>
                  </TableRow>
                ))}
                {!isLoading && formattedData.length === 0 && (
                  <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                          No scores on the leaderboard yet. Be the first!
                      </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </main>
    </>
  );
}

    