import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getExercisesByUser, seedBaseExercises, createExercise } from "@/lib/repositories/exerciseRepo";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if(!session?.user?.id) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    try {
        // Auto-seed base exercises if user doesn't have any
        await seedBaseExercises(session.user.id);
        
        const exercises = await getExercisesByUser(session.user.id);
        return NextResponse.json(exercises);
    } catch (err: any) {
        console.error('Error fetching exercises:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        
        // Check if it's a missing column error
        if (err?.code === '42703' && err?.message?.includes('user_id')) {
            return NextResponse.json(
                { 
                    error: "Database migration required", 
                    details: "The exercises table needs to be migrated. Please POST to /api/migrate to run the migration.",
                    migrationRequired: true
                },
                { status: 500 }
            );
        }
        
        return NextResponse.json(
            { error: "Failed to fetch exercises", details: errorMessage },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if(!session?.user?.id) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    const body = await req.json();
    const { name, muscle_group } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json(
            { error: "Exercise name is required" },
            { status: 400 }
        );
    }

    // Handle muscle_group: convert empty strings to null
    const muscleGroupValue = muscle_group && typeof muscle_group === 'string' && muscle_group.trim().length > 0
        ? muscle_group.trim()
        : null;

    try {
        const exercise = await createExercise(session.user.id, name.trim(), muscleGroupValue);
        return NextResponse.json(exercise, { status: 201 });
    } catch (err) {
        console.error('Error creating exercise:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json(
            { error: "Failed to create exercise", details: errorMessage },
            { status: 500 }
        );
    }
}

