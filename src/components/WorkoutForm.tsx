'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type Exercise = {
  id: string;
  name: string;
  muscle_group?: string;
};

type Set = {
  exerciseId: string;
  setNumber: number;
  reps: number;
  weight: number;
};

type WorkoutFormProps = {
  onSuccess: () => void;
  onCancel: () => void;
};

export default function WorkoutForm({ onSuccess, onCancel }: WorkoutFormProps) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [workoutDate, setWorkoutDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [exerciseSets, setExerciseSets] = useState<
    Array<{
      exerciseId: string;
      sets: Array<{ reps: number; weight: number }>;
    }>
  >([]);

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const response = await fetch('/api/exercises');
        if (!response.ok) {
          throw new Error('Failed to fetch exercises');
        }
        const data = await response.json();
        setExercises(data);
        setError(null); // Clear error if exercises load successfully
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load exercises');
      } finally {
        setLoadingExercises(false);
      }
    };

    fetchExercises();
  }, []);

  const addExercise = () => {
    if (exercises.length === 0) {
      return;
    }
    setError(null); // Clear any previous errors
    setExerciseSets([
      ...exerciseSets,
      {
        exerciseId: exercises[0].id,
        sets: [{ reps: 0, weight: 0 }],
      },
    ]);
  };

  const removeExercise = (index: number) => {
    setExerciseSets(exerciseSets.filter((_, i) => i !== index));
  };

  const addSet = (exerciseIndex: number) => {
    const updated = [...exerciseSets];
    updated[exerciseIndex].sets.push({ reps: 0, weight: 0 });
    setExerciseSets(updated);
  };

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    const updated = [...exerciseSets];
    updated[exerciseIndex].sets = updated[exerciseIndex].sets.filter(
      (_, i) => i !== setIndex
    );
    setExerciseSets(updated);
  };

  const updateExercise = (index: number, exerciseId: string) => {
    const updated = [...exerciseSets];
    updated[index].exerciseId = exerciseId;
    setExerciseSets(updated);
  };

  const updateSet = (
    exerciseIndex: number,
    setIndex: number,
    field: 'reps' | 'weight',
    value: number
  ) => {
    const updated = [...exerciseSets];
    updated[exerciseIndex].sets[setIndex][field] = value;
    setExerciseSets(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (exerciseSets.length === 0) {
      setError('Please add at least one exercise');
      return;
    }

    // Flatten sets with exercise IDs and set numbers
    const allSets: Set[] = [];
    exerciseSets.forEach((exerciseSet) => {
      exerciseSet.sets.forEach((set, setIndex) => {
        if (set.reps > 0 && set.weight > 0) {
          allSets.push({
            exerciseId: exerciseSet.exerciseId,
            setNumber: setIndex + 1,
            reps: set.reps,
            weight: set.weight,
          });
        }
      });
    });

    if (allSets.length === 0) {
      setError('Please add at least one set with reps and weight');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/workouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workoutDate,
          sets: allSets,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create workout');
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create workout');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingExercises) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
        <p className="text-zinc-600 dark:text-zinc-400">Loading exercises...</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
      <h2 className="text-2xl font-semibold text-black dark:text-zinc-50 mb-4">
        Add Workout
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="workoutDate"
            className="block text-sm font-medium text-black dark:text-zinc-50 mb-2"
          >
            Date
          </label>
          <input
            type="date"
            id="workoutDate"
            value={workoutDate}
            onChange={(e) => setWorkoutDate(e.target.value)}
            required
            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-zinc-50"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <label className="block text-sm font-medium text-black dark:text-zinc-50">
              Exercises & Sets
            </label>
            <button
              type="button"
              onClick={addExercise}
              disabled={exercises.length === 0}
              className="px-3 py-1 text-sm bg-zinc-200 dark:bg-zinc-700 text-black dark:text-zinc-50 rounded hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-zinc-200 dark:disabled:hover:bg-zinc-700"
            >
              + Add Exercise
            </button>
          </div>

          {exercises.length === 0 && (
            <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium mb-1">
                No exercises available
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-2">
                You need to create exercises before you can add them to a workout.
              </p>
              <Link
                href="/exercises"
                className="text-sm text-yellow-800 dark:text-yellow-200 font-medium underline hover:text-yellow-900 dark:hover:text-yellow-100"
              >
                Go to Exercises Page →
              </Link>
            </div>
          )}

          {exerciseSets.length === 0 && exercises.length > 0 && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              Click "Add Exercise" to start logging your workout
            </p>
          )}

          <div className="space-y-4">
            {exerciseSets.map((exerciseSet, exerciseIndex) => (
              <div
                key={exerciseIndex}
                className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-4"
              >
                <div className="flex justify-between items-center mb-3">
                  <select
                    value={exerciseSet.exerciseId}
                    onChange={(e) => updateExercise(exerciseIndex, e.target.value)}
                    className="px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-zinc-50"
                  >
                    {exercises.map((exercise) => (
                      <option key={exercise.id} value={exercise.id}>
                        {exercise.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeExercise(exerciseIndex)}
                    className="px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                  >
                    Remove
                  </button>
                </div>

                <div className="space-y-2">
                  {exerciseSet.sets.map((set, setIndex) => (
                    <div
                      key={setIndex}
                      className="flex gap-2 items-center"
                    >
                      <span className="text-sm text-zinc-600 dark:text-zinc-400 w-12">
                        Set {setIndex + 1}:
                      </span>
                      <input
                        type="number"
                        placeholder="Reps"
                        value={set.reps || ''}
                        onChange={(e) =>
                          updateSet(
                            exerciseIndex,
                            setIndex,
                            'reps',
                            parseInt(e.target.value) || 0
                          )
                        }
                        min="0"
                        className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-zinc-50"
                      />
                      <span className="text-zinc-600 dark:text-zinc-400">×</span>
                      <input
                        type="number"
                        placeholder="Weight (lbs)"
                        value={set.weight || ''}
                        onChange={(e) =>
                          updateSet(
                            exerciseIndex,
                            setIndex,
                            'weight',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        min="0"
                        step="0.5"
                        className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-zinc-50"
                      />
                      <button
                        type="button"
                        onClick={() => removeSet(exerciseIndex, setIndex)}
                        className="px-2 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addSet(exerciseIndex)}
                    className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-zinc-50 transition-colors"
                  >
                    + Add Set
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 px-4 py-2 bg-black dark:bg-zinc-50 text-white dark:text-black rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Saving...' : 'Save Workout'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 text-black dark:text-zinc-50 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

