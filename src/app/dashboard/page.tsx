
'use client';

import { BarChart, Clock, Target, TrendingUp } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Bar, BarChart as RechartsBarChart, XAxis, YAxis } from 'recharts';
import Header from '@/components/layout/Header';
import { useUser, useUserProfile, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import type { WithId } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

type LeaderboardEntry = {
    score: number;
    accuracy: number;
    timestamp: { toDate: () => Date };
};

export default function DashboardPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { data: userProfile, isLoading: isProfileLoading } = useUserProfile();

    const userGamesQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(
            collection(firestore, 'leaderboard'),
            where('userId', '==', user.uid),
            orderBy('timestamp', 'desc')
        );
    }, [firestore, user]);

    const { data: gameHistory, isLoading: isHistoryLoading } = useCollection<LeaderboardEntry>(userGamesQuery);

    const chartData = useMemoFirebase(() => {
      if (!gameHistory) return [];
      // Take the last 7 games and format them for the chart
      return gameHistory.slice(0, 7).reverse().map(game => ({
        date: format(game.timestamp.toDate(), 'MMM d'),
        wpm: game.score,
      }));
    }, [gameHistory]);
    
    const averageWpm = useMemoFirebase(() => {
        if (!gameHistory || gameHistory.length === 0) return 0;
        const totalWpm = gameHistory.reduce((acc, game) => acc + game.score, 0);
        return Math.round(totalWpm / gameHistory.length);
    }, [gameHistory])

  return (
    <>
    <Header />
    <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold tracking-tighter text-primary sm:text-4xl">
        Your Dashboard
      </h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average WPM</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isHistoryLoading ? (
                <Skeleton className="h-8 w-1/2" />
            ) : (
                <div className="text-2xl font-bold text-accent">{averageWpm}</div>
            )}
            <p className="text-xs text-muted-foreground">Across all games</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Games Played</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isProfileLoading ? (
                <Skeleton className="h-8 w-1/2" />
            ) : (
                <div className="text-2xl font-bold">{userProfile?.gamesPlayed ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground">Total games completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isProfileLoading ? (
                <Skeleton className="h-8 w-1/2" />
            ) : (
                <div className="text-2xl font-bold text-primary">{userProfile?.highestWPM ?? 0} WPM</div>
            )}
            <p className="text-xs text-muted-foreground">Your personal best</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Accuracy</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isHistoryLoading ? (
                <Skeleton className="h-8 w-1/2" />
            ) : (
                <div className="text-2xl font-bold">{Math.max(0, ...gameHistory?.map(g => g.accuracy) ?? [])}%</div>
            )}
            <p className="text-xs text-muted-foreground">Highest accuracy achieved</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-8 md:grid-cols-5">
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>WPM Progress</CardTitle>
            <CardDescription>Your typing speed over the last 7 games.</CardDescription>
          </CardHeader>
          <CardContent>
            {isHistoryLoading ? <Skeleton className="h-[250px] w-full" /> : (
             <ChartContainer
              config={{
                wpm: {
                  label: 'WPM',
                  color: 'hsl(var(--accent))',
                },
              }}
              className="h-[250px] w-full"
            >
              <RechartsBarChart data={chartData} margin={{ top: 20, right: 20, left: -10, bottom: 0}}>
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} domain={[0, 'dataMax + 10']}/>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar dataKey="wpm" fill="hsl(var(--accent))" radius={4} />
              </RechartsBarChart>
            </ChartContainer>
            )}
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Recent Games</CardTitle>
            <CardDescription>Your last 4 typing sessions.</CardDescription>
          </CardHeader>
          <CardContent>
            {isHistoryLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>WPM</TableHead>
                  <TableHead>Accuracy</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gameHistory?.slice(0, 4).map((game: WithId<LeaderboardEntry>) => (
                  <TableRow key={game.id}>
                    <TableCell>
                      <div className="font-medium text-accent">{game.score}</div>
                    </TableCell>
                    <TableCell>{game.accuracy}%</TableCell>
                    <TableCell className="text-right text-muted-foreground">{format(game.timestamp.toDate(), 'MMM d, yyyy')}</TableCell>
                  </TableRow>
                ))}
                 {gameHistory?.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                            No games played yet.
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
}
