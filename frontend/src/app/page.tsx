'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { isAuthenticated } from './services/authService';

const PAGE_BG = "#E8F3E9";
const BROWN = "#4C331D";
const GREEN = "#407947";
const LIGHT_GREEN = "#CFDFD1";
const BEIGE = "#DCCEBD";

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if user is already logged in
    if (isAuthenticated()) {
      router.push('/groups');
    }
  }, [router]);

  if (!mounted) {
    return null;
  }

  return (
    <main 
      className="flex min-h-screen flex-col"
      style={{ backgroundColor: PAGE_BG }}
    >
      <div className="w-full">
        {/* Main Content - Split Layout */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-24 px-12 py-16 max-w-[1800px] mx-auto min-h-screen">
          {/* Left Side - House */}
          <div className="w-full lg:w-5/12 max-w-2xl">
            {/* Triangle Roof - Taller with Rounded Corners and Chimney */}
            <div className="flex justify-center mb-3 relative">
              <svg width="100%" height="200" viewBox="0 0 500 200" preserveAspectRatio="xMidYMid meet" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Chimney - positioned on the left side of roof */}
                <rect x="140" y="50" width="50" height="80" fill={BROWN} rx="4" />
                
                {/* Roof Triangle */}
                <path 
                  d="M 250 40 
                     Q 250 30, 260 38
                     L 475 195
                     Q 480 200, 475 200
                     L 25 200
                     Q 20 200, 25 195
                     L 240 38
                     Q 250 30, 250 40 Z" 
                  fill={BROWN} 
                />
              </svg>
            </div>

            {/* 2x2 Grid as House Base */}
            <div className="grid grid-cols-2 gap-8">
              <div 
                className="p-8 rounded-tl-xl shadow-lg"
                style={{ backgroundColor: 'white', border: `3px solid ${GREEN}` }}
              >
                <div className="mb-6">
                  <svg className="w-16 h-16 mx-auto" fill={GREEN} viewBox="0 0 20 20">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: BROWN }}>
                  Expenses
                </h3>
                <p className="text-base" style={{ color: BROWN, opacity: 0.7 }}>
                  Track and split bills
                </p>
              </div>

              <div 
                className="p-8 rounded-tr-xl shadow-lg"
                style={{ backgroundColor: 'white', border: `3px solid ${GREEN}` }}
              >
                <div className="mb-6">
                  <svg className="w-16 h-16 mx-auto" fill={GREEN} viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: BROWN }}>
                  Calendar
                </h3>
                <p className="text-base" style={{ color: BROWN, opacity: 0.7 }}>
                  Synced events
                </p>
              </div>

              <div 
                className="p-8 rounded-bl-xl shadow-lg"
                style={{ backgroundColor: 'white', border: `3px solid ${GREEN}` }}
              >
                <div className="mb-6">
                  <svg className="w-16 h-16 mx-auto" fill={GREEN} viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: BROWN }}>
                  Lists
                </h3>
                <p className="text-base" style={{ color: BROWN, opacity: 0.7 }}>
                  Shopping lists
                </p>
              </div>

              <div 
                className="p-8 rounded-br-xl shadow-lg"
                style={{ backgroundColor: 'white', border: `3px solid ${GREEN}` }}
              >
                <div className="mb-6">
                  <svg className="w-16 h-16 mx-auto" fill={GREEN} viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm2 5a1 1 0 011 1v3a1 1 0 11-2 0V8a1 1 0 011-1zm5 1a1 1 0 10-2 0v3a1 1 0 102 0V8z" clipRule="evenodd"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: BROWN }}>
                  Tasks
                </h3>
                <p className="text-base" style={{ color: BROWN, opacity: 0.7 }}>
                  Organize chores
                </p>
              </div>
            </div>
          </div>

          {/* Right Side - Text and Buttons */}
          <div className="w-full lg:w-6/12 space-y-16 text-center lg:text-left lg:pl-16">
            {/* Main Heading */}
            <div className="space-y-10">
              <div className="flex flex-col items-center lg:items-start">
                <h1 
                  className="text-8xl md:text-8xl lg:text-7xl font-normal leading-tight mb-6"
                  style={{ color: BROWN, fontFamily: 'Cooper Black, sans-serif' }}
                >
                  Welcome to
                </h1>
                <div className="mb-4">
                  <Image
                    src="/logo.svg"
                    alt="HomeBase Logo"
                    width={420}
                    height={140}
                  />
                </div>
              </div>
              <p 
                className="text-3xl md:text-4xl lg:text-4xl font-medium"
                style={{ color: GREEN, fontFamily: 'Arial, sans-serif' }}
              >
                Making shared living simple
              </p>
              <p 
                className="text-xl md:text-2xl lg:text-2xl max-w-3xl leading-relaxed"
                style={{ color: BROWN, opacity: 0.8, fontFamily: 'Arial, sans-serif' }}
              >
                Simplify shared living with expense tracking, task management, and seamless coordination all in one place.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex gap-6 justify-center lg:justify-start pt-8">
              <Link 
                href="/login"
                className="px-12 py-6 rounded-lg transition font-semibold text-2xl shadow-lg"
                style={{ backgroundColor: GREEN, color: 'white' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#356839'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = GREEN}
              >
                Log In
              </Link>
              <Link 
                href="/signup"
                className="px-12 py-6 rounded-lg transition font-semibold text-2xl shadow-lg"
                style={{ 
                  backgroundColor: 'white',
                  color: GREEN,
                  border: `2px solid ${GREEN}`
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = LIGHT_GREEN}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                Sign Up
              </Link>
            </div>

            {/* Footer tagline */}
            <p 
              className="text-lg pt-12"
              style={{ color: BROWN, opacity: 0.6, fontFamily: 'Arial, sans-serif' }}
            >
              The smart way to manage shared living spaces
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}