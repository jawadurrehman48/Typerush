'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Swords } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type RaceLobbyProps = {
  onJoinRace: (raceId: string, raceName: string, rivalCount: number) => void;
};

export default function RaceLobby({ onJoinRace }: RaceLobbyProps) {
  const [raceName, setRaceName] = useState('');
  const [rivalCount, setRivalCount] = useState('1');
  const [isCreating, setIsCreating] = useState(false);

  const createRace = async () => {
    if (!raceName.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please provide a race name.",
      });
      return;
    }
    
    setIsCreating(true);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate async operation
    
    const newRaceId = Math.floor(1000 + Math.random() * 9000).toString();
    onJoinRace(newRaceId, raceName, parseInt(rivalCount, 10));

    setIsCreating(false);
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
        <CardHeader className="flex flex-row items-center gap-2">
            <Swords className="h-6 w-6" />
            <div>
                <CardTitle>Create a New Race</CardTitle>
                <CardDescription>Start a new race and you will automatically join it.</CardDescription>
            </div>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="race-name">Race Name</Label>
                <Input
                  id="race-name"
                  placeholder="e.g., Friday Night Typing"
                  value={raceName}
                  onChange={(e) => setRaceName(e.target.value)}
                  disabled={isCreating}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rival-count">Number of Rivals</Label>
                <Select
                  value={rivalCount}
                  onValueChange={setRivalCount}
                  disabled={isCreating}
                >
                  <SelectTrigger id="rival-count" className="w-full">
                    <SelectValue placeholder="Select number of rivals" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Rival</SelectItem>
                    <SelectItem value="2">2 Rivals</SelectItem>
                    <SelectItem value="3">3 Rivals</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={createRace} disabled={isCreating} className="w-full">
                {isCreating ? "Creating..." : "Create & Join Race"}
              </Button>
            </div>
        </CardContent>
    </Card>
  );
}
