"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    } as any);

    setLoading(false);

    if (res?.error) {
      setError(res.error as string);
      return;
    }

    router.push("/");
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-12">
        <div className="bg-white dark:bg-zinc-900/60 rounded-lg shadow p-8 border border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">Sign in</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Welcome back — log your workout</p>
          </div>

          {error && (
            <div className="mb-4 text-red-700 bg-red-100 dark:bg-red-900/30 p-3 rounded">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full rounded border border-zinc-200 dark:border-zinc-800 p-2 bg-white dark:bg-zinc-900 text-black dark:text-zinc-50"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 block w-full rounded border border-zinc-200 dark:border-zinc-800 p-2 bg-white dark:bg-zinc-900 text-black dark:text-zinc-50"
              />
            </div>

            <div className="sm:col-span-2 flex items-center gap-4 mt-2">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center px-4 py-2 bg-black text-white rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-60"
              >
                {loading ? "Signing in…" : "Sign in"}
              </button>

              <Link href="/signup" className="text-sm text-zinc-600 dark:text-zinc-300 hover:underline">
                Create an account
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
