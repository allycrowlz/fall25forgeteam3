'use client';
import ProtectedRoute from '../components/ProtectedRoute';
import { useEffect, useState } from 'react';
import { getCurrentUser, User, authenticatedFetch } from '../services/authService';

function formatDate(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso + 'T00:00:00'); // Force local timezone interpretation
  return isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateForInput(iso?: string | null): string {
  if (!iso) return '';
  // If it's already in YYYY-MM-DD format, return it directly
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    return iso;
  }
  // Otherwise parse and format
  const d = new Date(iso + 'T00:00:00'); // Force local timezone interpretation
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
  const [user, setUser] = useState<User | null>(null);
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

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const me = await getCurrentUser();
      setUser(me);
      // Initialize form with current user data
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
          birthday: editForm.birthday || null, // Send as YYYY-MM-DD string
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
    // Reset form to current user data
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

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center" style={{ backgroundColor: "#E8F3E9" }}>
        <div style={{ color: "#4C331D" }}>Loading your profile…</div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="min-h-screen grid place-items-center" style={{ backgroundColor: "#E8F3E9" }}>
        <div className="text-red-600 font-medium">{err}</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen grid place-items-center" style={{ backgroundColor: "#E8F3E9" }}>
        <div style={{ color: "#4C331D" }}>No user data.</div>
      </div>
    );
  }

  const joined = user.created_at
    ? new Date(user.created_at).toLocaleString(undefined, { month: 'short', year: 'numeric' })
    : null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#E8F3E9", color: "#4C331D" }}>
      <main className="max-w-2xl mx-auto px-8 py-12">
        <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-gray-300">
          <h1 className="text-4xl font-bold mb-4" style={{ color: "#4C331D" }}>Your Profile</h1>
          
          <div className="flex items-center gap-6 mb-8">
            {user.picture ? (
              <img
                src={user.picture}
                alt={user.profile_name}
                className="w-24 h-24 rounded-full object-cover border"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-400 flex items-center justify-center text-3xl text-white font-bold">
                {initials(user.profile_name)}
              </div>
            )}
            <div>
              <div className="text-xl font-semibold" style={{ color: "#4C331D" }}>{user.profile_name}</div>
              <div style={{ color: "#4C331D", opacity: 0.7 }}>{user.email}</div>
              {user.phone && <div style={{ color: "#4C331D", opacity: 0.7 }}>Phone: {user.phone}</div>}
              {user.birthday && <div style={{ color: "#4C331D", opacity: 0.7 }}>Birthday: {formatDate(user.birthday)}</div>}
            </div>
          </div>

          <div className="space-y-4">
            {!!user.groups?.length && (
              <div style={{ color: "#4C331D" }}>
                <span className="font-medium">Groups:</span> {user.groups.join(', ')}
              </div>
            )}
            {user.role && (
              <div style={{ color: "#4C331D" }}>
                <span className="font-medium">Role:</span> {user.role}
              </div>
            )}
            {joined && (
              <div style={{ color: "#4C331D" }}>
                <span className="font-medium">Joined:</span> {joined}
              </div>
            )}
          </div>

          <button
            onClick={() => setIsEditing(true)}
            className="mt-8 px-6 py-3 bg-emerald-800 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-all shadow-md hover:shadow-lg"
          >
            Edit Profile
          </button>
        </div>
      </main>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: "#E8F3E9" }}>
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-bold mb-6" style={{ color: "#4C331D" }}>Edit Profile</h2>
            
            {saveError && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                {saveError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "#4C331D" }}>Name</label>
                <input
                  type="text"
                  value={editForm.profile_name}
                  onChange={(e) => setEditForm({ ...editForm, profile_name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  style={{ color: "#4C331D" }}
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "#4C331D" }}>Phone</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  style={{ color: "#4C331D" }}
                  placeholder="Your phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "#4C331D" }}>Birthday</label>
                <input
                  type="date"
                  value={editForm.birthday}
                  onChange={(e) => setEditForm({ ...editForm, birthday: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  style={{ color: "#4C331D" }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "#4C331D" }}>Picture URL</label>
                <input
                  type="url"
                  value={editForm.picture}
                  onChange={(e) => setEditForm({ ...editForm, picture: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  style={{ color: "#4C331D" }}
                  placeholder="https://example.com/photo.jpg"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCancel}
                disabled={saving}
                className="flex-1 px-4 py-2 border rounded-lg font-medium transition-colors disabled:opacity-50"
                style={{ 
                  borderColor: "#4C331D",
                  color: "#4C331D",
                  backgroundColor: "white"
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !editForm.profile_name.trim()}
                className="flex-1 px-4 py-2 bg-emerald-800 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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