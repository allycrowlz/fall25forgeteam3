'use client';

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from '../components/ProtectedRoute';
import { getCurrentUser, type User } from '../services/authService';
import {
  createGroup,
  joinGroup,
  getUserGroups,
  leaveGroup,
  type Group,
  type JoinGroupResponse,
} from "../services/groupService";

function GroupsContent() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create group state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupPhoto, setGroupPhoto] = useState("");
  const [creating, setCreating] = useState(false);
  const [createdGroup, setCreatedGroup] = useState<Group | null>(null);

  // Join group state
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
        
        const userGroups = await getUserGroups();
        setGroups(userGroups);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load groups");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || !user?.profile_id) return;

    setCreating(true);
    setError("");

    try {
      const newGroup = await createGroup({
        group_name: groupName.trim(),
        group_photo: groupPhoto.trim() || null,
        profile_id: parseInt(user.profile_id, 10),
      });

      setCreatedGroup(newGroup);
      setGroups((prev) => [newGroup, ...prev]);
      setGroupName("");
      setGroupPhoto("");
      setShowCreateForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create group");
    } finally {
      setCreating(false);
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim() || !user?.profile_id) return;

    setJoining(true);
    setError("");

    try {
      const result: JoinGroupResponse = await joinGroup(
        joinCode.trim().toUpperCase(),
        parseInt(user.profile_id, 10)
      );

      // Reload groups to show the newly joined group
      const userGroups = await getUserGroups();
      setGroups(userGroups);

      setJoinCode("");
      setShowJoinForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join group");
    } finally {
      setJoining(false);
    }
  };

  const handleLeaveGroup = async (groupId: number) => {
    if (!user?.profile_id || !confirm("Are you sure you want to leave this group?")) return;

    try {
      await leaveGroup(groupId);
      setGroups((prev) => prev.filter((g) => g.group_id !== groupId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to leave group");
    }
  };

  const copyJoinCode = (code: string) => {
    navigator.clipboard.writeText(code);
    alert("Join code copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div style={{ color: '#4C331D' }}>Loading groups...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-6xl mx-auto px-8 py-12">
        <div className="mb-8">
          <h1 className="text-5xl font-bold mb-2" style={{ color: '#407947' }}>
            Your Groups
          </h1>
          <p className="text-gray-600">
            Create groups and invite others using unique join codes
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-100 border-2 border-red-300 text-red-700 px-4 py-3 rounded-xl">
            <p className="font-semibold">❌ {error}</p>
          </div>
        )}

        {createdGroup && (
          <div className="mb-6 bg-green-50 border-2 border-green-300 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-800 font-semibold mb-1">
                  ✅ Group created successfully!
                </p>
                <p className="text-gray-700 text-sm">
                  Share this invite code: <span className="font-mono font-bold text-lg">{createdGroup.join_code}</span>
                </p>
              </div>
              <button
                onClick={() => copyJoinCode(createdGroup.join_code)}
                className="px-4 py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all"
              >
                📋 Copy Code
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => {
              setShowCreateForm(!showCreateForm);
              setShowJoinForm(false);
            }}
            className="px-6 py-3 bg-gray-600 text-white rounded-xl font-semibold hover:bg-gray-700 transition-all shadow-md hover:shadow-lg"
          >
            {showCreateForm ? "Cancel" : "+ Create Group"}
          </button>
          <button
            onClick={() => {
              setShowJoinForm(!showJoinForm);
              setShowCreateForm(false);
            }}
            className="px-6 py-3 bg-white text-gray-700 border-2 border-gray-300 rounded-xl font-semibold hover:bg-gray-50 transition-all"
          >
            {showJoinForm ? "Cancel" : "+ Join Group"}
          </button>
        </div>

        {/* Create Group Form */}
        {showCreateForm && (
          <div className="mb-8 bg-white rounded-3xl p-8 shadow-xl border-2 border-gray-300">
            <h2 className="text-2xl font-bold mb-4">Create a New Group</h2>
            <p className="text-gray-600 mb-6">
              Create a group and get a unique invite code to share with others.
            </p>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label htmlFor="groupName" className="block text-sm font-semibold text-gray-700 mb-2">
                  Group Name *
                </label>
                <input
                  id="groupName"
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g., Apartment 4B, College House"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                  required
                  disabled={creating}
                  maxLength={100}
                />
              </div>
              <div>
                <label htmlFor="groupPhoto" className="block text-sm font-semibold text-gray-700 mb-2">
                  Group Photo URL (optional)
                </label>
                <input
                  id="groupPhoto"
                  type="url"
                  value={groupPhoto}
                  onChange={(e) => setGroupPhoto(e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                  disabled={creating}
                />
              </div>
              <button
                type="submit"
                className="w-full px-6 py-3 bg-gray-600 text-white rounded-xl font-semibold hover:bg-gray-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={creating || !groupName.trim()}
              >
                {creating ? "Creating..." : "Create Group"}
              </button>
            </form>
          </div>
        )}

        {/* Join Group Form */}
        {showJoinForm && (
          <div className="mb-8 bg-white rounded-3xl p-8 shadow-xl border-2 border-gray-300">
            <h2 className="text-2xl font-bold mb-4">Join a Group</h2>
            <p className="text-gray-600 mb-6">
              Enter the 8-character invite code provided by a group member.
            </p>
            <form onSubmit={handleJoinGroup} className="space-y-4">
              <div>
                <label htmlFor="joinCode" className="block text-sm font-semibold text-gray-700 mb-2">
                  Invite Code *
                </label>
                <input
                  id="joinCode"
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Enter 8-character code (e.g., ABC12345)"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-lg font-mono uppercase tracking-wider"
                  required
                  disabled={joining}
                  maxLength={8}
                  minLength={8}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Codes are 8 characters long and contain letters and numbers
                </p>
              </div>
              <button
                type="submit"
                className="w-full px-6 py-3 bg-gray-600 text-white rounded-xl font-semibold hover:bg-gray-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={joining || !joinCode.trim() || joinCode.length !== 8}
              >
                {joining ? "Joining..." : "Join Group"}
              </button>
            </form>
          </div>
        )}

        {/* Groups List */}
        <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-gray-300">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Your Groups</h2>
            <span className="text-sm text-gray-500">
              {groups.length} group{groups.length === 1 ? "" : "s"}
            </span>
          </div>

          {groups.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">You're not in any groups yet.</p>
              <p className="text-sm text-gray-500 mb-4">
                Create a new group or join one using an invite code above.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map((group) => (
                <div
                  key={group.group_id}
                  className="border-2 border-gray-300 rounded-2xl p-6 hover:shadow-lg transition-all bg-white"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1" style={{ color: '#4C331D' }}>
                        {group.group_name}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {new Date(group.date_created).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-700 font-semibold">
                      {group.is_creator ? "Admin" : "Member"}
                    </span>
                  </div>

                  {group.group_photo && (
                    <div className="mb-4 rounded-xl overflow-hidden">
                      <img
                        src={group.group_photo}
                        alt={group.group_name}
                        className="w-full h-32 object-cover"
                      />
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-600 mb-1">Invite Code</p>
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-lg tracking-wider">
                          {group.join_code}
                        </span>
                        <button
                          onClick={() => copyJoinCode(group.join_code)}
                          className="text-gray-600 hover:text-gray-800 transition-colors"
                          title="Copy code"
                        >
                          📋
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link
                        href={`/groups/${group.group_id}`}
                        className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-xl font-semibold hover:bg-gray-700 transition-all text-center text-sm"
                      >
                        View Details
                      </Link>
                      {!group.is_creator && (
                        <button
                          onClick={() => handleLeaveGroup(group.group_id)}
                          className="px-4 py-2 bg-red-100 text-red-700 rounded-xl font-semibold hover:bg-red-200 transition-all text-sm"
                        >
                          Leave
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function GroupsPage() {
  return (
    <ProtectedRoute>
      <GroupsContent />
    </ProtectedRoute>
  );
}
