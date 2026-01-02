import Link from 'next/link';
import { Keyboard, LogIn, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';


export default function Header() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link href="/game" className="mr-6 flex items-center space-x-2">
          <Keyboard className="h-6 w-6 text-primary" />
          <span className="font-bold">TypeRush</span>
        </Link>
        <nav className="flex items-center space-x-6 text-sm font-medium">
          <Link
            href="/game"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            Game
          </Link>
          <Link
            href="/dashboard"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            Dashboard
          </Link>
          <Link
            href="/leaderboard"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            Leaderboard
          </Link>
        </nav>
        <div className="flex flex-1 items-center justify-end">
          {isUserLoading ? (
            <div className="h-8 w-20 animate-pulse rounded-md bg-muted" />
          ) : user ? (
            <Button onClick={handleLogout} variant="ghost" size="sm">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
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
