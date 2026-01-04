'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import Race from '@/components/race/Race';
import RaceLobby from '@/components/race/RaceLobby';

export default function RacePage() {
  const [raceDetails, setRaceDetails] = useState<{ id: string; name: string } | null>(null);
  const [lobbyKey, setLobbyKey] = useState(0);

  const handleLeaveRace = () => {
    setRaceDetails(null);
    setLobbyKey(prevKey => prevKey + 1); // Increment key to force re-mount
  };

  const handleJoinRace = (raceId: string, raceName: string) => {
    setRaceDetails({ id: raceId, name: raceName });
  };

  return (
    <>
      <Header />
      <main className="container mx-auto flex flex-col items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-4xl">
          {raceDetails ? (
            <Race raceId={raceDetails.id} raceName={raceDetails.name} onLeave={handleLeaveRace} />
          ) : (
            <>
              <h1 className="mb-4 text-center text-4xl font-bold tracking-tighter text-primary sm:text-5xl md:text-6xl">
                Race against others
              </h1>
              <p className="mb-8 text-center text-lg text-muted-foreground md:text-xl sm:mb-12">
                Create a private race and challenge your friends.
              </p>
              <RaceLobby key={lobbyKey} onJoinRace={handleJoinRace} />
            </>
          )}
        </div>
      </main>
    </>
  );
}
