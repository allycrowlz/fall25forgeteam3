"use client";

import { useState } from 'react';
import Image from 'next/image';
import { login, setToken, getCurrentUser } from '../services/authService';

const PAGE_BG = "#E8F3E9";
const BROWN = "#4C331D";
const GREEN = "#407947";
const LIGHT_GREEN = "#CFDFD1";
const BEIGE = "#DCCEBD";

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

      // CRITICAL: Fetch user data to get profile_id
      console.log('✅ Login successful, fetching user profile...');
      await getCurrentUser();
      console.log('✅ Profile fetched, profile_id saved to localStorage');

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
    <main 
      className="min-h-screen flex items-center justify-center p-6"
      style={{ backgroundColor: PAGE_BG }}
    >
      <div className="w-full max-w-6xl flex rounded-2xl shadow-xl overflow-hidden" style={{ backgroundColor: 'white' }}>
        {/* Left side - Branding */}
        <div 
          className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12"
          style={{ backgroundColor: GREEN }}
        >
          <div className="text-center">
            <div className="mb-8 flex justify-center">
              <div className="bg-white rounded-2xl p-6">
                <Image
                  src="/logo.svg"
                  alt="HomeBase Logo"
                  width={150}
                  height={50}
                />
              </div>
            </div>
            <p className="text-xl mb-12" style={{ color: 'white', opacity: 0.9 }}>
              Your roommate management hub
            </p>
            <div className="mt-12 space-y-4 text-left">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 mt-1 flex-shrink-0" fill="white" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                <div>
                  <p className="font-semibold" style={{ color: 'white' }}>Shared Expenses</p>
                  <p style={{ color: 'white', opacity: 0.8 }}>Track and split bills easily</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 mt-1 flex-shrink-0" fill="white" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                <div>
                  <p className="font-semibold" style={{ color: 'white' }}>Task Management</p>
                  <p style={{ color: 'white', opacity: 0.8 }}>Organize chores and responsibilities</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 mt-1 flex-shrink-0" fill="white" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                <div>
                  <p className="font-semibold" style={{ color: 'white' }}>Shared Calendar</p>
                  <p style={{ color: 'white', opacity: 0.8 }}>Stay coordinated with your group</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="w-full lg:w-1/2 p-12 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            {/* Mobile logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="inline-block">
                <Image
                  src="/logo.svg"
                  alt="HomeBase Logo"
                  width={150}
                  height={50}
                />
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-bold" style={{ color: BROWN }}>
                Welcome Back
              </h2>
              <p className="mt-2" style={{ color: BROWN, opacity: 0.7 }}>
                Sign in to your account to continue
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label 
                  htmlFor="email" 
                  className="block text-sm font-semibold mb-2"
                  style={{ color: BROWN }}
                >
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2"
                  style={{
                    border: `1px solid ${LIGHT_GREEN}`,
                    color: BROWN,
                    backgroundColor: 'white'
                  }}
                  onFocus={(e) => e.target.style.borderColor = GREEN}
                  onBlur={(e) => e.target.style.borderColor = LIGHT_GREEN}
                />
              </div>

              {/* Password */}
              <div>
                <label 
                  htmlFor="password" 
                  className="block text-sm font-semibold mb-2"
                  style={{ color: BROWN }}
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2"
                  style={{
                    border: `1px solid ${LIGHT_GREEN}`,
                    color: BROWN,
                    backgroundColor: 'white'
                  }}
                  onFocus={(e) => e.target.style.borderColor = GREEN}
                  onBlur={(e) => e.target.style.borderColor = LIGHT_GREEN}
                />
              </div>

              {/* Error */}
              {error && (
                <div 
                  className="px-4 py-3 rounded-lg"
                  style={{
                    backgroundColor: '#FEE2E2',
                    border: '1px solid #FCA5A5',
                    color: BROWN
                  }}
                  role="alert"
                >
                  <p className="text-sm font-semibold">{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 rounded-lg font-semibold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: GREEN,
                  color: 'white'
                }}
                onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#356839')}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = GREEN}
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>

              {/* Switch to signup */}
              <p className="text-center text-sm pt-4" style={{ color: BROWN }}>
                Don't have an account?{' '}
                <a 
                  href="/signup" 
                  className="font-semibold hover:underline"
                  style={{ color: GREEN }}
                >
                  Sign up
                </a>
              </p>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}