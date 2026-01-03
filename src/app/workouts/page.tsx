'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import WorkoutForm from '@/components/WorkoutForm';
import WorkoutList from '@/components/WorkoutList';
import AuthGuard from '@/components/AuthGuard';

type Workout = {
  date: string;
  exercises: {
    id: string;
    name: string;
    sets: {
      setNumber: number;
      reps: number;
      weight: number;
    }[];
  }[];
};

export default function WorkoutsPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkouts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/workouts');
      
      if (!response.ok) {
        throw new Error('Failed to fetch workouts');
      }
      
      const data = await response.json();
      setWorkouts(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkouts();
  }, []);

  const handleWorkoutAdded = () => {
    setShowForm(false);
    fetchWorkouts();
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-zinc-50 dark:bg-black py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-semibold text-black dark:text-zinc-50">
            Workouts
          </h1>
          <div className="flex gap-3">
            <Link
              href="/exercises"
              className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 text-black dark:text-zinc-50 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Exercises
            </Link>
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-black dark:bg-zinc-50 text-white dark:text-black rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
            >
              {showForm ? 'Cancel' : 'Add Workout'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg">
            {error}
          </div>
        )}

        {showForm && (
          <div className="mb-6">
            <WorkoutForm onSuccess={handleWorkoutAdded} onCancel={() => setShowForm(false)} />
          </div>
        )}

        {loading ? (
          <div className="text-center py-8 text-zinc-600 dark:text-zinc-400">
            Loading workouts...
          </div>
        ) : workouts.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              No workouts yet. Add your first workout to get started!
            </p>
          </div>
        ) : (
          <WorkoutList workouts={workouts} />
        )}
      </div>
    </div>
    </AuthGuard>
  );
}

