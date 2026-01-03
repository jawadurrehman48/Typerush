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
import { Skeleton } from '@/components/ui/skeleton';

const chartData = [
  { date: 'May 14', wpm: 78 },
  { date: 'May 15', wpm: 85 },
  { date: 'May 16', wpm: 92 },
  { date: 'May 17', wpm: 88 },
  { date: 'May 18', wpm: 95 },
  { date: 'May 19', wpm: 102 },
  { date: 'May 20', wpm: 105 },
];

const gameHistory = [
    { id: 1, wpm: 105, accuracy: '98%', date: 'May 20, 2024'},
    { id: 2, wpm: 102, accuracy: '99%', date: 'May 19, 2024'},
    { id: 3, wpm: 95, accuracy: '97%', date: 'May 18, 2024'},
    { id: 4, wpm: 88, accuracy: '100%', date: 'May 17, 2024'},
];

const userProfile = {
    gamesPlayed: 25,
    highestWPM: 105,
};

const averageWpm = 91;


export default function DashboardPage() {
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
                <div className="text-2xl font-bold text-accent">{averageWpm}</div>
            <p className="text-xs text-muted-foreground">Across all games</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Games Played</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
                <div className="text-2xl font-bold">{userProfile?.gamesPlayed ?? 0}</div>
            <p className="text-xs text-muted-foreground">Total games completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
                <div className="text-2xl font-bold text-primary">{userProfile?.highestWPM ?? 0} WPM</div>
            <p className="text-xs text-muted-foreground">Your personal best</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Accuracy</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
                <div className="text-2xl font-bold">{Math.max(0, ...gameHistory?.map(g => parseInt(g.accuracy)) ?? [])}%</div>
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
                {gameHistory?.slice(0, 4).map((game) => (
                  <TableRow key={game.id}>
                    <TableCell>
                      <div className="font-medium text-accent">{game.wpm}</div>
                    </TableCell>
                    <TableCell>{game.accuracy}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{game.date}</TableCell>
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
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
}
