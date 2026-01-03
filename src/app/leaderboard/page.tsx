
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
import { PlaceHolderImages } from '@/lib/placeholder-images';

type LeaderboardEntry = {
  id: string;
  username: string;
  score: number;
  accuracy: number;
  timestamp: Date;
  photoURL?: string;
};

// Static data to replace Firebase queries
const staticLeaderboardData: LeaderboardEntry[] = [
  { id: '1', username: 'Speedy', score: 135, accuracy: 99, timestamp: new Date('2024-07-21T10:00:00Z'), photoURL: PlaceHolderImages[0].imageUrl },
  { id: '2', username: 'Typemaster', score: 128, accuracy: 98, timestamp: new Date('2024-07-20T11:00:00Z'), photoURL: PlaceHolderImages[1].imageUrl },
  { id: '3', username: 'Keymaster', score: 122, accuracy: 97, timestamp: new Date('2024-07-19T09:30:00Z'), photoURL: PlaceHolderImages[2].imageUrl },
  { id: '4', username: 'Flash', score: 115, accuracy: 99, timestamp: new Date('2024-07-18T14:00:00Z'), photoURL: PlaceHolderImages[3].imageUrl },
  { id: '5', username: 'Rush', score: 110, accuracy: 96, timestamp: new Date('2024-07-17T16:00:00Z'), photoURL: PlaceHolderImages[4].imageUrl },
  { id: '6', username: 'QuickFingers', score: 105, accuracy: 98, timestamp: new Date('2024-07-16T12:00:00Z') },
  { id: '7', username: 'WordNinja', score: 102, accuracy: 95, timestamp: new Date('2024-07-15T08:00:00Z') },
  { id: '8', username: 'Qwerty', score: 98, accuracy: 99, timestamp: new Date('2024-07-14T18:00:00Z') },
  { id: '9', username: 'TypoQueen', score: 95, accuracy: 94, timestamp: new Date('2024-07-13T13:00:00Z') },
  { id: '10', username: 'Pro', score: 92, accuracy: 97, timestamp: new Date('2024-07-12T20:00:00Z') },
];


const rankColor = (rank: number) => {
  if (rank === 1) return 'bg-yellow-400/80 text-yellow-900 border-yellow-400';
  if (rank === 2) return 'bg-gray-300/80 text-gray-900 border-gray-400';
  if (rank === 3) return 'bg-yellow-600/50 text-yellow-800 border-yellow-600';
  return 'bg-primary/10 text-primary border-primary/20';
};

export default function LeaderboardPage() {
  const isLoading = false; // Data is now static, so not loading

  const formattedData = useMemo(() => {
    return staticLeaderboardData.map((entry, index) => ({
      ...entry,
      rank: index + 1,
      date: entry.timestamp.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
    }));
  }, []);


  return (
    <>
    <Header />
    <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-center text-4xl font-bold tracking-tighter text-primary sm:text-5xl">
        Top Rushers
      </h1>
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Global Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px] text-center">Rank</TableHead>
                <TableHead>Player</TableHead>
                <TableHead className="text-right">WPM</TableHead>
                <TableHead className="text-right">Accuracy</TableHead>
                <TableHead className="text-right">Date</TableHead>
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
                  <TableCell className='text-right'><Skeleton className="h-6 w-24 ml-auto" /></TableCell>
                </TableRow>
              ))}
              {formattedData.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="text-center">
                    <Badge variant="outline" className={`font-bold text-lg p-2 justify-center ${rankColor(entry.rank)}`}>
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
                      <span className="font-medium">{entry.username}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-lg text-accent">{entry.score}</TableCell>
                  <TableCell className="text-right font-mono text-lg">{entry.accuracy}%</TableCell>
                  <TableCell className="text-right text-muted-foreground">{entry.date}</TableCell>
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
        </CardContent>
      </Card>
    </div>
    </>
  );
}
