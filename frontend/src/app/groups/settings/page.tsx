'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGroup } from '../../contexts/GroupContext';
import { 
  getGroupMembers, 
  regenerateJoinCode, 
  removeMember,
  leaveGroup,
  updateGroup,
  deleteGroup,
  type GroupMember 
} from '../../services/groupService';
import { getCurrentUser } from '../../services/authService';
import ProtectedRoute from '../../components/ProtectedRoute';
import { 
  Users, 
  Calendar, 
  Key, 
  Copy, 
  RefreshCw, 
  Trash2, 
  LogOut,
  Crown,
  Edit2,
  X,
  Check,
  ArrowLeft
} from 'lucide-react';
import Image from 'next/image';

// Consistent colors
const PAGE_BG = "#E8F3E9";
const BROWN = "#4C331D";
const GREEN = "#407947";
const LIGHT_GREEN = "#CFDFD1";
const BEIGE = "#DCCEBD";

function GroupSettingsContent() {
  const router = useRouter();
  const { currentGroup, refreshGroups, allGroups } = useGroup();
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await getCurrentUser();
        if (user.profile_id) {
          setCurrentUserId(parseInt(user.profile_id, 10));
        }

        if (currentGroup) {
          const groupMembers = await getGroupMembers(currentGroup.group_id);
          setMembers(groupMembers);
          setNewGroupName(currentGroup.group_name);
        }
      } catch (error) {
        console.error('Failed to fetch group data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentGroup]);

  const handleCopyCode = async () => {
    if (currentGroup) {
      await navigator.clipboard.writeText(currentGroup.join_code);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleRegenerateCode = async () => {
    if (!currentGroup || !currentUserId) return;
    
    if (!confirm('Are you sure you want to regenerate the join code? The old code will no longer work.')) {
      return;
    }

    try {
      const result = await regenerateJoinCode(currentGroup.group_id, currentUserId);
      await refreshGroups();
      
      // Update the current view with new code
      const updatedMembers = await getGroupMembers(currentGroup.group_id);
      setMembers(updatedMembers);
      
      alert('Join code regenerated successfully!');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to regenerate code');
    }
  };

  const handleRemoveMember = async (memberId: number, memberName: string) => {
    if (!currentGroup || !currentUserId) return;

    if (!confirm(`Are you sure you want to remove ${memberName} from the group?`)) {
      return;
    }

    try {
      await removeMember(currentGroup.group_id, memberId, currentUserId);
      setMembers(members.filter(m => m.profile_id !== memberId));
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to remove member');
    }
  };

  const handleLeaveGroup = async () => {
    if (!currentGroup || !currentUserId) return;

    const creator = members.find(m => m.is_creator);
    if (creator?.profile_id === currentUserId) {
      alert('You cannot leave a group you created. Please delete the group instead or transfer ownership first.');
      return;
    }

    if (!confirm('Are you sure you want to leave this group?')) {
      return;
    }

    try {
      await leaveGroup(currentGroup.group_id, currentUserId);
      await refreshGroups();
      router.push('/groups');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to leave group');
    }
  };

  const handleUpdateGroupName = async () => {
    if (!currentGroup || !currentUserId || !newGroupName.trim()) return;

    try {
      await updateGroup(currentGroup.group_id, currentUserId, {
        group_name: newGroupName.trim(),
      });
      await refreshGroups();
      setIsEditingName(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update group name');
    }
  };

  const handleDeleteGroup = async () => {
    if (!currentGroup || !currentUserId) return;

    const creator = members.find(m => m.is_creator);
    if (creator?.profile_id !== currentUserId) {
      alert('Only the group creator can delete the group.');
      return;
    }

    if (!confirm(`Are you sure you want to delete "${currentGroup.group_name}"? This action cannot be undone and will delete all group data.`)) {
      return;
    }

    const confirmText = prompt('Type DELETE to confirm:');
    if (confirmText !== 'DELETE') {
      return;
    }

    try {
      await deleteGroup(currentGroup.group_id, currentUserId);
      await refreshGroups();
      router.push('/groups');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete group');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center" style={{ backgroundColor: PAGE_BG }}>
        <div className="text-lg font-medium" style={{ color: BROWN }}>Loading group settings…</div>
      </div>
    );
  }

  if (!currentGroup) {
    return (
      <div className="min-h-screen grid place-items-center" style={{ backgroundColor: PAGE_BG }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4" style={{ color: BROWN }}>No Group Selected</h1>
          <button
            onClick={() => router.push('/groups')}
            className="px-6 py-2.5 rounded-xl font-semibold hover:opacity-90 transition-all shadow-md"
            style={{ backgroundColor: GREEN, color: "white" }}
          >
            Go to Groups
          </button>
        </div>
      </div>
    );
  }

  const creator = members.find(m => m.is_creator);
  const isCreator = creator?.profile_id === currentUserId;

  return (
    <div className="min-h-screen" style={{ backgroundColor: PAGE_BG }}>
      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          
          <div className="flex items-center gap-4">
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="text-4xl font-bold mb-2 px-3 py-2 border-2 rounded-xl bg-white"
                  style={{ borderColor: BROWN, color: BROWN }}
                  autoFocus
                />
                <button
                  onClick={handleUpdateGroupName}
                  className="p-2 rounded-lg hover:opacity-90 transition-all"
                  style={{ backgroundColor: GREEN, color: "white" }}
                >
                  <Check className="h-5 w-5" />
                </button>
                <button
                  onClick={() => {
                    setIsEditingName(false);
                    setNewGroupName(currentGroup.group_name);
                  }}
                  className="p-2 rounded-lg hover:opacity-80 transition-all"
                  style={{ backgroundColor: BEIGE, color: BROWN }}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <>
                <h1 className="text-4xl font-bold" style={{ color: GREEN }}>
                  {currentGroup.group_name}
                </h1>
                {isCreator && (
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="p-2 rounded-lg hover:opacity-80 transition-all"
                    style={{ color: BROWN, backgroundColor: BEIGE }}
                    title="Edit group name"
                  >
                    <Edit2 className="h-5 w-5" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Column - Takes 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Group Information */}
            <div className="bg-white rounded-3xl shadow-lg p-6 border" style={{ borderColor: BROWN }}>
              <h2 className="text-2xl font-bold mb-6" style={{ color: BROWN }}>Group Information</h2>
              
              <div className="space-y-5">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: LIGHT_GREEN }}>
                    <Calendar className="h-5 w-5" style={{ color: GREEN }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1" style={{ color: BROWN }}>Created</p>
                    <p className="font-semibold text-lg" style={{ color: BROWN }}>
                      {new Date(currentGroup.date_created).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: BEIGE }}>
                    <Crown className="h-5 w-5" style={{ color: BROWN }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1" style={{ color: BROWN }}>Created by</p>
                    <p className="font-semibold text-lg" style={{ color: BROWN }}>
                      {creator?.profile_name || 'Unknown'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: LIGHT_GREEN }}>
                    <Users className="h-5 w-5" style={{ color: GREEN }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1" style={{ color: BROWN }}>Members</p>
                    <p className="font-semibold text-lg" style={{ color: BROWN }}>{members.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Join Code */}
            <div className="bg-white rounded-3xl shadow-lg p-6 border" style={{ borderColor: BROWN }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold" style={{ color: BROWN }}>Join Code</h2>
                {isCreator && (
                  <button
                    onClick={handleRegenerateCode}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg font-medium hover:opacity-80 transition-all text-sm"
                    style={{ backgroundColor: BEIGE, color: BROWN }}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Regenerate
                  </button>
                )}
              </div>

              <div className="rounded-xl p-5" style={{ backgroundColor: BEIGE }}>
                <div className="flex items-center gap-3 mb-3">
                  <Key className="h-6 w-6" style={{ color: GREEN }} />
                  <p className="text-3xl font-bold tracking-wider" style={{ color: BROWN }}>
                    {currentGroup.join_code}
                  </p>
                </div>
                <button
                  onClick={handleCopyCode}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border-2 rounded-xl font-medium hover:opacity-80 transition-all"
                  style={{ borderColor: BROWN, color: BROWN }}
                >
                  <Copy className="h-4 w-4" />
                  {copySuccess ? 'Copied!' : 'Copy Code'}
                </button>
              </div>
              <p className="text-sm mt-3" style={{ color: BROWN }}>
                Share this code to invite others
              </p>
            </div>

            {/* Group Actions */}
            <div className="bg-white rounded-3xl shadow-lg p-6 border" style={{ borderColor: BROWN }}>
              <h2 className="text-xl font-bold mb-4" style={{ color: BROWN }}>Group Actions</h2>
              
              <div className="space-y-3">
                {!isCreator && (
                  <button
                    onClick={handleLeaveGroup}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 rounded-xl font-semibold hover:opacity-80 transition-all"
                    style={{ borderColor: BROWN, color: BROWN }}
                  >
                    <LogOut className="h-5 w-5" />
                    Leave Group
                  </button>
                )}
                
                {isCreator && (
                  <button
                    onClick={handleDeleteGroup}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold hover:opacity-90 transition-all shadow-md"
                    style={{ backgroundColor: BROWN, color: "white" }}
                  >
                    <Trash2 className="h-5 w-5" />
                    Delete Group
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Takes 3 columns */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-3xl shadow-lg p-6 border" style={{ borderColor: BROWN }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold" style={{ color: BROWN }}>Members</h2>
                <span className="px-4 py-2 rounded-full text-sm font-semibold" style={{ backgroundColor: GREEN, color: "white" }}>
                  {members.length} {members.length === 1 ? 'Member' : 'Members'}
                </span>
              </div>
              
              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member.profile_id}
                    className="flex items-center justify-between p-5 rounded-xl border-2"
                    style={{ backgroundColor: BEIGE, borderColor: BROWN }}
                  >
                    <div className="flex items-center gap-4">
                      {member.picture ? (
                        <Image
                          src={member.picture}
                          alt={member.profile_name}
                          width={56}
                          height={56}
                          className="rounded-full object-cover border-2"
                          style={{ borderColor: BROWN }}
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl border-2" style={{ backgroundColor: GREEN, borderColor: GREEN }}>
                          {member.profile_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-lg" style={{ color: BROWN }}>
                            {member.profile_name}
                          </p>
                          {member.is_creator && (
                            <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: BEIGE, color: BROWN, border: `2px solid ${BROWN}` }}>
                              <Crown className="h-3 w-3" />
                              Creator
                            </span>
                          )}
                          {member.profile_id === currentUserId && (
                            <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: LIGHT_GREEN, color: BROWN }}>
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-sm" style={{ color: BROWN }}>{member.email}</p>
                      </div>
                    </div>

                    {isCreator && member.profile_id !== currentUserId && !member.is_creator && (
                      <button
                        onClick={() => handleRemoveMember(member.profile_id, member.profile_name)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Remove member"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function GroupSettingsPage() {
  return (
    <ProtectedRoute>
      <GroupSettingsContent />
    </ProtectedRoute>
  );
}