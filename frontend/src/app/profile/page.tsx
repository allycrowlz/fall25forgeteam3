'use client';
import ProtectedRoute from '../components/ProtectedRoute';
import { useEffect, useState } from 'react';
import { getCurrentUser, User, authenticatedFetch, logout } from '../services/authService';
import { useRouter } from 'next/navigation';
import { getUserGroups, type Group } from '../services/groupService';
import { Building2, Phone, Cake, Mail, Shield, LogOut, Edit, Crown, Users } from 'lucide-react';

// Consistent colors from groups page
const PAGE_BG = "#E8F3E9";
const BROWN = "#4C331D";
const GREEN = "#407947";
const LIGHT_GREEN = "#CFDFD1";
const BEIGE = "#DCCEBD";

function formatDate(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso + 'T00:00:00');
  return isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateForInput(iso?: string | null): string {
  if (!iso) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    return iso;
  }
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function initials(name?: string) {
  if (!name) return 'U';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(s => s[0]!.toUpperCase())
    .join('');
}

function ProfileContent() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  // Form state
  const [editForm, setEditForm] = useState({
    profile_name: '',
    phone: '',
    birthday: '',
    picture: '',
  });

  // Password change state
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const me = await getCurrentUser();
      setUser(me);
      
      // Load user's groups
      if (me.profile_id) {
        const userGroups = await getUserGroups(parseInt(me.profile_id, 10));
        setGroups(userGroups);
      }
      
      setEditForm({
        profile_name: me.profile_name || '',
        phone: me.phone || '',
        birthday: formatDateForInput(me.birthday) || '',
        picture: me.picture || '',
      });
    } catch (e: any) {
      setErr(e?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    
    try {
      const response = await authenticatedFetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_name: editForm.profile_name,
          phone: editForm.phone || null,
          birthday: editForm.birthday || null,
          picture: editForm.picture || null,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Update failed:', errorText);
        throw new Error(errorText || 'Failed to update profile');
      }

      const updatedUser = await response.json();
      setUser(updatedUser);
      setIsEditing(false);
    } catch (e: any) {
      console.error('Save error:', e);
      setSaveError(e?.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    if (user) {
      setEditForm({
        profile_name: user.profile_name || '',
        phone: user.phone || '',
        birthday: formatDateForInput(user.birthday) || '',
        picture: user.picture || '',
      });
    }
    setSaveError(null);
    setIsEditing(false);
  }

  async function handlePasswordChange() {
    setPasswordError(null);
    
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setPasswordError('Please fill in all password fields');
      return;
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    if (passwordForm.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }

    setPasswordSaving(true);
    
    try {
      const response = await authenticatedFetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_password: passwordForm.currentPassword,
          new_password: passwordForm.newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to change password');
      }

      alert('Password changed successfully!');
      setShowPasswordChange(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e: any) {
      setPasswordError(e?.message || 'Failed to change password');
    } finally {
      setPasswordSaving(false);
    }
  }

  async function handleLogout() {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      router.push('/login');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center" style={{ backgroundColor: PAGE_BG }}>
        <div className="text-lg font-medium" style={{ color: BROWN }}>Loading your profile…</div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="min-h-screen grid place-items-center" style={{ backgroundColor: PAGE_BG }}>
        <div className="text-red-600 font-medium">{err}</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen grid place-items-center" style={{ backgroundColor: PAGE_BG }}>
        <div style={{ color: BROWN }}>No user data.</div>
      </div>
    );
  }

  const joined = user.created_at
    ? new Date(user.created_at).toLocaleString(undefined, { month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: PAGE_BG }}>
      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: GREEN }}>Profile</h1>
          <p style={{ color: BROWN }}>Manage your account</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Info Card */}
            <div className="rounded-3xl p-6 shadow-lg border" style={{ backgroundColor: "white", borderColor: BROWN }}>
              <div className="flex flex-col items-center text-center">
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt={user.profile_name}
                    className="w-32 h-32 rounded-full object-cover border-4 shadow-md mb-4"
                    style={{ borderColor: BROWN }}
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full flex items-center justify-center text-4xl text-white font-bold shadow-md mb-4 border-4" style={{ backgroundColor: GREEN, borderColor: GREEN }}>
                    {initials(user.profile_name)}
                  </div>
                )}
                
                <h2 className="text-2xl font-bold mb-1" style={{ color: BROWN }}>{user.profile_name}</h2>
                <p className="text-sm mb-4" style={{ color: BROWN }}>{user.email}</p>
                
                {joined && (
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-6" style={{ backgroundColor: BEIGE, color: BROWN }}>
                    Member since {joined}
                  </div>
                )}

                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold hover:opacity-90 transition-all shadow-md"
                  style={{ backgroundColor: GREEN, color: "white" }}
                >
                  <Edit className="h-4 w-4" />
                  Edit Profile
                </button>
              </div>

              {/* Contact Info */}
              <div className="mt-6 pt-6 space-y-3" style={{ borderTop: `1px solid ${BROWN}33` }}>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5" style={{ color: GREEN }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium" style={{ color: BROWN }}>Email</p>
                    <p className="text-sm truncate" style={{ color: BROWN }}>{user.email}</p>
                  </div>
                </div>
                
                {user.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5" style={{ color: GREEN }} />
                    <div className="flex-1">
                      <p className="text-xs font-medium" style={{ color: BROWN }}>Phone</p>
                      <p className="text-sm" style={{ color: BROWN }}>{user.phone}</p>
                    </div>
                  </div>
                )}
                
                {user.birthday && (
                  <div className="flex items-center gap-3">
                    <Cake className="h-5 w-5" style={{ color: GREEN }} />
                    <div className="flex-1">
                      <p className="text-xs font-medium" style={{ color: BROWN }}>Birthday</p>
                      <p className="text-sm" style={{ color: BROWN }}>{formatDate(user.birthday)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Logout Card */}
            <div className="rounded-3xl p-6 shadow-lg border" style={{ backgroundColor: "white", borderColor: BROWN }}>
              <div className="flex items-center gap-2 mb-3">
                <LogOut className="h-5 w-5 text-red-600" />
                <h3 className="text-lg font-semibold text-red-900">Sign Out</h3>
              </div>
              <p className="text-sm mb-4" style={{ color: BROWN }}>You'll need to sign in again to access your account</p>
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all shadow-md hover:shadow-lg"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Groups Card */}
            <div className="rounded-3xl p-6 shadow-lg border" style={{ backgroundColor: "white", borderColor: BROWN }}>
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-6 w-6" style={{ color: GREEN }} />
                <h2 className="text-2xl font-bold" style={{ color: BROWN }}>Your Groups</h2>
                <span className="ml-auto px-3 py-1 rounded-full text-sm font-semibold" style={{ backgroundColor: GREEN, color: "white" }}>
                  {groups.length}
                </span>
              </div>
              
              {groups.length === 0 ? (
                <div className="text-center py-12 rounded-xl border-2 border-dashed" style={{ backgroundColor: BEIGE, borderColor: BROWN }}>
                  <Building2 className="h-12 w-12 mx-auto mb-3" style={{ color: BROWN }} />
                  <p className="mb-1 font-medium" style={{ color: BROWN }}>No groups yet</p>
                  <p className="text-sm mb-6" style={{ color: BROWN }}>Create or join a group to get started</p>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => router.push('/groups/create')}
                      className="px-5 py-2.5 rounded-xl font-semibold hover:opacity-90 transition-all shadow-md"
                      style={{ backgroundColor: GREEN, color: "white" }}
                    >
                      Create Group
                    </button>
                    <button
                      onClick={() => router.push('/groups/join')}
                      className="px-5 py-2.5 bg-white border-2 rounded-xl font-semibold hover:opacity-90 transition-all"
                      style={{ borderColor: BROWN, color: BROWN }}
                    >
                      Join Group
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {groups.map((group) => (
                      <div
                        key={group.group_id}
                        className="group relative p-5 rounded-xl border-2 hover:shadow-lg transition-all cursor-pointer"
                        style={{ backgroundColor: "white", borderColor: BROWN }}
                        onClick={() => router.push('/groups')}
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg group-hover:scale-110 transition-transform">
                            <Building2 className="h-8 w-8" style={{ color: BROWN }}/>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold truncate" style={{ color: BROWN }}>
                                {group.group_name}
                              </h3>
                              {group.is_creator && (
                                <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                                  <Crown className="h-3 w-3" />
                                  Creator
                                </span>
                              )}
                            </div>
                            <p className="text-sm" style={{ color: BROWN }}>
                              {group.is_creator ? 'You created this group' : 'Member'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => router.push('/groups/create')}
                      className="flex-1 px-4 py-2.5 rounded-xl font-semibold hover:opacity-90 transition-all shadow-md"
                      style={{ backgroundColor: GREEN, color: "white" }}
                    >
                      + New Group
                    </button>
                    <button
                      onClick={() => router.push('/groups/join')}
                      className="flex-1 px-4 py-2.5 bg-white border-2 rounded-xl font-semibold hover:opacity-90 transition-all"
                      style={{ borderColor: BROWN, color: BROWN }}
                    >
                      + Join Group
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Security Card */}
            <div className="rounded-3xl p-6 shadow-lg border" style={{ backgroundColor: "white", borderColor: BROWN }}>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-6 w-6" style={{ color: GREEN }} />
                <h2 className="text-2xl font-bold" style={{ color: BROWN }}>Security</h2>
              </div>
              
              {!showPasswordChange ? (
                <div className="rounded-xl p-4" style={{ backgroundColor: BEIGE }}>
                  <p className="text-sm mb-4" style={{ color: BROWN }}>Keep your account secure by using a strong password</p>
                  <button
                    onClick={() => setShowPasswordChange(true)}
                    className="w-full px-4 py-2.5 rounded-xl font-semibold hover:opacity-90 transition-all shadow-md"
                    style={{ backgroundColor: GREEN, color: "white" }}
                  >
                    Change Password
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {passwordError && (
                    <div className="p-4 bg-red-50 border-2 border-red-300 text-red-700 rounded-xl text-sm flex items-start gap-2">
                      <span className="font-semibold">⚠️</span>
                      <span>{passwordError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: BROWN }}>Current Password</label>
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 bg-white"
                      style={{ borderColor: BROWN, color: BROWN }}
                      placeholder="Enter current password"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: BROWN }}>New Password</label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 bg-white"
                      style={{ borderColor: BROWN, color: BROWN }}
                      placeholder="At least 8 characters"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: BROWN }}>Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 bg-white"
                      style={{ borderColor: BROWN, color: BROWN }}
                      placeholder="Re-enter new password"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => {
                        setShowPasswordChange(false);
                        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                        setPasswordError(null);
                      }}
                      disabled={passwordSaving}
                      className="flex-1 px-4 py-2.5 border-2 rounded-xl font-semibold hover:opacity-80 transition-colors disabled:opacity-50"
                      style={{ borderColor: BROWN, color: BROWN, backgroundColor: "white" }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handlePasswordChange}
                      disabled={passwordSaving}
                      className="flex-1 px-4 py-2.5 rounded-xl font-semibold hover:opacity-90 transition-colors disabled:opacity-50 shadow-md"
                      style={{ backgroundColor: GREEN, color: "white" }}
                    >
                      {passwordSaving ? 'Changing...' : 'Update Password'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border" style={{ borderColor: BROWN }}>
            <h2 className="text-2xl font-bold mb-6" style={{ color: BROWN }}>Edit Profile</h2>
            
            {saveError && (
              <div className="mb-4 p-4 bg-red-50 border-2 border-red-300 text-red-700 rounded-xl text-sm">
                {saveError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: BROWN }}>Name</label>
                <input
                  type="text"
                  value={editForm.profile_name}
                  onChange={(e) => setEditForm({ ...editForm, profile_name: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 bg-white"
                  style={{ borderColor: BROWN, color: BROWN }}
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: BROWN }}>Phone</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 bg-white"
                  style={{ borderColor: BROWN, color: BROWN }}
                  placeholder="Your phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: BROWN }}>Birthday</label>
                <input
                  type="date"
                  value={editForm.birthday}
                  onChange={(e) => setEditForm({ ...editForm, birthday: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 bg-white"
                  style={{ borderColor: BROWN, color: BROWN }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: BROWN }}>Picture URL</label>
                <input
                  type="url"
                  value={editForm.picture}
                  onChange={(e) => setEditForm({ ...editForm, picture: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 bg-white"
                  style={{ borderColor: BROWN, color: BROWN }}
                  placeholder="https://example.com/photo.jpg"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCancel}
                disabled={saving}
                className="flex-1 px-4 py-2.5 border-2 rounded-xl font-semibold hover:opacity-80 transition-colors disabled:opacity-50"
                style={{ borderColor: BROWN, color: BROWN, backgroundColor: "white" }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !editForm.profile_name.trim()}
                className="flex-1 px-4 py-2.5 rounded-xl font-semibold hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                style={{ backgroundColor: GREEN, color: "white" }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}