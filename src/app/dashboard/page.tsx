
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
import { useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser, useUserProfile, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';

export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { data: userProfile, isLoading: isProfileLoading } = useUserProfile();

  const userGamesQuery = useMemoFirebase(
    () =>
      user && firestore
        ? query(
            collection(firestore, 'users', user.uid, 'games'),
            orderBy('timestamp', 'desc'),
            limit(7)
          )
        : null,
    [user, firestore]
  );
  
  const { data: userGameHistory, isLoading: isHistoryLoading } = useCollection(userGamesQuery);

  const processedChartData = useMemo(() => {
    if (!userGameHistory) return [];
    return userGameHistory.slice(0, 7).reverse().map(game => ({
      date: game.timestamp?.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) ?? 'N/A',
      wpm: game.score,
    }));
  }, [userGameHistory]);

  const topAccuracy = useMemo(() => {
    if (!userGameHistory || userGameHistory.length === 0) return 0;
    return Math.max(...userGameHistory.map(g => g.accuracy));
  }, [userGameHistory]);

  const calculatedAverageWpm = useMemo(() => {
    if (!userGameHistory || userGameHistory.length === 0) return 0;
    const totalWpm = userGameHistory.reduce((sum, game) => sum + game.score, 0);
    return Math.round(totalWpm / userGameHistory.length);
  }, [userGameHistory]);

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
              {isHistoryLoading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold text-accent">{calculatedAverageWpm}</div>}
              <p className="text-xs text-muted-foreground">Across last 7 games</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Games Played</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isProfileLoading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">{userProfile?.gamesPlayed ?? 0}</div>}
              <p className="text-xs text-muted-foreground">Total games completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Best Score</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isProfileLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold text-primary">{userProfile?.highestWPM ?? 0} WPM</div>}
              <p className="text-xs text-muted-foreground">Your personal best</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Accuracy</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isHistoryLoading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">{topAccuracy}%</div>}
              <p className="text-xs text-muted-foreground">Highest in last 7 games</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8">
          <div className="grid gap-8">
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
                    <RechartsBarChart data={processedChartData} margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
                      <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                      <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} domain={[0, 'dataMax + 10']} />
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>WPM</TableHead>
                      <TableHead>Accuracy</TableHead>
                      <TableHead className="text-right">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(isProfileLoading || isHistoryLoading) && Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-10" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-10" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-5 w-24" /></TableCell>
                      </TableRow>
                    ))}
                    {!isHistoryLoading && userGameHistory?.slice(0, 4).map((game) => (
                      <TableRow key={game.id}>
                        <TableCell>
                          <div className="font-medium text-accent">{game.score}</div>
                        </TableCell>
                        <TableCell>{game.accuracy}%</TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {game.timestamp?.toDate().toLocaleDateString() ?? 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                    {!isHistoryLoading && (!userGameHistory || userGameHistory?.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          No games played yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

    