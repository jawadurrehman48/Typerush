'use client';

import { doc } from 'firebase/firestore';
import { useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';

type UserProfile = {
  username: string;
  fullName: string;
  email: string;
};

export function useUserProfile() {
  const { user } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(
    () => (user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );

  return useDoc<UserProfile>(userProfileRef);
}
