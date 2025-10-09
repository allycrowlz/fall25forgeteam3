'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('All')
  const router = useRouter()

  const friends = [
    { name: 'Friend 1', amount: 45.50 },
    { name: 'Friend 2', amount: -23.00 },
    { name: 'Friend 3', amount: 67.25 }
  ]

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation Bar */}
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

      <div className="px-6 pb-12">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
            <button 
              onClick={() => router.push('/expenses/add-expense')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              <span className="text-xl">+</span>
              New Expense
            </button>
          </div>
         
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Total Balance</h2>
              <select className="border border-gray-300 rounded px-3 py-1 text-sm">
                <option>This Month</option>
                <option>Last Month</option>
                <option>This Year</option>
              </select>
            </div>
            
            <div className="text-4xl font-bold text-gray-900 mb-2">$89.75</div>
            <div className="flex items-center gap-2 text-green-600">
              <span className="text-lg">↗</span>
              <span className="text-sm">+12.5% from last month</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Friends & Balances</h2>
              <div className="flex gap-2 mb-4">
                {['All', 'Owes Me', 'I Owe'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2 rounded text-sm font-medium transition ${
                      activeTab === tab
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              {friends.map((friend, idx) => (
                <div key={idx} className="flex justify-between items-center py-3 border-b last:border-b-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-semibold">
                      {friend.name.charAt(0)}
                    </div>
                    <span className="text-gray-800 font-medium">{friend.name}</span>
                  </div>
                  <span className={`font-semibold ${friend.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {friend.amount >= 0 ? '+' : '-'}${Math.abs(friend.amount).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 text-center">Quick Actions</h2>
                <div className="space-y-2">
                  <button className="w-full bg-red-50 text-red-700 py-3 rounded-lg hover:bg-red-100 transition flex items-center justify-center gap-2 font-medium">
                    <span className="text-xl">↓</span>
                    Settle Up
                  </button>
                  <button className="w-full bg-green-50 text-green-700 py-3 rounded-lg hover:bg-green-100 transition flex items-center justify-center gap-2 font-medium">
                    <span className="text-xl">$</span>
                    Record Payment
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">Monthly Expenses</h2>
                  <select className="text-sm border border-gray-300 rounded px-2 py-1">
                    <option>October</option>
                    <option>September</option>
                    <option>August</option>
                  </select>
                </div>
                <div className="flex justify-around items-end h-40 gap-2">
                  {[
                    { height: 60, label: 'Week 1' },
                    { height: 80, label: 'Week 2' },
                    { height: 70, label: 'Week 3' },
                    { height: 90, label: 'Week 4' }
                  ].map((week, idx) => (
                    <div key={idx} className="flex-1 flex flex-col justify-end items-center">
                      <div className="text-xs text-gray-600 mb-1">${(week.height * 1.5).toFixed(0)}</div>
                      <div
                        className="w-full bg-blue-600 rounded-t hover:bg-blue-700 transition cursor-pointer"
                        style={{height: `${week.height}%`}}
                      ></div>
                      <div className="text-xs text-gray-600 mt-2">{week.label}</div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-center gap-2 mt-4">
                  <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                  <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                  <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}