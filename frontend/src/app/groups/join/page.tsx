'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { joinGroup } from '../../services/groupService';
import { getCurrentUser } from '../../services/authService';
import ProtectedRoute from '../../components/ProtectedRoute';

const PAGE_BG = "#E8F3E9";
const BROWN = "#4C331D";
const GREEN = "#407947";
const LIGHT_GREEN = "#CFDFD1";
const BEIGE = "#DCCEBD";

function JoinGroupContent() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Get current user
      const user = await getCurrentUser();
      
      if (!user.profile_id) {
        throw new Error('User profile ID not found');
      }
      
      // Join the group
      const result = await joinGroup(
        joinCode.trim().toUpperCase(),
        parseInt(user.profile_id, 10)
      );

      setSuccess(true);
      setTimeout(() => {
        router.push('/'); // Redirect to main page
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: PAGE_BG }}
    >
      <div 
        className="rounded-2xl shadow-lg p-8 w-full max-w-md"
        style={{ 
          backgroundColor: 'white',
          border: `1px solid ${LIGHT_GREEN}`
        }}
      >
        <div className="text-center mb-8">
          <h1 
            className="text-3xl font-bold mb-2"
            style={{ color: BROWN }}
          >
            Join a Group
          </h1>
          <p style={{ color: BROWN }}>
            Enter the invite code to join an existing group
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label 
              htmlFor="joinCode" 
              className="block text-sm font-semibold mb-2"
              style={{ color: BROWN }}
            >
              Invite Code
            </label>
            <input
              id="joinCode"
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !loading && !success && joinCode.trim()) {
                  handleSubmit(e);
                }
              }}
              placeholder="Enter invite code"
              className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 text-lg font-mono uppercase"
              style={{
                border: `1px solid ${LIGHT_GREEN}`,
                color: BROWN,
                backgroundColor: 'white'
              }}
              onFocus={(e) => e.target.style.borderColor = GREEN}
              onBlur={(e) => e.target.style.borderColor = LIGHT_GREEN}
              disabled={loading || success}
              required
              maxLength={8}
            />
          </div>

          {error && (
            <div 
              className="px-4 py-3 rounded-lg"
              style={{
                backgroundColor: '#FEE2E2',
                border: '1px solid #FCA5A5',
                color: BROWN
              }}
            >
              <p className="font-semibold">{error}</p>
            </div>
          )}

          {success && (
            <div 
              className="px-4 py-3 rounded-lg"
              style={{
                backgroundColor: LIGHT_GREEN,
                border: `1px solid ${GREEN}`,
                color: BROWN
              }}
            >
              <p className="font-semibold">
                Successfully joined group! Redirecting...
              </p>
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="flex-1 px-6 py-3 rounded-lg font-semibold transition-all"
              style={{
                backgroundColor: BEIGE,
                color: BROWN,
                border: `1px solid ${LIGHT_GREEN}`
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D4C4B0'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = BEIGE}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="flex-1 px-6 py-3 rounded-lg font-semibold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: GREEN,
                color: 'white'
              }}
              onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#356839')}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = GREEN}
              disabled={loading || success || !joinCode.trim()}
            >
              {loading ? 'Joining...' : 'Join Group'}
            </button>
          </div>
        </div>

        <div 
          className="mt-6 text-center text-sm"
          style={{ color: BROWN }}
        >
          <p>Don't have an invite code?</p>
          <p>Ask a group member to share their group's invite code with you.</p>
        </div>
      </div>
    </div>
  );
}

export default function JoinGroupPage() {
  return (
    <ProtectedRoute>
      <JoinGroupContent />
    </ProtectedRoute>
  );
}