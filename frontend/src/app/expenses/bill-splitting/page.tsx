'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '../navbar'
import ProtectedRoute from '@/app/components/ProtectedRoute'

function BillSplittingContent() {
  const [selectedGroup, setSelectedGroup] = useState('Group 1')
  const router = useRouter()

  const groups = ['Group 1', 'Group 2', 'Group 3']
  
  const expenses = [
    { date: '10/01', item: 'Groceries', whoPaid: 'John', amount: 45.50 },
    { date: '10/03', item: 'Dinner', whoPaid: 'Sarah', amount: 67.25 },
    { date: '10/05', item: 'Gas', whoPaid: 'Mike', amount: 35.00 },
    { date: '09/28', item: 'Movie', whoPaid: 'John', amount: 24.00 },
    { date: '09/25', item: 'Coffee', whoPaid: 'Sarah', amount: 12.50 },
  ]

  const upcomingBills = [
    { name: 'Netflix', amount: 15.99, dueDate: '10/15' },
    { name: 'Spotify', amount: 9.99, dueDate: '10/18' },
    { name: 'Internet', amount: 59.99, dueDate: '10/20' }
  ]

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation Bar */}
      <Navbar />

      <div className="px-6 pb-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Bill Splitting</h1>
            <div className="flex gap-3">
              <select 
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2"
              >
                {groups.map(group => (
                  <option key={group}>{group}</option>
                ))}
              </select>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
                <span className="text-xl">👥</span>
                Manage Groups
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-4">
              <div className="bg-blue-600 text-white text-center py-3 rounded-lg font-semibold text-lg">
                {selectedGroup}
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-lg p-6">
                <div className="flex items-center gap-2 text-sm text-green-700 mb-2">
                  <span className="text-lg">↗</span>
                  <span>My Balance</span>
                </div>
                <div className="text-3xl font-bold text-green-700">$0.00</div>
                <div className="text-xs text-green-600 mt-1">All settled up! 🎉</div>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-lg p-6">
                <div className="flex items-center gap-2 text-sm text-red-700 mb-2">
                  <span className="text-lg">↘</span>
                  <span>Total Owed</span>
                </div>
                <div className="text-3xl font-bold text-red-700">$0.00</div>
                <div className="text-xs text-red-600 mt-1">No pending payments</div>
              </div>
              <button className="w-full bg-white border-2 border-gray-300 rounded-lg p-4 text-gray-700 hover:bg-gray-50 transition font-medium flex items-center justify-center gap-2">
                <span className="text-xl">📊</span>
                Graph View
              </button>
            </div>

            <div className="col-span-2 space-y-6">
              <div className="bg-white border-4 border-blue-400 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                    <span className="text-2xl">📅</span>
                    Upcoming Bills
                  </h2>
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    View All
                  </button>
                </div>
                <div className="space-y-2">
                  {upcomingBills.map((bill, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-4 flex justify-between items-center hover:bg-gray-100 transition">
                      <div>
                        <div className="font-medium text-gray-800">{bill.name}</div>
                        <div className="text-sm text-gray-500">Due: {bill.dueDate}</div>
                      </div>
                      <div className="text-lg font-bold text-gray-800">${bill.amount}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow">
                <div className="flex items-center justify-between bg-gradient-to-r from-gray-700 to-gray-600 text-white p-4 rounded-t-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📄</span>
                    <span className="font-semibold">Expense History</span>
                  </div>
                  <button 
                    onClick={() => router.push('/expenses/add-expense')}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition flex items-center gap-2 font-medium"
                  >
                    <span className="text-xl">+</span>
                    Add Expense
                  </button>
                </div>
               
                <div className="max-h-96 overflow-auto">
                  <div className="mb-4">
                    <div className="bg-gray-600 text-white text-sm py-3 px-4 font-semibold">October 2025</div>
                    <div className="grid grid-cols-4 gap-2 bg-gray-200 p-3 text-sm font-semibold text-gray-700">
                      <div>Date</div>
                      <div>Item</div>
                      <div>Who Paid</div>
                      <div>Amt Owe/Lent</div>
                    </div>
                    {expenses.slice(0, 3).map((expense, idx) => (
                      <div key={idx} className="grid grid-cols-4 gap-2 p-3 border-b hover:bg-gray-50 transition cursor-pointer">
                        <div className="text-sm text-gray-700">{expense.date}</div>
                        <div className="text-sm font-medium text-gray-800">{expense.item}</div>
                        <div className="text-sm text-gray-700">{expense.whoPaid}</div>
                        <div className="text-sm font-semibold text-green-600">+${expense.amount.toFixed(2)}</div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <div className="bg-gray-600 text-white text-sm py-3 px-4 font-semibold">September 2025</div>
                    <div className="grid grid-cols-4 gap-2 bg-gray-200 p-3 text-sm font-semibold text-gray-700">
                      <div>Date</div>
                      <div>Item</div>
                      <div>Who Paid</div>
                      <div>Amt Owe/Lent</div>
                    </div>
                    {expenses.slice(3).map((expense, idx) => (
                      <div key={idx} className="grid grid-cols-4 gap-2 p-3 border-b hover:bg-gray-50 transition cursor-pointer">
                        <div className="text-sm text-gray-700">{expense.date}</div>
                        <div className="text-sm font-medium text-gray-800">{expense.item}</div>
                        <div className="text-sm text-gray-700">{expense.whoPaid}</div>
                        <div className="text-sm font-semibold text-red-600">-${expense.amount.toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BillSplitting() {
  return (
    <ProtectedRoute>
      <BillSplittingContent />
    </ProtectedRoute>
  );
}