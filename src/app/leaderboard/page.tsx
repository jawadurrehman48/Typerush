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
import { useMemo } from 'react';

const STATIC_LEADERBOARD_DATA = [
  { id: '1', username: 'SpeedyKeys', score: 125, accuracy: 99, timestamp: new Date('2024-07-21T10:00:00Z'), photoURL: 'https://picsum.photos/seed/SpeedyKeys/40/40' },
  { id: '2', username: 'TypingPro', score: 118, accuracy: 97, timestamp: new Date('2024-07-20T11:30:00Z'), photoURL: 'https://picsum.photos/seed/TypingPro/40/40' },
  { id: '3', username: 'KeyboardWizard', score: 112, accuracy: 98, timestamp: new Date('2024-07-21T09:00:00Z'), photoURL: 'https://picsum.photos/seed/KeyboardWizard/40/40' },
  { id: '4', username: 'FastFingers', score: 109, accuracy: 100, timestamp: new Date('2024-07-19T14:00:00Z'), photoURL: 'https://picsum.photos/seed/FastFingers/40/40' },
  { id: '5', username: 'WordMaster', score: 105, accuracy: 96, timestamp: new Date('2024-07-20T16:45:00Z'), photoURL: 'https://picsum.photos/seed/WordMaster/40/40' },
  { id: '6', username: 'KeySmasher', score: 101, accuracy: 94, timestamp: new Date('2024-07-18T11:00:00Z'), photoURL: 'https://picsum.photos/seed/KeySmasher/40/40' },
  { id: '7', username: 'QwertyNinja', score: 98, accuracy: 99, timestamp: new Date('2024-07-21T15:20:00Z'), photoURL: 'https://picsum.photos/seed/QwertyNinja/40/40' },
  { id: '8', username: 'CodeRacer', score: 95, accuracy: 98, timestamp: new Date('2024-07-19T18:10:00Z'), photoURL: 'https://picsum.photos/seed/CodeRacer/40/40' },
  { id: '9', username: 'LetterStorm', score: 92, accuracy: 95, timestamp: new Date('2024-07-20T08:30:00Z'), photoURL: 'https://picsum.photos/seed/LetterStorm/40/40' },
  { id: '10', username: 'TypeNinja', score: 90, accuracy: 97, timestamp: new Date('2024-07-21T12:00:00Z'), photoURL: 'https://picsum.photos/seed/TypeNinja/40/40' },
];


const rankColor = (rank: number) => {
  if (rank === 1) return 'bg-yellow-400/80 text-yellow-900 border-yellow-400';
  if (rank === 2) return 'bg-gray-300/80 text-gray-900 border-gray-400';
  if (rank === 3) return 'bg-yellow-600/50 text-yellow-800 border-yellow-600';
  return 'bg-primary/10 text-primary border-primary/20';
};

export default function LeaderboardPage() {
  const formattedData = useMemo(() => {
    return STATIC_LEADERBOARD_DATA?.map((entry, index) => ({
      ...entry,
      rank: index + 1,
      date: entry.timestamp.toLocaleDateString(),
    })) ?? [];
  }, []);

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
                {formattedData.length === 0 && (
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
