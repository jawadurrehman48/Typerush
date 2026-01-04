'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Swords, LogIn } from 'lucide-react';

type RaceLobbyProps = {
  onJoinRace: (raceId: string) => void;
};

export default function RaceLobby({ onJoinRace }: RaceLobbyProps) {
  const [raceName, setRaceName] = useState('');
  const [joinRaceId, setJoinRaceId] = useState('');
  
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

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

  const joinRace = async () => {
    if (!joinRaceId.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Race ID is required.',
      });
      return;
    }
    setIsJoining(true);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate async operation

    onJoinRace(joinRaceId.trim());
  
    setIsJoining(false);
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardContent className="p-0">
        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-14 rounded-t-lg rounded-b-none">
            <TabsTrigger value="create" className="h-full text-base sm:text-md font-semibold flex gap-2 items-center">
              <Swords className="h-5 w-5" /> Create Race
            </TabsTrigger>
            <TabsTrigger value="join" className="h-full text-base sm:text-md font-semibold flex gap-2 items-center">
              <LogIn className="h-5 w-5" /> Join Race
            </TabsTrigger>
          </TabsList>
          <TabsContent value="create" className="p-6">
            <CardHeader className="p-0 mb-4">
              <CardTitle>Create a New Race</CardTitle>
              <CardDescription>Start a new race and you will automatically join it.</CardDescription>
            </CardHeader>
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
          </TabsContent>
          <TabsContent value="join" className="p-6">
             <CardHeader className="p-0 mb-4">
                <CardTitle>Join a Race</CardTitle>
                <CardDescription>Enter the Race ID you want to join.</CardDescription>
            </CardHeader>
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="join-race-id">Race ID</Label>
                    <Input
                    id="join-race-id"
                    placeholder="Enter 4-digit Race ID"
                    value={joinRaceId}
                    onChange={(e) => setJoinRaceId(e.target.value)}
                    disabled={isJoining}
                    />
                </div>
                <Button onClick={() => joinRace()} disabled={isJoining} className="w-full">
                    {isJoining ? "Joining..." : "Join Race"}
                </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
