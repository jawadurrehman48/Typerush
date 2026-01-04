'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Swords } from 'lucide-react';

type RaceLobbyProps = {
  onJoinRace: (raceId: string) => void;
};

export default function RaceLobby({ onJoinRace }: RaceLobbyProps) {
  const [raceName, setRaceName] = useState('');
  
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
    onJoinRace(newRaceId);

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
              <Button onClick={createRace} disabled={isCreating} className="w-full">
                {isCreating ? "Creating..." : "Create & Join Race"}
              </Button>
            </div>
        </CardContent>
    </Card>
  );
}
