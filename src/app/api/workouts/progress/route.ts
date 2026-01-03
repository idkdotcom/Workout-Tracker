import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getWorkoutProgress } from "@/lib/repositories/workoutRepo";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if(!session?.user?.id) {
        return NextResponse.json(
            {error: "Unauthorized"},
            {status: 401}
        )
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') as 'week' | 'month' | '3months' | '6months' | 'year' || 'week';

    const validPeriods = ['week', 'month', '3months', '6months', 'year'];
    if (period && !validPeriods.includes(period)) {
        return NextResponse.json(
            {error: `Invalid period. Must be one of: ${validPeriods.join(', ')}`},
            {status: 400}
        )
    }

    try {
        const progress = await getWorkoutProgress(session.user.id, period);
        return NextResponse.json(progress);
    } catch (err) {
        console.error('Error fetching workout progress:', err);
        return NextResponse.json(
            {error: "Failed to fetch workout progress"},
            {status: 500}
        )
    }
}

