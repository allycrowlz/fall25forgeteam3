'use client'

import { usePathname, useRouter } from 'next/navigation'


export default function Navbar() {

    const router = useRouter();
    const pathname = usePathname();

    return (
        <nav className="bg-white shadow-md mb-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between items-center py-4">
            <div className="text-2xl font-bold text-gray-800">💰 ExpenseTracker</div>
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/expenses')}
                className={`px-6 py-2 rounded-lg font-medium transition ${
                  pathname === '/expenses' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={pathname === '/expenses' ? { backgroundColor: '#407947' } : {}}
              >
                Dashboard
              </button>
              <button
                onClick={() => router.push('/expenses/add-expense')}
                className={`px-6 py-2 rounded-lg font-medium transition ${
                  pathname === '/expenses/add-expense' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={pathname === '/expenses/add-expense' ? { backgroundColor: '#407947' } : {}}
              >
                Add Expense
              </button>
            </div>
          </div>
        </div>
      </nav>
    );
}