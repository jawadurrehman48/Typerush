
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

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading) {
    return (
      <>
        <Header />
        <main className="flex h-[80vh] items-center justify-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-dashed border-primary"></div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="container mx-auto flex flex-col items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-4xl">
          {raceId ? (
            <Race raceId={raceId} onLeave={() => setRaceId(null)} />
          ) : (
            <>
              <h1 className="mb-4 text-center text-4xl font-bold tracking-tighter text-primary sm:text-5xl md:text-6xl">
                Race against others
              </h1>
              <p className="mb-8 text-center text-lg text-muted-foreground md:text-xl sm:mb-12">
                Create a private race and challenge your friends, or join a race by ID.
              </p>
              <RaceLobby onJoinRace={setRaceId} />
            </>
          )}
        </div>
      </main>
    </>
  );
}

    