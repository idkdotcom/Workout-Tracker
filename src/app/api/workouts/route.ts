import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createWorkout, getWorkoutsByUser } from "@/lib/repositories/workoutRepo";
import { NextResponse } from "next/server";
import { error } from "console";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    console.log(session);

    if(!session?.user?.id) {
        return NextResponse.json(
            { error : "Unauthorized" },
            { status: 401 }
        );
    }

    const body = await req.json();

    const { workoutDate, sets } = body;

    if (!workoutDate || !Array.isArray(sets)) {
        return NextResponse.json(
            { error : "Invalid payload" },
            { status : 400 }
        );
    }

    const result = await createWorkout(
        session.user.id,
        workoutDate,
        sets
    );

    return NextResponse.json(result, {status: 201});
}

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    console.log(session);

    if(!session?.user?.id) {
        return NextResponse.json(
            {error: "Unauthorized"},
            {status: 401}
        )
    }

    const workouts = await getWorkoutsByUser(session.user.id);

    return NextResponse.json(workouts);
}