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

const STATIC_GAME_HISTORY = [
    { id: '1', score: 75, accuracy: 98, timestamp: new Date('2024-07-15T10:00:00Z') },
    { id: '2', score: 82, accuracy: 95, timestamp: new Date('2024-07-16T11:30:00Z') },
    { id: '3', score: 78, accuracy: 99, timestamp: new Date('2024-07-17T09:00:00Z') },
    { id: '4', score: 85, accuracy: 97, timestamp: new Date('2024-07-18T14:00:00Z') },
    { id: '5', score: 88, accuracy: 96, timestamp: new Date('2024-07-19T16:45:00Z') },
    { id: '6', score: 91, accuracy: 98, timestamp: new Date('2024-07-20T11:00:00Z') },
    { id: '7', score: 90, accuracy: 99, timestamp: new Date('2024-07-21T15:20:00Z') },
];

const STATIC_USER_PROFILE = {
    gamesPlayed: 25,
    highestWPM: 102,
};

export default function DashboardPage() {

  const processedChartData = useMemo(() => {
    return STATIC_GAME_HISTORY.slice(0, 7).reverse().map(game => ({
      date: game.timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      wpm: game.score,
    }));
  }, []);

  const topAccuracy = useMemo(() => {
    if (!STATIC_GAME_HISTORY || STATIC_GAME_HISTORY.length === 0) return 0;
    return Math.max(...STATIC_GAME_HISTORY.map(g => g.accuracy));
  }, []);

  const calculatedAverageWpm = useMemo(() => {
    if (!STATIC_GAME_HISTORY || STATIC_GAME_HISTORY.length === 0) return 0;
    const totalWpm = STATIC_GAME_HISTORY.reduce((sum, game) => sum + game.score, 0);
    return Math.round(totalWpm / STATIC_GAME_HISTORY.length);
  }, []);

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="mb-6 text-3xl font-bold tracking-tighter text-primary sm:text-4xl">
          Your Dashboard
        </h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average WPM</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{calculatedAverageWpm}</div>
              <p className="text-xs text-muted-foreground">Across last 7 games</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Games Played</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{STATIC_USER_PROFILE.gamesPlayed}</div>
              <p className="text-xs text-muted-foreground">Total games completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Best Score</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{STATIC_USER_PROFILE.highestWPM} WPM</div>
              <p className="text-xs text-muted-foreground">Your personal best</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Accuracy</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{topAccuracy}%</div>
              <p className="text-xs text-muted-foreground">Highest in last 7 games</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>WPM Progress</CardTitle>
              <CardDescription>Your typing speed over the last 7 games.</CardDescription>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Games</CardTitle>
              <CardDescription>Your last 4 typing sessions.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>WPM</TableHead>
                      <TableHead>Accuracy</TableHead>
                      <TableHead className="text-right">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {STATIC_GAME_HISTORY.slice(0, 4).map((game) => (
                      <TableRow key={game.id}>
                        <TableCell>
                          <div className="font-medium text-accent">{game.score}</div>
                        </TableCell>
                        <TableCell>{game.accuracy}%</TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {game.timestamp.toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                    {STATIC_GAME_HISTORY.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          No games played yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
