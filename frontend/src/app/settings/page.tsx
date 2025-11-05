export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gray-100 text-black">
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
        </div>
      </main>
    </div>
  );
}