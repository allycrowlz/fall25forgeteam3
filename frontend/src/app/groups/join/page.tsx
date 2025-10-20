'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { joinGroup } from '../../services/groupService';

export default function JoinGroupPage() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // TODO: Replace with real user ID from authentication
  const TEMP_PROFILE_ID = 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await joinGroup(
        joinCode.trim().toUpperCase(),
        TEMP_PROFILE_ID
      );
      
      setSuccess(true);
      
      setTimeout(() => {
        router.push('/groups');
      }, 2000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md border-2 border-gray-300">
        
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Join a Group
          </h1>
          <p className="text-gray-600">
            Enter the invite code to join an existing group
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div>
            <label 
              htmlFor="joinCode" 
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Invite Code
            </label>
            <input
              id="joinCode"
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Enter invite code"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-lg font-mono uppercase"
              disabled={loading || success}
              required
              maxLength={8}
            />
          </div>

          {error && (
            <div className="bg-red-100 border-2 border-red-300 text-red-700 px-4 py-3 rounded-xl">
              <p className="font-semibold">❌ {error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-100 border-2 border-green-300 text-green-700 px-4 py-3 rounded-xl">
              <p className="font-semibold">
                ✅ Successfully joined group! Redirecting...
              </p>
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.push('/groups')}
              className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-400 transition-all"
              disabled={loading}
            >
              Cancel
            </button>
            
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-xl font-semibold hover:bg-gray-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || success || !joinCode.trim()}
            >
              {loading ? 'Joining...' : 'Join Group'}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Don't have an invite code?</p>
          <p>Ask a group member to share their group's invite code with you.</p>
        </div>
      </div>
    </div>
  );
}