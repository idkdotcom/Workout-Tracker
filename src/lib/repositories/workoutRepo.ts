import { pool } from "@/lib/db"

type SetInput = {
    exerciseId: string,
    setNumber: number;
    reps: number;
    weight: number;
}

export type ExerciseLog = {
    id: string;
    name: string;
    sets: {
        setNumber: number;
        reps: number;
        weight: number;
    }[];
};

export type WorkoutLog = {
    date: Date;
    exercises: ExerciseLog[];
};


export async function createWorkout(
    userId: string,
    workoutDate: string,
    sets: SetInput[]
) {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const workoutRes = await client.query(
            `
        INSERT INTO workout_sessions (user_id, workout_date)
        VALUES ($1, $2)
        RETURNING id
        `,
            [userId, workoutDate]
        );

        const workoutId = workoutRes.rows[0].id;

        for (const set of sets) {
            await client.query(
                `
            INSERT INTO set_logs
            (workout_id, exercise_id, set_number, reps, weight)
            VALUES ($1, $2, $3, $4, $5)
            `,
                [
                    workoutId,
                    set.exerciseId,
                    set.setNumber,
                    set.reps,
                    set.weight
                ]
            )
        }

        await client.query("COMMIT");

        return { workoutId };
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
}

export async function getWorkoutsByUser(userId: string): Promise<WorkoutLog[]> {
    const client = await pool.connect();

    try {
        const workouts = await client.query(
            `
            SELECT
            ws.id as workout_id,
            ws.workout_date as workout_date,
            e.id as exercise_id,
            e.name as exercise_name,
            sl.set_number,
            sl.reps,
            sl.weight

            FROM workout_sessions ws
            JOIN set_logs sl
            ON sl.workout_id = ws.id
            JOIN exercises e
            ON e.id = sl.exercise_id

            WHERE ws.user_id = $1

            ORDER BY
            ws.workout_date DESC,
            e.name ASC,
            sl.set_number ASC;
            `,
            [userId]
        )

        const workoutsMap = new Map<string, any>();

        for (const row of workouts.rows) {
            if (!workoutsMap.has(row.workout_id)) {
                workoutsMap.set(row.workout_id, {
                    date: row.workout_date,
                    exercises: new Map<string, any>(),
                });
            }

            const workout = workoutsMap.get(row.workout_id);

            if (!workout.exercises.has(row.exercise_id)) {
                workout.exercises.set(row.exercise_id, {
                    id: row.exercise_id,
                    name: row.exercise_name,
                    sets: [],
                })
            }

            workout.exercises.get(row.exercise_id).sets.push({
                setNumber: row.set_number,
                reps: row.reps,
                weight: row.weight,
            })
        }

        return Array.from(workoutsMap.values()).map(workout => ({
            date: workout.date,
            exercises: Array.from(workout.exercises.values()),
        }));
    } catch (err) {
        throw err;
    } finally {
        client.release();
    }
}

export async function getWorkoutProgress(
    userId: string,
    period: 'week' | 'month' | '3months' | '6months' | 'year'
) {
    const client = await pool.connect();

    try {
        let daysBack: number;
        switch (period) {
            case 'week':
                daysBack = 7;
                break;
            case 'month':
                daysBack = 30;
                break;
            case '3months':
                daysBack = 90;
                break;
            case '6months':
                daysBack = 180;
                break;
            case 'year':
                daysBack = 365;
                break;
            default:
                daysBack = 7;
        }
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysBack);
        const startDateStr = startDate.toISOString().split('T')[0];

        const result = await client.query(
            `
            SELECT
                DATE(ws.workout_date) as date,
                COUNT(DISTINCT ws.id) as workout_count,
                SUM(sl.reps * sl.weight) as total_volume
            FROM workout_sessions ws
            LEFT JOIN set_logs sl ON sl.workout_id = ws.id
            WHERE ws.user_id = $1
                AND DATE(ws.workout_date) >= $2
            GROUP BY DATE(ws.workout_date)
            ORDER BY DATE(ws.workout_date) ASC
            `,
            [userId, startDateStr]
        );

        // Create a map of all dates in the period
        const dateMap = new Map<string, { date: string; workoutCount: number; totalVolume: number }>();

        // Initialize all dates in the period with zero values
        for (let i = 0; i < daysBack; i++) {
            const date = new Date();
            date.setDate(date.getDate() - (daysBack - 1 - i));
            const dateStr = date.toISOString().split('T')[0];
            dateMap.set(dateStr, {
                date: dateStr,
                workoutCount: 0,
                totalVolume: 0
            });
        }

        // Fill in actual data
        for (const row of result.rows) {
            // Handle both Date objects and string dates from PostgreSQL
            let dateStr: string;
            if (row.date instanceof Date) {
                dateStr = row.date.toISOString().split('T')[0];
            } else {
                dateStr = typeof row.date === 'string' ? row.date.split('T')[0] : String(row.date);
            }
            dateMap.set(dateStr, {
                date: dateStr,
                workoutCount: parseInt(row.workout_count) || 0,
                totalVolume: parseFloat(row.total_volume) || 0
            });
        }

        return Array.from(dateMap.values());
    } catch (err) {
        throw err;
    } finally {
        client.release();
    }
}