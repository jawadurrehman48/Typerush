import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Keyboard, Star, Zap } from "lucide-react"

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center px-4 sm:px-6">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Keyboard className="h-6 w-6 text-primary" />
            <span className="font-bold inline-block">TypeRush</span>
          </Link>
          <div className="flex flex-1 items-center justify-end gap-2 sm:gap-4">
             <Button asChild>
                <Link href="/game">Start Typing</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="container grid lg:grid-cols-2 gap-12 items-center py-12 md:py-24 lg:py-32">
          <div className="flex flex-col justify-center space-y-4">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none text-primary">
                The Ultimate Typing Challenge
              </h1>
              <p className="max-w-[600px] text-muted-foreground md:text-xl">
                Test your typing speed and accuracy against the clock. Compete with friends, track your progress, and become a typing master.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Button asChild size="lg">
                <Link href="/game">
                  Start a New Game
                </Link>
              </Button>
               <Button asChild variant="outline" size="lg">
                <Link href="/leaderboard">
                  View Leaderboard
                </Link>
              </Button>
            </div>
          </div>
           <div className="flex items-center justify-center">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Welcome to TypeRush!</CardTitle>
                    <CardDescription>Ready to test your skills?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                        <Zap className="h-8 w-8 text-primary" />
                        <div>
                            <h3 className="font-semibold">Practice Mode</h3>
                            <p className="text-sm text-muted-foreground">Hone your skills with random paragraphs.</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                        <Star className="h-8 w-8 text-yellow-500" />
                         <div>
                            <h3 className="font-semibold">Leaderboard</h3>
                            <p className="text-sm text-muted-foreground">See how you stack up against the best.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
           </div>
        </section>
      </main>

       <footer className="border-t">
        <div className="container flex items-center justify-center h-16 px-4 text-sm text-center text-muted-foreground sm:px-6">
            <p>&copy; {new Date().getFullYear()} TypeRush. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
