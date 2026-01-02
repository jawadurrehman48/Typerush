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
import { Badge } from '@/components/ui/badge';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Bar, BarChart as RechartsBarChart, XAxis, YAxis } from 'recharts';

const chartData = [
  { date: '2024-05-01', wpm: 75 },
  { date: '2024-05-02', wpm: 82 },
  { date: '2024-05-03', wpm: 80 },
  { date: '2024-05-04', wpm: 88 },
  { date: '2024-05-05', wpm: 91 },
  { date: '2024-05-06', wpm: 89 },
  { date: '2024-05-07', wpm: 95 },
];

const gameHistory = [
  { date: '2024-05-07', wpm: 95, accuracy: '98%', change: '+6' },
  { date: '2024-05-06', wpm: 89, accuracy: '96%', change: '-2' },
  { date: '2024-05-05', wpm: 91, accuracy: '99%', change: '+3' },
  { date: '2024-05-04', wpm: 88, accuracy: '97%', change: '+8' },
];

export default function DashboardPage() {
  return (
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
            <div className="text-2xl font-bold text-accent">95</div>
            <p className="text-xs text-muted-foreground">+5.2% from last week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Games Played</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">128</div>
            <p className="text-xs text-muted-foreground">+20 games this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">152 WPM</div>
            <p className="text-xs text-muted-foreground">with 98% accuracy</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Spent</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1h 45m</div>
            <p className="text-xs text-muted-foreground">Total typing time</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-8 md:grid-cols-5">
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>WPM Progress</CardTitle>
            <CardDescription>Your typing speed over the last 7 days.</CardDescription>
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
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
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
                {gameHistory.map((game, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="font-medium text-accent">{game.wpm}</div>
                      <div className="hidden text-sm text-muted-foreground md:inline">
                         <Badge variant={game.change.startsWith('+') ? 'default' : 'destructive'} className={`${game.change.startsWith('+') ? 'bg-accent text-accent-foreground' : ''}`}>
                          {game.change}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>{game.accuracy}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{game.date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
