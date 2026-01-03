import { pool } from "@/lib/db";

export async function getExercisesByUser(userId: string) {
    const client = await pool.connect();

    try {
        const result = await client.query(
            `
            SELECT id, name, muscle_group
            FROM exercises
            WHERE user_id = $1
            ORDER BY name ASC
            `,
            [userId]
        );

        return result.rows;
    } catch (err) {
        throw err;
    } finally {
        client.release();
    }
}

export async function createExercise(userId: string, name: string, muscleGroup: string | null) {
    const client = await pool.connect();

    try {
        const result = await client.query(
            `
            INSERT INTO exercises (user_id, name, muscle_group)
            VALUES ($1, $2, $3)
            RETURNING id, name, muscle_group
            `,
            [userId, name, muscleGroup]
        );

        return result.rows[0];
    } catch (err) {
        throw err;
    } finally {
        client.release();
    }
}

export async function hasExercises(userId: string): Promise<boolean> {
    const client = await pool.connect();

    try {
        const result = await client.query(
            `
            SELECT COUNT(*) as count
            FROM exercises
            WHERE user_id = $1
            `,
            [userId]
        );

        return parseInt(result.rows[0].count) > 0;
    } catch (err) {
        throw err;
    } finally {
        client.release();
    }
}

export async function seedBaseExercises(userId: string) {
    const client = await pool.connect();

    try {
        // Check if user already has exercises
        const hasExisting = await hasExercises(userId);
        if (hasExisting) {
            return; // Don't seed if user already has exercises
        }

        const baseExercises = [
            // Chest
            { name: 'Bench Press', muscle_group: 'Chest' },
            { name: 'Incline Bench Press', muscle_group: 'Chest' },
            { name: 'Dumbbell Press', muscle_group: 'Chest' },
            { name: 'Push-ups', muscle_group: 'Chest' },
            { name: 'Chest Fly', muscle_group: 'Chest' },
            
            // Back
            { name: 'Deadlift', muscle_group: 'Back' },
            { name: 'Barbell Row', muscle_group: 'Back' },
            { name: 'Pull-ups', muscle_group: 'Back' },
            { name: 'Lat Pulldown', muscle_group: 'Back' },
            { name: 'Cable Row', muscle_group: 'Back' },
            { name: 'T-Bar Row', muscle_group: 'Back' },
            
            // Shoulders
            { name: 'Overhead Press', muscle_group: 'Shoulders' },
            { name: 'Lateral Raise', muscle_group: 'Shoulders' },
            { name: 'Front Raise', muscle_group: 'Shoulders' },
            { name: 'Rear Delt Fly', muscle_group: 'Shoulders' },
            { name: 'Arnold Press', muscle_group: 'Shoulders' },
            
            // Legs
            { name: 'Squat', muscle_group: 'Legs' },
            { name: 'Leg Press', muscle_group: 'Legs' },
            { name: 'Leg Curl', muscle_group: 'Legs' },
            { name: 'Leg Extension', muscle_group: 'Legs' },
            { name: 'Romanian Deadlift', muscle_group: 'Legs' },
            { name: 'Lunges', muscle_group: 'Legs' },
            { name: 'Calf Raise', muscle_group: 'Legs' },
            
            // Arms
            { name: 'Bicep Curl', muscle_group: 'Arms' },
            { name: 'Hammer Curl', muscle_group: 'Arms' },
            { name: 'Tricep Extension', muscle_group: 'Arms' },
            { name: 'Tricep Dip', muscle_group: 'Arms' },
            { name: 'Close Grip Bench Press', muscle_group: 'Arms' },
            
            // Core
            { name: 'Plank', muscle_group: 'Core' },
            { name: 'Crunches', muscle_group: 'Core' },
            { name: 'Russian Twist', muscle_group: 'Core' },
            { name: 'Leg Raises', muscle_group: 'Core' },
        ];

        await client.query("BEGIN");

        for (const exercise of baseExercises) {
            await client.query(
                `
                INSERT INTO exercises (user_id, name, muscle_group)
                VALUES ($1, $2, $3)
                `,
                [userId, exercise.name, exercise.muscle_group]
            );
        }

        await client.query("COMMIT");
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
}

