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
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Header from '@/components/layout/Header';

const leaderboardData = [
  { rank: 1, player: 'Cypher', wpm: 152, accuracy: '98%', date: '2024-05-20', avatar: PlaceHolderImages[0].imageUrl },
  { rank: 2, player: 'Glitch', wpm: 148, accuracy: '99%', date: '2024-05-19', avatar: PlaceHolderImages[1].imageUrl },
  { rank: 3, player: 'Byte', wpm: 145, accuracy: '97%', date: '2024-05-20', avatar: PlaceHolderImages[2].imageUrl },
  { rank: 4, player: 'Astra', wpm: 142, accuracy: '100%', date: '2024-05-18', avatar: PlaceHolderImages[3].imageUrl },
  { rank: 5, player: 'Nexus', wpm: 139, accuracy: '96%', date: '2024-05-20', avatar: PlaceHolderImages[4].imageUrl },
  { rank: 6, player: 'Raze', wpm: 135, accuracy: '95%', date: '2024-05-17' },
  { rank: 7, player: 'Omen', wpm: 133, accuracy: '98%', date: '2024-05-19' },
  { rank: 8, player: 'Jett', wpm: 131, accuracy: '97%', date: '2024-05-20' },
  { rank: 9, player: 'Sage', wpm: 128, accuracy: '99%', date: '2024-05-18' },
  { rank: 10, player: 'Viper', wpm: 125, accuracy: '96%', date: '2024-05-20' },
];

const rankColor = (rank: number) => {
  if (rank === 1) return 'bg-yellow-400/80 text-yellow-900 border-yellow-400';
  if (rank === 2) return 'bg-gray-300/80 text-gray-900 border-gray-400';
  if (rank === 3) return 'bg-yellow-600/50 text-yellow-800 border-yellow-600';
  return 'bg-primary/10 text-primary border-primary/20';
};

export default function LeaderboardPage() {
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
              {leaderboardData.map((entry) => (
                <TableRow key={entry.rank}>
                  <TableCell className="text-center">
                    <Badge variant="outline" className={`font-bold text-lg p-2 justify-center ${rankColor(entry.rank)}`}>
                      {entry.rank}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Image
                        src={entry.avatar ?? `https://picsum.photos/seed/${entry.player}/40/40`}
                        alt={entry.player}
                        width={40}
                        height={40}
                        className="rounded-full"
                        data-ai-hint="person portrait"
                      />
                      <span className="font-medium">{entry.player}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-lg text-accent">{entry.wpm}</TableCell>
                  <TableCell className="text-right font-mono text-lg">{entry.accuracy}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{entry.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
    </>
  );
}
