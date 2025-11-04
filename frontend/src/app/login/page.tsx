"use client";

import { useState } from 'react';
import { login, setToken } from '../services/authService';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const email = form.get('email') as string;
    const password = form.get('password') as string;

    try {
      // Use auth service for login
      const response = await login({ email, password });
      
      // Store token
      setToken(response.access_token);

      // Redirect to groups
      window.location.href = "/groups";
    } catch (err: any) {
      // Handle different error types
      if (err.message.includes('fetch') || err.message.includes('network')) {
        setError("Network error. Please check your connection and try again.");
      } else {
        setError(err.message || "Login failed. Please check your credentials.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-6">
          <a href="/" className="inline-flex items-center gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-emerald-900">
              Home<span className="text-emerald-700">B</span>ase
            </span>
          </a>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm p-6">
          <h1 className="text-xl font-semibold text-zinc-900">Welcome Back</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Sign in to your account to continue.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="you@example.com"
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
              {loading ? "Signing in…" : "Sign in"}
            </button>

            {/* Switch to signup */}
            <p className="pt-2 text-center text-sm text-zinc-600">
              Don't have an account?{' '}
              <a href="/signup" className="font-medium text-emerald-800 hover:underline">
                Sign up
              </a>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
