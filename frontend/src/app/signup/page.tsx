"use client";

import Link from "next/link";
import { useState } from "react";


export default function SignUpPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());

    try {
      // Replace with your actual API route or Python backend endpoint
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Signup failed");
      }

      // Redirect or show success state
      window.location.href = "/dashboard"; // adjust to your app
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-emerald-900">
              Home<span className="text-emerald-700">B</span>ase
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm p-6">
          <h1 className="text-xl font-semibold text-zinc-900">Get Started Now</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Enter your information to create your account.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-zinc-700">
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="Jane Doe"
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                required
                placeholder="you@example.com"
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            {/* Phone (optional) */}
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="phone" className="block text-sm font-medium text-zinc-700">
                  Phone number
                </label>
                <span className="text-xs text-zinc-400">optional</span>
              </div>
              <input
                id="phone"
                name="phone"
                type="tel"
                inputMode="tel"
                placeholder="(555) 123-4567"
                pattern="[+()\-\s\d]{7,}"
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3 pt-2">
              <input id="terms" name="terms" type="checkbox" required className="mt-1 h-4 w-4 rounded border-zinc-300 text-emerald-700 focus:ring-emerald-600" />
              <label htmlFor="terms" className="text-sm text-zinc-600">
                I agree to the <Link className="underline underline-offset-4" href="#">Terms</Link> and <Link className="underline underline-offset-4" href="#">Privacy Policy</Link>.
              </label>
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:opacity-60"
            >
              {loading ? "Creating account…" : "Sign up"}
            </button>

            {/* Switch to login */}
            <p className="pt-2 text-center text-sm text-zinc-600">
              Have an account?{' '}
              <Link href="/login" className="font-medium text-emerald-800 hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}