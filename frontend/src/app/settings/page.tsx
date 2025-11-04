"use client";

import { logout } from '../services/authService';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
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
    <div className="min-h-screen bg-gray-100 text-black">
      <header className="bg-gray-300 shadow-md px-8 py-4 border-b-4 border-gray-400">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <span className="text-2xl font-bold">Settings</span>
          </div>
          <nav className="flex gap-8 items-center">
            <a href="/groups" className="text-gray-700 font-semibold hover:text-black transition-colors">Groups</a>
            <a href="/profile" className="text-gray-700 font-semibold hover:text-black transition-colors">Profile</a>
          </nav>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-8 py-12">
        <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-gray-300">
          <h1 className="text-4xl font-bold mb-4">Settings</h1>
          <form className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Notifications</label>
              <select className="w-full rounded-md border border-zinc-300 px-3 py-2">
                <option>Enabled</option>
                <option>Disabled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Theme</label>
              <select className="w-full rounded-md border border-zinc-300 px-3 py-2">
                <option>Light</option>
                <option>Dark</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Change Password</label>
              <input type="password" placeholder="New password" className="w-full rounded-md border border-zinc-300 px-3 py-2" />
            </div>
            <button type="submit" className="w-full rounded-md bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-600">Save Changes</button>
          </form>
          
          {/* Logout Section */}
          <div className="mt-8 pt-8 border-t border-gray-300">
            <h2 className="text-xl font-semibold mb-4">Account</h2>
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