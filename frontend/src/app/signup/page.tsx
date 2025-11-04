"use client";

import Link from "next/link";
import { useState } from "react";
import { register, setToken } from '../services/authService';

export default function SignUpPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  function validateForm(payload: Record<string, FormDataEntryValue>): boolean {
    const errors: Record<string, string> = {};

    // Email validation
    if (!payload.email || typeof payload.email !== 'string') {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(payload.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!payload.password || typeof payload.password !== 'string') {
      errors.password = 'Password is required';
    } else if (payload.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(payload.password)) {
      errors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    // Confirm password validation
    if (!payload.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (payload.password !== payload.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // Name validation
    if (!payload.profile_name || typeof payload.profile_name !== 'string' || payload.profile_name.trim().length === 0) {
      errors.profile_name = 'Name is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setValidationErrors({});
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());

    // Validate form
    if (!validateForm(payload)) {
      setLoading(false);
      return;
    }

    try {
      // Use auth service for registration
      const response = await register({
        profile_name: payload.profile_name as string,
        email: payload.email as string,
        password: payload.password as string,
        picture: payload.picture ? (payload.picture as string) : null,
        birthday: payload.birthday ? (payload.birthday as string) : null,
      });

      // Store token and auto-login
      setToken(response.access_token);

      // Redirect to expenses page
      window.location.href = "/expenses";
    } catch (err: any) {
      // Handle different error types
      if (err.message.includes('fetch') || err.message.includes('network')) {
        setError("Network error. Please check your connection and try again.");
      } else if (err.message.includes('already registered') || err.message.includes('already exists')) {
        setError("This email is already registered. Please use a different email or login.");
      } else {
        setError(err.message || "Registration failed. Please try again.");
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
                name="profile_name"
                type="text"
                required
                placeholder="Jane Doe"
                className={`mt-1 w-full rounded-md border ${
                  validationErrors.profile_name ? 'border-red-300' : 'border-zinc-300'
                } bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600`}
              />
              {validationErrors.profile_name && (
                <p className="mt-1 text-xs text-red-600">{validationErrors.profile_name}</p>
              )}
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
                className={`mt-1 w-full rounded-md border ${
                  validationErrors.email ? 'border-red-300' : 'border-zinc-300'
                } bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600`}
              />
              {validationErrors.email && (
                <p className="mt-1 text-xs text-red-600">{validationErrors.email}</p>
              )}
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
                className={`mt-1 w-full rounded-md border ${
                  validationErrors.password ? 'border-red-300' : 'border-zinc-300'
                } bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600`}
              />
              {validationErrors.password && (
                <p className="mt-1 text-xs text-red-600">{validationErrors.password}</p>
              )}
              <p className="mt-1 text-xs text-zinc-500">
                Must contain uppercase, lowercase, and number
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-zinc-700">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                placeholder="••••••••"
                className={`mt-1 w-full rounded-md border ${
                  validationErrors.confirmPassword ? 'border-red-300' : 'border-zinc-300'
                } bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600`}
              />
              {validationErrors.confirmPassword && (
                <p className="mt-1 text-xs text-red-600">{validationErrors.confirmPassword}</p>
              )}
            </div>

            {/* Birthday (optional) */}
            <div>
              <label htmlFor="birthday" className="block text-sm font-medium text-zinc-700">
                Birthday
              </label>
              <input
                id="birthday"
                name="birthday"
                type="date"
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            {/* Profile Picture URL (optional) */}
            <div>
              <label htmlFor="picture" className="block text-sm font-medium text-zinc-700">
                Profile Picture URL
              </label>
              <input
                id="picture"
                name="picture"
                type="text"
                placeholder="https://example.com/your-profile-pic.jpg"
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