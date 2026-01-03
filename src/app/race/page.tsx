
'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Race from '@/components/race/Race';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import RaceLobby from '@/components/race/RaceLobby';

export default function RacePage() {
  const [raceId, setRaceId] = useState<string | null>(null);
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && !isUserLoading && !user) {
      router.push('/');
    }
  }, [user, isUserLoading, router, isClient]);

  const handleJoinRace = (id: string) => {
    setRaceId(id);
  };

  const handleLeaveRace = () => {
    setRaceId(null);
  };
  
  // Conditionally render the content *inside* the main return block
  // to avoid changing the hook execution order.
  const renderContent = () => {
    if (isUserLoading || !isClient) {
      return (
        <div className="flex h-[80vh] items-center justify-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-dashed border-primary"></div>
        </div>
      );
    }
    
    return (
        <div className="w-full max-w-4xl">
          {raceId ? (
            <Race raceId={raceId} onLeave={handleLeaveRace} />
          ) : (
            <>
              <h1 className="mb-4 text-center text-4xl font-bold tracking-tighter text-primary sm:text-5xl md:text-6xl">
                Race against others
              </h1>
              <p className="mb-12 text-center text-lg text-muted-foreground md:text-xl">
                Create a private race and challenge your friends, or join a race by ID.
              </p>
              <RaceLobby onJoinRace={handleJoinRace} />
            </>
          )}
        </div>
    );
  }

  return (
    <>
      <Header />
      <div className="container mx-auto flex flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        {renderContent()}
      </div>
    </>
  );
}
