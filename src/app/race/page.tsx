
'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import RaceLobby from '@/components/race/RaceLobby';
import Race from '@/components/race/Race';

export default function RacePage() {
  const [raceId, setRaceId] = useState<string | null>(null);

  const handleJoinRace = (id: string) => {
    setRaceId(id);
  };

  const handleLeaveRace = () => {
    setRaceId(null);
  }

  return (
    <>
      <Header />
      <div className="container mx-auto flex flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-4xl">
          {raceId ? (
            <Race raceId={raceId} onLeave={handleLeaveRace} />
          ) : (
            <>
            <h1 className="mb-4 text-center text-4xl font-bold tracking-tighter text-primary sm:text-5xl md:text-6xl">
              Race against others
            </h1>
            <p className="mb-12 text-center text-lg text-muted-foreground md:text-xl">
              Join a race or create your own and challenge your friends.
            </p>
            <RaceLobby onJoinRace={handleJoinRace} />
            </>
          )}
        </div>
      </div>
    </>
  );
}
