'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createGroup } from '../../services/groupService';
import { getCurrentUser } from '../../services/authService';
import ProtectedRoute from '../../components/ProtectedRoute';

const PAGE_BG = "#E8F3E9";
const BROWN = "#4C331D";
const GREEN = "#407947";
const LIGHT_GREEN = "#CFDFD1";
const BEIGE = "#DCCEBD";

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
              Group Created!
            </h1>
            <p style={{ color: BROWN }}>
              Share this code with your roommates
            </p>
          </div>

          <div 
            className="rounded-lg p-6 mb-6"
            style={{
              backgroundColor: LIGHT_GREEN,
              border: `1px solid ${GREEN}`
            }}
          >
            <p 
              className="text-sm mb-2 text-center"
              style={{ color: BROWN }}
            >
              Join Code
            </p>
            <p 
              className="text-3xl font-bold text-center tracking-wider"
              style={{ color: BROWN }}
            >
              {createdGroup.join_code}
            </p>
          </div>

          <button
            onClick={() => navigator.clipboard.writeText(createdGroup.join_code)}
            className="w-full mb-3 px-6 py-3 rounded-lg font-semibold transition-all"
            style={{
              backgroundColor: BEIGE,
              color: BROWN,
              border: `1px solid ${LIGHT_GREEN}`
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D4C4B0'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = BEIGE}
          >
            Copy Code
          </button>

          <button
            onClick={() => router.push('/')}
            className="w-full px-6 py-3 rounded-lg font-semibold transition-all"
            style={{
              backgroundColor: 'white',
              color: BROWN,
              border: `1px solid ${LIGHT_GREEN}`
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = PAGE_BG}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Original form
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
            Create a Group
          </h1>
          <p style={{ color: BROWN }}>
            Start a new group for your roommates
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label 
              htmlFor="groupName" 
              className="block text-sm font-semibold mb-2"
              style={{ color: BROWN }}
            >
              Group Name
            </label>
            <input
              id="groupName"
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !loading && groupName.trim()) {
                  handleSubmit(e);
                }
              }}
              placeholder="e.g., College House, Downtown Apartment"
              className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2"
              style={{
                border: `1px solid ${LIGHT_GREEN}`,
                color: BROWN,
                backgroundColor: 'white'
              }}
              onFocus={(e) => e.target.style.borderColor = GREEN}
              onBlur={(e) => e.target.style.borderColor = LIGHT_GREEN}
              disabled={loading}
              required
              maxLength={100}
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
              disabled={loading || !groupName.trim()}
            >
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p 
            className="text-sm mb-2"
            style={{ color: BROWN }}
          >
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