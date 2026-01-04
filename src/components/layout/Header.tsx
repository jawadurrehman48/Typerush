
'use client';

import Link from 'next/link';
import { Keyboard, Menu, X, LogIn, LogOut, LayoutDashboard, Settings, Trophy, Zap, User as UserIcon, Swords } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser, useAuth, useUserProfile } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '../ui/skeleton';
import { useState } from 'react';

export default function Header() {
  const { user, isUserLoading } = useUser();
  const { data: userProfile, isLoading: isProfileLoading } = useUserProfile();
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleLogout = async () => {
    if (auth) {
        await signOut(auth);
    }
    router.push('/');
    setIsSheetOpen(false);
  };

  const navLinkClasses = (path: string) => 
    cn(
      'transition-colors hover:text-foreground/80 text-lg sm:text-sm',
      pathname === path ? 'text-foreground' : 'text-foreground/60'
    );

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'G';
    const names = name.split(' ');
    if (names.length > 1 && names[0] && names[1]) {
      return names[0][0] + names[1][0];
    }
    return name.substring(0, 2);
  }

  const NavLinks = () => (
    <>
      <Link href="/game" className={navLinkClasses('/game')} onClick={() => setIsSheetOpen(false)}>
        Practice
      </Link>
      <Link href="/race" className={navLinkClasses('/race')} onClick={() => setIsSheetOpen(false)}>
        Race
      </Link>
      <Link href="/dashboard" className={navLinkClasses('/dashboard')} onClick={() => setIsSheetOpen(false)}>
        Dashboard
      </Link>
      <Link href="/leaderboard" className={navLinkClasses('/leaderboard')} onClick={() => setIsSheetOpen(false)}>
        Leaderboard
      </Link>
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center px-4 sm:px-6">
        <Link href="/game" className="mr-6 flex items-center space-x-2" onClick={() => setIsSheetOpen(false)}>
          <Keyboard className="h-6 w-6 text-primary" />
          <span className="font-bold inline-block">TypeRush</span>
        </Link>
        <nav className="hidden sm:flex items-center space-x-6 text-sm font-medium">
          <NavLinks />
        </nav>
        <div className="flex flex-1 items-center justify-end gap-2 sm:gap-4">
          <ThemeToggle />
          {isUserLoading || isProfileLoading ? (
            <Skeleton className="h-8 w-8 rounded-full" />
          ) : user && userProfile ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={userProfile.photoURL ?? user.photoURL ?? ''} alt={userProfile.username ?? 'user'} />
                    <AvatarFallback>{getInitials(userProfile.username)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userProfile.username}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="ghost" size="sm" className='hidden sm:inline-flex'>
              <Link href="/">
                <LogIn className="mr-2 h-4 w-4" />
                Login
              </Link>
            </Button>
          )}
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="sm:hidden">
                <Menu />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-full max-w-xs sm:max-w-sm">
                <div className="flex justify-between items-center py-2">
                    <Link href="/game" className="flex items-center space-x-2" onClick={() => setIsSheetOpen(false)}>
                        <Keyboard className="h-6 w-6 text-primary" />
                        <span className="font-bold">TypeRush</span>
                    </Link>
                    <SheetClose asChild>
                        <Button variant="ghost" size="icon">
                            <X className="h-6 w-6" />
                        </Button>
                    </SheetClose>
                </div>
                <div className="flex flex-col h-full py-4">
                    <nav className="flex flex-col gap-4 text-lg font-medium">
                        <NavLinks />
                    </nav>
                    <div className="mt-auto">
                        {!isUserLoading && !user && (
                            <Button asChild className="w-full" onClick={() => setIsSheetOpen(false)}>
                                <Link href="/">
                                    <LogIn className="mr-2 h-4 w-4" />
                                    Login
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

    