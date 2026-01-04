
import TypingTest from '@/components/game/TypingTest';
import Header from '@/components/layout/Header';

export default function GamePage() {
  return (
    <>
      <Header />
      <main className="container mx-auto flex flex-col items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-4xl">
          <h1 className="mb-4 text-center text-4xl font-bold tracking-tighter text-primary sm:text-5xl md:text-6xl">
            TypeRush
          </h1>
          <p className="mb-8 text-center text-lg text-muted-foreground md:text-xl sm:mb-12">
            Test your typing speed and accuracy. The race against time starts now.
          </p>
          <TypingTest />
        </div>
      </main>
    </>
  );
}

    