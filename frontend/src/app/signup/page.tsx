"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { register, setToken, getCurrentUser } from '../services/authService';

const PAGE_BG = "#E8F3E9";
const BROWN = "#4C331D";
const GREEN = "#407947";
const LIGHT_GREEN = "#CFDFD1";
const BEIGE = "#DCCEBD";

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
    } else if ((payload.password as string).length < 6) {
      errors.password = 'Password must be at least 6 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(payload.password as string)) {
      errors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    // Confirm password validation
    if (!payload.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (payload.password !== payload.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // Name validation
    if (!payload.profile_name || typeof payload.profile_name !== 'string' || (payload.profile_name as string).trim().length === 0) {
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

    if (!validateForm(payload)) {
      setLoading(false);
      return;
    }

    try {
      const response = await register({
        profile_name: payload.profile_name as string,
        email: payload.email as string,
        password: payload.password as string,
        picture: payload.picture ? (payload.picture as string) : null,
        birthday: payload.birthday ? (payload.birthday as string) : null,
        phone: payload.phone ? (payload.phone as string) : null,
      });

      // Save token
      setToken(response.access_token);
      
      // CRITICAL: Fetch user data to get profile_id
      console.log('✅ Registration successful, fetching user profile...');
      await getCurrentUser();
      console.log('✅ Profile fetched, profile_id saved to localStorage');
      
      // Redirect to profile
      window.location.href = "/profile";
    } catch (err: any) {
      if (err.message?.includes('fetch') || err.message?.includes('network')) {
        setError("Network error. Please check your connection and try again.");
      } else if (err.message?.includes('already registered') || err.message?.includes('already exists')) {
        setError("This email is already registered. Please use a different email or login.");
      } else {
        setError(err.message || "Registration failed. Please try again.");
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
            <div className="space-y-4 text-left">
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

        {/* Right side - Sign Up Form */}
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
                Get Started Now
              </h2>
              <p className="mt-2" style={{ color: BROWN, opacity: 0.7 }}>
                Enter your information to create your account
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label 
                  htmlFor="name" 
                  className="block text-sm font-semibold mb-2"
                  style={{ color: BROWN }}
                >
                  Name
                </label>
                <input
                  id="name"
                  name="profile_name"
                  type="text"
                  required
                  placeholder="Jane Doe"
                  className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2"
                  style={{
                    border: `1px solid ${validationErrors.profile_name ? '#FCA5A5' : LIGHT_GREEN}`,
                    color: BROWN,
                    backgroundColor: 'white'
                  }}
                  onFocus={(e) => !validationErrors.profile_name && (e.target.style.borderColor = GREEN)}
                  onBlur={(e) => !validationErrors.profile_name && (e.target.style.borderColor = LIGHT_GREEN)}
                />
                {validationErrors.profile_name && (
                  <p className="mt-1 text-xs" style={{ color: '#DC2626' }}>{validationErrors.profile_name}</p>
                )}
              </div>

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
                  inputMode="email"
                  required
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2"
                  style={{
                    border: `1px solid ${validationErrors.email ? '#FCA5A5' : LIGHT_GREEN}`,
                    color: BROWN,
                    backgroundColor: 'white'
                  }}
                  onFocus={(e) => !validationErrors.email && (e.target.style.borderColor = GREEN)}
                  onBlur={(e) => !validationErrors.email && (e.target.style.borderColor = LIGHT_GREEN)}
                />
                {validationErrors.email && (
                  <p className="mt-1 text-xs" style={{ color: '#DC2626' }}>{validationErrors.email}</p>
                )}
              </div>

              {/* Phone (optional) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label 
                    htmlFor="phone" 
                    className="block text-sm font-semibold"
                    style={{ color: BROWN }}
                  >
                    Phone number
                  </label>
                  <span className="text-xs" style={{ color: BROWN, opacity: 0.5 }}>optional</span>
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  placeholder="(555) 123-4567"
                  pattern="[+()\\-\\s\\d]{7,}"
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
                    border: `1px solid ${validationErrors.password ? '#FCA5A5' : LIGHT_GREEN}`,
                    color: BROWN,
                    backgroundColor: 'white'
                  }}
                  onFocus={(e) => !validationErrors.password && (e.target.style.borderColor = GREEN)}
                  onBlur={(e) => !validationErrors.password && (e.target.style.borderColor = LIGHT_GREEN)}
                />
                {validationErrors.password && (
                  <p className="mt-1 text-xs" style={{ color: '#DC2626' }}>{validationErrors.password}</p>
                )}
                <p className="mt-1 text-xs" style={{ color: BROWN, opacity: 0.6 }}>
                  Must contain uppercase, lowercase, and number
                </p>
              </div>

              {/* Confirm Password */}
              <div>
                <label 
                  htmlFor="confirmPassword" 
                  className="block text-sm font-semibold mb-2"
                  style={{ color: BROWN }}
                >
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2"
                  style={{
                    border: `1px solid ${validationErrors.confirmPassword ? '#FCA5A5' : LIGHT_GREEN}`,
                    color: BROWN,
                    backgroundColor: 'white'
                  }}
                  onFocus={(e) => !validationErrors.confirmPassword && (e.target.style.borderColor = GREEN)}
                  onBlur={(e) => !validationErrors.confirmPassword && (e.target.style.borderColor = LIGHT_GREEN)}
                />
                {validationErrors.confirmPassword && (
                  <p className="mt-1 text-xs" style={{ color: '#DC2626' }}>{validationErrors.confirmPassword}</p>
                )}
              </div>

              {/* Birthday (optional) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label 
                    htmlFor="birthday" 
                    className="block text-sm font-semibold"
                    style={{ color: BROWN }}
                  >
                    Birthday
                  </label>
                  <span className="text-xs" style={{ color: BROWN, opacity: 0.5 }}>optional</span>
                </div>
                <input
                  id="birthday"
                  name="birthday"
                  type="date"
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

              {/* Profile Picture URL (optional) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label 
                    htmlFor="picture" 
                    className="block text-sm font-semibold"
                    style={{ color: BROWN }}
                  >
                    Profile Picture URL
                  </label>
                  <span className="text-xs" style={{ color: BROWN, opacity: 0.5 }}>optional</span>
                </div>
                <input
                  id="picture"
                  name="picture"
                  type="text"
                  placeholder="https://example.com/your-profile-pic.jpg"
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
                {loading ? "Creating account..." : "Sign up"}
              </button>

              {/* Switch to login */}
              <p className="text-center text-sm pt-4" style={{ color: BROWN }}>
                Have an account?{' '}
                <Link 
                  href="/login" 
                  className="font-semibold hover:underline"
                  style={{ color: GREEN }}
                >
                  Sign in
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}