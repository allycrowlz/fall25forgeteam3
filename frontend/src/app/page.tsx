'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('access_token');
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-b from-blue-50 to-white">
      <div className="text-center space-y-8">
        <h1 className="text-6xl font-bold text-green-900">
          Welcome to HomeBase
        </h1>
        
        <div className="flex gap-4 justify-center pt-8">
          <Link 
            href="/login"
            className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
          >
            Log In
          </Link>
          <Link 
            href="/signup"
            className="px-8 py-3 border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition font-semibold"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </main>
  );
}