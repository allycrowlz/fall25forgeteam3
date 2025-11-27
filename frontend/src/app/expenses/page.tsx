'use client'

import Navbar from './navbar'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

// Mock data - replace with actual API calls
const mockWeeklyExpenses = [
  { week: 'Week 1', amount: 90 },
  { week: 'Week 2', amount: 120 },
  { week: 'Week 3', amount: 105 },
  { week: 'Week 4', amount: 135 }
]

const mockFriends = [
  { name: 'Friend 1', amount: 45.50 },
  { name: 'Friend 2', amount: -23.00 },
  { name: 'Friend 3', amount: 67.25 }
]

export default function ExpensesDashboard() {
  const [activeTab, setActiveTab] = useState('All')
  const [totalBalance, setTotalBalance] = useState(0)
  const [weeklyExpenses, setWeeklyExpenses] = useState(mockWeeklyExpenses)
  const [friends, setFriends] = useState(mockFriends)
  const [selectedMonth, setSelectedMonth] = useState('October')
  const router = useRouter()

  useEffect(() => {
    // Calculate total balance from friends array
    const balance = friends.reduce((sum, friend) => sum + friend.amount, 0)
    setTotalBalance(balance)
  }, [friends])

  const filteredFriends = friends.filter(friend => {
    if (activeTab === 'Owes Me') return friend.amount > 0
    if (activeTab === 'I Owe') return friend.amount < 0
    return true
  })

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#E8F3E9' }}>
      <Navbar />

      <div className="px-6 pb-12">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold" style={{ color: '#4C331D' }}>Dashboard</h1>
          </div>
         
          {/* Total Balance Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold" style={{ color: '#4C331D' }}>Total Balance</h2>
              <span className="text-sm" style={{ color: '#4C331D' }}>This Month</span>
            </div>
            
            <div className={`text-4xl font-bold mb-2`} style={{ color: totalBalance >= 0 ? '#407947' : '#c96b6b' }}>
              {totalBalance >= 0 ? '+' : '-'}${Math.abs(totalBalance).toFixed(2)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Friends & Balances */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4" style={{ color: '#4C331D' }}>Friends & Balances</h2>
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
                    style={activeTab === tab ? { backgroundColor: '#407947' } : {}}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              {filteredFriends.length > 0 ? (
                filteredFriends.map((friend, idx) => (
                  <div key={idx} className="flex justify-between items-center py-3 border-b last:border-b-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold" style={{ backgroundColor: '#4C331D' }}>
                        {friend.name.charAt(0)}
                      </div>
                      <span className="font-medium" style={{ color: '#4C331D' }}>{friend.name}</span>
                    </div>
                    <span className="font-semibold" style={{ color: friend.amount >= 0 ? '#407947' : '#c96b6b' }}>
                      {friend.amount >= 0 ? '+' : '-'}${Math.abs(friend.amount).toFixed(2)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500"style={{ color: '#4C331D' }}>
                  No friends in this category
                </div>
              )}
            </div>

            {/* Monthly Expenses Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold" style={{ color: '#4C331D' }}>Monthly Expenses</h2>
              </div>
              
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={weeklyExpenses}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="week" 
                    tick={{ fontSize: 12, fill: '#4C331D' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#4C331D' }}
                    label={{ value: '$', angle: 0, position: 'insideLeft', fill: '#4C331D' }}
                  />
                  <Tooltip 
                    formatter={(value) => `$${value}`}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #ccc',
                      borderRadius: '4px'
                    }}
                  />
                  <Bar dataKey="amount" fill="#407947" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}