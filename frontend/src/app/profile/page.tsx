export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-gray-100 text-black">
      <main className="max-w-2xl mx-auto px-8 py-12">
        <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-gray-300">
          <h1 className="text-4xl font-bold mb-4">Your Profile</h1>
          <div className="flex items-center gap-6 mb-8">
            <div className="w-24 h-24 rounded-full bg-gray-400 flex items-center justify-center text-3xl text-white font-bold">AB</div>
            <div>
              <div className="text-xl font-semibold">Alex Brown</div>
              <div className="text-gray-600">alex@example.com</div>
              <div className="text-gray-600">Birthday: Jan 15, 2000</div>
              <div className="text-gray-600">Phone: (555) 123-4567</div>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <span className="font-medium">Groups:</span> Group 1, Group 2
            </div>
            <div>
              <span className="font-medium">Role:</span> Member
            </div>
            <div>
              <span className="font-medium">Joined:</span> Jan 2024
            </div>
            <div>
              <span className="font-medium">Address:</span> 123 Main St, Springfield
            </div>
          </div>
          <button className="mt-8 px-6 py-3 bg-emerald-800 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-all shadow-md hover:shadow-lg">Edit Profile</button>
        </div>
      </main>
    </div>
  );
}