import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getWorkoutsByUser } from "@/lib/repositories/workoutRepo";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Simple in-memory rate limiter: Map<userId, timestamp[]>
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 10; // 10 requests per minute

function isRateLimited(userId: string): boolean {
    const now = Date.now();
    const userRequests = rateLimitMap.get(userId) || [];

    // Filter out requests older than the window
    const recentRequests = userRequests.filter(time => now - time < RATE_LIMIT_WINDOW);

    if (recentRequests.length >= MAX_REQUESTS) {
        return true;
    }

    recentRequests.push(now);
    rateLimitMap.set(userId, recentRequests);
    return false;
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;

        // 1. Rate Limiting Check
        if (isRateLimited(userId)) {
            return NextResponse.json(
                { error: "Too many requests. Please wait a moment." },
                { status: 429 }
            );
        }

        const { message } = await req.json();

        if (!message) {
            return NextResponse.json({ error: "Message is required" }, { status: 400 });
        }

        if (!process.env.GEMINI_API_KEY) {
            console.error("GEMINI_API_KEY is not set");
            return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
        }

        // 2. Fetch Context (Workout History)
        // Get last 20 workouts to provide recent context
        const recentWorkouts = await getWorkoutsByUser(userId);
        const workoutsContext = recentWorkouts.slice(0, 20).map(w => ({
            date: w.date,
            exercises: w.exercises.map(e => ({
                name: e.name,
                sets: e.sets.map(s => `${s.reps}x${s.weight}kg`).join(", ")
            }))
        }));

        // 3. Prepare Prompt
        const systemPrompt = `
    You are a helpful and motivating Gym Assistant. Your goal is to help the user analyze their workout progress and provide actionable recommendations.
    
    Here is the user's recent workout history (JSON format):
    ${JSON.stringify(workoutsContext, null, 2)}

    STRICT RULES:
    1. You must ONLY answer questions related to fitness, workouts, nutrition, and recovery.
    2. If the user asks about anything else (e.g., politics, history, coding), politely decline and remind them you are a gym assistant.
    3. Use the provided workout history to give specific, data-backed answers. For example, if they ask "What did I do last week?", look at the dates and specific exercises.
    4. Be concise, encouraging, and professional.
    5. Do NOT hallucinate workout data. If the data isn't in the history, say you don't have that record.
    `;

        // 4. Call Gemini API
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: systemPrompt }],
                },
                {
                    role: "model",
                    parts: [{ text: "Understood. I am your Gym Assistant. I have access to your recent workout history and will answer your fitness-related questions based on that data. How can I help you today?" }],
                }
            ]
        });

        const result = await chat.sendMessage(message);
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({ response: text });

    } catch (error) {
        console.error("AI Chat Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
