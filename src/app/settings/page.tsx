'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth, useFirestore, useUser, setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/firebase/auth/use-user-profile';
import { updateProfile, getIdTokenResult } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";

export default function SettingsPage() {
  const { user } = useUser();
  const { userProfile, isLoading: isProfileLoading } = useUserProfile();
  const auth = useAuth();
  const firestore = useFirestore();

  const [username, setUsername] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setUsername(userProfile.username || '');
      setPhotoPreview(userProfile.photoURL || null);
    }
  }, [userProfile]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpdate = async () => {
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to update your profile.',
      });
      return;
    }

    setIsUpdating(true);
    
    try {
      let newPhotoURL = userProfile?.photoURL;

      // 1. Upload new photo if one was selected
      if (photoFile && photoPreview?.startsWith('data:')) {
        const storage = getStorage();
        const storageRef = ref(storage, `avatars/${user.uid}/${photoFile.name}`);
        
        await uploadString(storageRef, photoPreview, 'data_url');
        newPhotoURL = await getDownloadURL(storageRef);
      }

      const updatedProfileData: { username?: string, photoURL?: string } = {};
      const authProfileUpdate: { displayName?: string, photoURL?: string } = {};

      if (username !== userProfile?.username) {
        updatedProfileData.username = username;
        authProfileUpdate.displayName = username;
      }
      if (newPhotoURL !== userProfile?.photoURL) {
        updatedProfileData.photoURL = newPhotoURL;
        authProfileUpdate.photoURL = newPhotoURL;
      }
      
      // 2. Update Firebase Auth Profile
      if (Object.keys(authProfileUpdate).length > 0) {
        await updateProfile(user, authProfileUpdate);
      }
      
      // 3. Update Firestore Document
      if (Object.keys(updatedProfileData).length > 0) {
        const userDocRef = doc(firestore, 'users', user.uid);
        await updateDocumentNonBlocking(userDocRef, updatedProfileData);
      }

      // 4. Force refresh the token to get updated claims (like displayName)
      // This is crucial for security rules that rely on request.auth.token
      await getIdTokenResult(user, true);

      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated.',
      });

    } catch (error: any) {
      console.error("Error updating profile: ", error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message || 'An unexpected error occurred.',
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
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isUpdating || isProfileLoading}
                  placeholder={isProfileLoading ? 'Loading...' : 'Enter your username'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="photo">Profile Picture</Label>
                <div className="flex items-center gap-4">
                  <Image
                    src={photoPreview || `https://picsum.photos/seed/${username}/64/64`}
                    alt="Avatar preview"
                    width={64}
                    height={64}
                    className="rounded-full bg-muted"
                  />
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
