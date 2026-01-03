
'use client';

import Link from 'next/link';
import { Keyboard, LogIn, LogOut, LayoutDashboard, User as UserIcon } from 'lucide-react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


export default function Header() {
  const { user, isUserLoading } = useUser();
  const { data: userProfile } = useUserProfile();
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    if (auth) {
        await signOut(auth);
    }
    router.push('/');
  };

  const navLinkClasses = (path: string) => 
    cn(
      'transition-colors hover:text-foreground/80',
      pathname === path ? 'text-foreground' : 'text-foreground/60'
    );

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'G';
    const names = name.split(' ');
    if (names.length > 1) {
      return names[0][0] + names[1][0];
    }
    return name.substring(0, 2);
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link href="/game" className="mr-6 flex items-center space-x-2">
            <Keyboard className="h-6 w-6 text-primary" />
            <span className="font-bold inline-block">TypeRush</span>
            </Link>
          <Link href="/game" className={navLinkClasses('/game')}>
            Practice
          </Link>
           <Link href="/race" className={navLinkClasses('/race')}>
            Race
          </Link>
          <Link href="/dashboard" className={navLinkClasses('/dashboard')}>
            Dashboard
          </Link>
          <Link href="/leaderboard" className={navLinkClasses('/leaderboard')}>
            Leaderboard
          </Link>
        </nav>
        <div className="flex flex-1 items-center justify-end gap-4">
          <ThemeToggle />
          {isUserLoading ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoURL ?? ''} alt={userProfile?.username ?? 'user'} />
                    <AvatarFallback>{getInitials(userProfile?.username)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userProfile?.username}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
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
            <Button asChild variant="ghost" size="sm">
              <Link href="/">
                <LogIn className="mr-2 h-4 w-4" />
                Login
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
