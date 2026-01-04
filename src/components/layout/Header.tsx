'use client';

import Link from 'next/link';
import { Keyboard, Menu, X, User, LayoutDashboard, Settings, LogOut as LogOutIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
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
import { useState } from 'react';
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useUserProfile } from '@/firebase/auth/use-user-profile';

export default function Header() {
  const pathname = usePathname();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { user } = useUser();
  const auth = useAuth();
  const { userProfile } = useUserProfile();

  const handleLogout = async () => {
    await signOut(auth);
  };

  const navLinkClasses = (path: string) => 
    cn(
      'transition-colors hover:text-foreground/80 text-lg sm:text-sm',
      pathname === path ? 'text-foreground' : 'text-foreground/60'
    );

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1 && names[0] && names[1]) {
      return names[0][0] + names[1][0];
    }
    return name.substring(0, 2).toUpperCase();
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
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={userProfile?.photoURL ?? `https://picsum.photos/seed/${user.uid}/40/40`} alt={userProfile?.username ?? 'user'} />
                      <AvatarFallback>{userProfile?.username ? getInitials(userProfile.username) : 'G'}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{userProfile?.username ?? 'Guest'}</p>
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
                   <DropdownMenuItem asChild>
                     <Link href="/dashboard">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500 focus:bg-red-500/10">
                    <LogOutIcon className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
               <Button asChild>
                 <Link href="/">Login</Link>
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
                </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
