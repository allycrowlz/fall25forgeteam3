'use client'

import { useRouter } from 'next/navigation'


export default function Navbar() {

    const router = useRouter();

    return (
        <nav className="bg-white shadow-md mb-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between items-center py-4">
            <div className="text-2xl font-bold text-gray-800">💰 ExpenseTracker</div>
            <div className="flex gap-2">
              <button
                className="px-6 py-2 rounded-lg font-medium transition bg-blue-600 text-white"
              >
                Dashboard
              </button>
              <button
                onClick={() => router.push('/expenses/bill-splitting')}
                className="px-6 py-2 rounded-lg font-medium transition bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Bill Splitting
              </button>
              <button
                onClick={() => router.push('/expenses/add-expense')}
                className="px-6 py-2 rounded-lg font-medium transition bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Add Expense
              </button>
            </div>
          </div>
        </div>
      </nav>
    );
}