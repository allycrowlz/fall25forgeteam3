'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createGroup } from '../../services/groupService';
import { getCurrentUser } from '../../services/authService';
import ProtectedRoute from '../../components/ProtectedRoute';

function CreateGroupContent() {
  const router = useRouter();
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdGroup, setCreatedGroup] = useState<{ group_id: number; join_code: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await getCurrentUser();
      if (!user.profile_id) {
        throw new Error('User profile ID not found');
      }

      const newGroup = await createGroup({
        group_name: groupName.trim(),
        profile_id: parseInt(user.profile_id, 10),
      });

      // Store the created group info to show the join code
      setCreatedGroup({
        group_id: newGroup.group_id,
        join_code: newGroup.join_code
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  // If group was created successfully, show the join code
  if (createdGroup) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md border-2 border-gray-300">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              ✅ Group Created!
            </h1>
            <p className="text-gray-600">
              Share this code with your roommates
            </p>
          </div>

          <div className="bg-gray-100 border-2 border-gray-300 rounded-xl p-6 mb-6">
            <p className="text-sm text-gray-600 mb-2 text-center">Join Code</p>
            <p className="text-3xl font-bold text-center text-gray-900 tracking-wider">
              {createdGroup.join_code}
            </p>
          </div>

          <button
            onClick={() => navigator.clipboard.writeText(createdGroup.join_code)}
            className="w-full mb-3 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all"
          >
            📋 Copy Code
          </button>

          <button
            onClick={() => router.push(`/groups/${createdGroup.group_id}/settings`)}
            className="w-full px-6 py-3 bg-gray-600 text-white rounded-xl font-semibold hover:bg-gray-700 transition-all shadow-md hover:shadow-lg"
          >
            Go to Group Settings
          </button>

          <button
            onClick={() => router.push('/')}
            className="w-full mt-3 px-6 py-3 bg-white text-gray-700 border-2 border-gray-300 rounded-xl font-semibold hover:bg-gray-50 transition-all"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Original form
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md border-2 border-gray-300">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Create a Group
          </h1>
          <p className="text-gray-600">
            Start a new group for your roommates
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label 
              htmlFor="groupName" 
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Group Name
            </label>
            <input
              id="groupName"
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g., College House, Downtown Apartment"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
              disabled={loading}
              required
              maxLength={100}
            />
          </div>

          {error && (
            <div className="bg-red-100 border-2 border-red-300 text-red-700 px-4 py-3 rounded-xl">
              <p className="font-semibold">❌ {error}</p>
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-400 transition-all"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-xl font-semibold hover:bg-gray-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || !groupName.trim()}
            >
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 mb-2">
            After creating your group, you'll get an invite code to share with roommates.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CreateGroupPage() {
  return (
    <ProtectedRoute>
      <CreateGroupContent />
    </ProtectedRoute>
  );
}