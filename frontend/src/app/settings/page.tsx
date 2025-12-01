"use client";
import { logout } from '../services/authService';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '../components/ProtectedRoute';

function SettingsContent() {
  const router = useRouter();

  async function handleLogout() {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      // Even if logout fails, clear local token and redirect
      router.push('/login');
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#E8F3E9", color: "#4C331D" }}>
      <main className="max-w-2xl mx-auto px-8 py-12">
        <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-gray-300">
          <h1 className="text-4xl font-bold mb-4" style={{ color: "#4C331D" }}>Settings</h1>
          
          <form className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "#4C331D" }}>Change Password</label>
              <input 
                type="password" 
                placeholder="New password" 
                className="w-full rounded-md border border-zinc-300 px-3 py-2" 
                style={{ color: "#4C331D" }}
              />
            </div>
            
            <button 
              type="submit" 
              className="w-full rounded-md bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              Save Changes
            </button>
          </form>

          {/* Logout Section */}
          <div className="mt-8 pt-8 border-t border-gray-300">
            <h2 className="text-xl font-semibold mb-4" style={{ color: "#4C331D" }}>Account</h2>
            <button
              onClick={handleLogout}
              className="w-full rounded-md bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600"
            >
              Logout
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  );
}