import Link from "next/link";
import ProgressChart from "@/components/ProgressChart";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-4xl mx-auto flex-col items-center py-16 px-4 sm:px-8">
        <div className="flex flex-col items-center gap-6 text-center mb-12">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-black dark:text-zinc-50">
            Welcome
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Track your workouts and monitor your progress over time.
          </p>
        </div>
        
        <div className="w-full mb-8">
          <ProgressChart />
        </div>

        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <Link
            href="/workouts"
            className="flex h-12 w-full items-center justify-center rounded-full bg-black dark:bg-zinc-50 text-white dark:text-black px-8 transition-colors hover:bg-zinc-800 dark:hover:bg-zinc-200"
          >
            View Workouts
          </Link>
          <Link
            href="/exercises"
            className="flex h-12 w-full w-xl items-center justify-center rounded-full border border-zinc-300 dark:border-zinc-700 text-black dark:text-zinc-50 px-8 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Manage Exercises
          </Link>
        </div>
      </main>
    </div>
  );
}
