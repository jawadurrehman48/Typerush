'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function SettingsPage() {
  const [username, setUsername] = useState('GuestUser');
  const [photoPreview, setPhotoPreview] = useState<string | null>('https://picsum.photos/seed/guest/64/64');
  const [isUpdating, setIsUpdating] = useState(false);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpdate = async () => {
    setIsUpdating(true);
    // Simulate an API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsUpdating(false);
    toast({
      title: 'Profile Updated',
      description: 'Your profile has been successfully updated.',
    });
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
              <CardDescription>Update your public profile information. (This is a demo and will not persist).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isUpdating}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="photo">Profile Picture</Label>
                <div className="flex items-center gap-4">
                  <Image
                    src={photoPreview || `https://picsum.photos/seed/user/64/64`}
                    alt="Avatar preview"
                    width={64}
                    height={64}
                    className="rounded-full"
                  />
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="flex-1"
                    disabled={isUpdating}
                  />
                </div>
              </div>
              <Button onClick={handleProfileUpdate} disabled={isUpdating} className="w-full">
                {isUpdating ? 'Updating...' : 'Update Profile'}
              </Button>
            </CardContent>
          </Card>
      </div>
    </>
  );
}
