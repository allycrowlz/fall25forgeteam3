import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 text-black">
      {/* Header Navigation */}
      <header className="bg-gray-300 shadow-md px-8 py-4 border-b-4 border-gray-400">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Left side - Dropdown and Add Button */}
          <div className="flex items-center gap-4">
            <select className="w-96 px-4 py-3 bg-white border-2 border-gray-400 rounded-xl text-base font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all">
              <option value="">Select a Group</option>
              <option className="bg-blue-100">Group 1</option>
              <option className="bg-green-100">Group 2</option>
              <option className="bg-purple-100">Group 3</option>
            </select>
            <button className="px-6 py-3 bg-gray-600 text-white rounded-xl font-semibold hover:bg-gray-700 transition-all shadow-md hover:shadow-lg transform hover:scale-105 whitespace-nowrap">
              + Add Group
            </button>
          </div>

          {/* Right side - Navigation Links */}
          <nav className="flex gap-8 items-center">
            <a href="/" className="text-black font-semibold underline hover:text-gray-700 transition-colors">
              Home
            </a>
            <a href="#" className="text-gray-700 font-semibold hover:text-black transition-colors">
              Lists
            </a>
            <a href="#" className="text-gray-700 font-semibold hover:text-black transition-colors">
              Chores
            </a>
            <a href="#" className="text-gray-700 font-semibold hover:text-black transition-colors">
              Expenses
            </a>
            <a href="/profile" className="text-gray-700 font-semibold hover:text-black transition-colors">
              Profile
            </a>
            <a href="/settings" className="text-gray-700 font-semibold hover:text-black transition-colors">
              Settings
            </a>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div>
            <h1 className="text-5xl font-bold mb-8">
              Welcome, [Name] 👋
            </h1>

            {/* Recent Activity Section */}
            <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-gray-300">
              <h2 className="text-3xl font-bold mb-6">Recent Activity</h2>
              <div className="space-y-4">
                {[
                  { text: 'Alex completed "Take out trash"', time: '2 hours ago', group: 'Group 1' },
                  { text: 'Sarah added items to Groceries list', time: '5 hours ago', group: 'Group 1' },
                  { text: 'Mike paid the electric bill', time: '1 day ago', group: 'Group 2' },
                  { text: 'You completed "Vacuum living room"', time: '2 days ago', group: 'Group 2' }
                ].map((activity, index) => (
                  <div
                    key={index}
                    className={`${activity.group === 'Group 1' ? 'bg-blue-100 border-blue-300' : 'bg-green-100 border-green-300'} border-2 rounded-2xl h-20 hover:shadow-md transition-all hover:scale-102 flex items-center justify-between px-6`}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{activity.text}</span>
                      <span className={`text-xs font-semibold ${activity.group === 'Group 1' ? 'text-blue-700' : 'text-green-700'}`}>{activity.group}</span>
                    </div>
                    <span className="text-sm text-gray-600">{activity.time}</span>
                  </div>
                ))}
              </div>
              <button className="mt-6 flex items-center gap-2 text-base font-semibold hover:text-gray-700 ml-auto group">
                See All Activity
                <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
              </button>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Upcoming Tasks Section */}
            <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-gray-300">
              <h2 className="text-2xl font-bold mb-4">Upcoming Tasks ✨</h2>
              <div className="grid grid-cols-3 gap-4 mb-3">
                {[
                  { name: 'Take out trash', date: 'Oct 8', group: 'Group 1', emoji: '🗑️' },
                  { name: 'Clean kitchen', date: 'Oct 9', group: 'Group 1', emoji: '🧽' },
                  { name: 'Vacuum living room', date: 'Oct 10', group: 'Group 2', emoji: '🧹' }
                ].map((task) => (
                  <div
                    key={task.name}
                    className={`${task.group === 'Group 1' ? 'bg-blue-100 border-blue-300' : 'bg-green-100 border-green-300'} rounded-2xl h-40 flex flex-col items-center justify-center px-4 border-2 hover:shadow-lg transition-all hover:scale-105 cursor-pointer`}
                  >
                    <div className="text-3xl mb-2">{task.emoji}</div>
                    <span className="font-bold text-center mb-1 text-sm">{task.name}</span>
                    <span className="text-xs text-gray-600 text-center font-medium">{task.date}</span>
                    <span className={`text-xs text-center font-semibold mt-1 ${task.group === 'Group 1' ? 'text-blue-700' : 'text-green-700'}`}>{task.group}</span>
                  </div>
                ))}
              </div>
              <button className="flex items-center gap-2 text-base font-semibold hover:text-gray-700 ml-auto group">
                See All Tasks
                <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
              </button>
            </div>

            {/* Your Lists Section */}
            <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-gray-300">
              <h2 className="text-3xl font-bold mb-6">Your Lists 📝</h2>
              <div className="grid grid-cols-3 gap-4 mb-4">
                {[
                  { name: 'Groceries', group: 'Group 1', emoji: '🛒' },
                  { name: 'Cleaning Supplies', group: 'Group 1', emoji: '🧴' },
                  { name: 'House Repairs', group: 'Group 2', emoji: '🔧' }
                ].map((list) => (
                  <div
                    key={list.name}
                    className={`${list.group === 'Group 1' ? 'bg-blue-100 border-blue-300' : 'bg-green-100 border-green-300'} rounded-2xl h-40 flex flex-col items-center justify-center px-4 border-2 hover:shadow-lg transition-all hover:scale-105 cursor-pointer`}
                  >
                    <div className="text-3xl mb-2">{list.emoji}</div>
                    <span className="font-bold text-center mb-1 text-sm">{list.name}</span>
                    <span className={`text-xs text-center font-semibold ${list.group === 'Group 1' ? 'text-blue-700' : 'text-green-700'}`}>{list.group}</span>
                  </div>
                ))}
              </div>
              <button className="flex items-center gap-2 text-base font-semibold hover:text-gray-700 ml-auto group">
                See All Lists
                <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
