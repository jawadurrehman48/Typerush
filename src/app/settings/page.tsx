'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { useUser, useUserProfile, useFirestore, useAuth } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { doc, updateDoc } from 'firebase/firestore';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { updateProfile } from 'firebase/auth';

export default function SettingsPage() {
  const { user } = useUser();
  const { data: userProfile, isLoading: isProfileLoading } = useUserProfile();
  const firestore = useFirestore();
  const auth = useAuth();

  const [newUsername, setNewUsername] = useState('');
  const [newPhoto, setNewPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setNewUsername(userProfile.username);
      if (userProfile.photoURL) {
        setPhotoPreview(userProfile.photoURL);
      }
    }
  }, [userProfile]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpdate = async () => {
    if (!user || !firestore || !auth.currentUser) return;

    setIsUpdating(true);
    try {
      const updates: { username?: string, photoURL?: string } = {};
      let authUpdates: { displayName?: string, photoURL?: string} = {};

      if (newUsername.trim() && newUsername !== userProfile?.username) {
        updates.username = newUsername;
        authUpdates.displayName = newUsername;
      }
      
      if (newPhoto) {
        const reader = new FileReader();
        const promise = new Promise<string>((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(newPhoto);
        });
        const photoURL = await promise;
        updates.photoURL = photoURL;
        authUpdates.photoURL = photoURL;
      }

      if (Object.keys(updates).length > 0) {
        // Update Firestore profile first
        const userDocRef = doc(firestore, 'users', user.uid);
        await updateDoc(userDocRef, updates);

        // Then, update the Auth profile
        if (Object.keys(authUpdates).length > 0) {
            await updateProfile(auth.currentUser, authUpdates);
        }

        // Force refresh of the ID token to get fresh claims in security rules
        await auth.currentUser.getIdToken(true);
      }


      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated.',
      });
    } catch (error: any) {
      console.error("Profile update failed:", error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message || 'An error occurred while updating your profile.',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <Header />
      <div className="container mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-3xl font-bold tracking-tighter text-primary sm:text-4xl">
          Settings
        </h1>
        <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Update your public profile information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  disabled={isUpdating || isProfileLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="photo">Profile Picture</Label>
                <div className="flex items-center gap-4">
                  {isProfileLoading ? <Skeleton className="h-16 w-16 rounded-full" /> :
                    <Image
                      src={photoPreview || userProfile?.photoURL || `https://picsum.photos/seed/${userProfile?.username || 'user'}/64/64`}
                      alt="Avatar preview"
                      width={64}
                      height={64}
                      className="rounded-full"
                    />
                  }
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="flex-1"
                    disabled={isUpdating || isProfileLoading}
                  />
                </div>
              </div>
              <Button onClick={handleProfileUpdate} disabled={isUpdating || isProfileLoading} className="w-full">
                {isUpdating ? 'Updating...' : 'Update Profile'}
              </Button>
            </CardContent>
          </Card>
      </div>
    </>
  );
}
