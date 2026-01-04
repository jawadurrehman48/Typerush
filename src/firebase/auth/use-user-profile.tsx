'use client';

import { useMemo } from 'react';
import { doc } from 'firebase/firestore';
import { useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';

type UserProfile = {
  username: string;
  email: string;
  highestWPM: number;
  gamesPlayed: number;
  photoURL?: string;
};

export function useUserProfile() {
  const { user } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(
    () => (user ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );

  const { data: userProfile, isLoading, error } = useDoc<UserProfile>(userProfileRef);

  return { userProfile, isLoading, error };
}
