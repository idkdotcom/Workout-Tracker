'use client';

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

type WorkoutListProps = {
  workouts: Workout[];
};

export default function WorkoutList({ workouts }: WorkoutListProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {workouts.map((workout, index) => (
        <div
          key={index}
          className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6"
        >
          <h2 className="text-xl font-semibold text-black dark:text-zinc-50 mb-4">
            {formatDate(workout.date)}
          </h2>
          
          <div className="space-y-4">
            {workout.exercises.map((exercise) => (
              <div
                key={exercise.id}
                className="border-l-4 border-zinc-300 dark:border-zinc-700 pl-4"
              >
                <h3 className="font-medium text-black dark:text-zinc-50 mb-2">
                  {exercise.name}
                </h3>
                <div className="space-y-1">
                  {exercise.sets.map((set, setIndex) => (
                    <div
                      key={setIndex}
                      className="text-sm text-zinc-600 dark:text-zinc-400"
                    >
                      Set {set.setNumber}: {set.reps} reps × {set.weight} lbs
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

