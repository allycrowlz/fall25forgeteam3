'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Plus, Users, TrendingUp, DollarSign, Check, Trash2, Filter } from 'lucide-react'
import { getCurrentUser } from '../services/authService'
import { 
  getUserBalance, 
  getUserBalancesByPerson, 
  getUserSplits, 
  getExpenseStats,
  settleSplit,
  deleteExpense,
  type UserBalance,
  type PersonBalance,
  type ExpenseSplitDetail,
  type ExpenseStats
} from '../services/expenseService'
import { useGroup } from '../contexts/GroupContext'

const PAGE_BG = "#E8F3E9"
const BROWN = "#4C331D"
const GREEN = "#407947"
const BEIGE = "#DCCEBD"

type TabType = 'all' | 'owe-me' | 'i-owe'

export default function ExpensesDashboard() {
  const router = useRouter()
  const { currentGroup } = useGroup()
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('owe-me')
  
  // Data state
  const [balance, setBalance] = useState<UserBalance | null>(null)
  const [personBalances, setPersonBalances] = useState<PersonBalance[]>([])
  const [splits, setSplits] = useState<ExpenseSplitDetail[]>([])
  const [stats, setStats] = useState<ExpenseStats | null>(null)

  useEffect(() => {
    loadData()
  }, [currentGroup])

  async function loadData() {
    try {
      setLoading(true)
      const user = await getCurrentUser()
      if (!user.profile_id) {
        console.error('No profile_id found')
        return
      }
      const userId = parseInt(user.profile_id, 10)
      setCurrentUserId(userId)

      const groupId = currentGroup?.group_id

      // Load all data in parallel
      const [balanceData, balancesData, splitsData, statsData] = await Promise.all([
        getUserBalance(userId, groupId),
        getUserBalancesByPerson(userId, groupId),
        getUserSplits(userId, groupId, false), // Only unsettled
        getExpenseStats(userId, groupId)
      ])

      setBalance(balanceData)
      setPersonBalances(balancesData)
      setSplits(splitsData)
      setStats(statsData)
    } catch (error) {
      console.error('Failed to load expense data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSettle(splitId: number) {
    if (!confirm('Mark this expense as settled?')) return
    try {
      await settleSplit(splitId)
      await loadData()
    } catch (error) {
      alert('Failed to settle expense')
      console.error(error)
    }
  }

  async function handleDelete(itemId: number) {
    if (!confirm('Delete this expense? This will remove it for all users.')) return
    try {
      await deleteExpense(itemId)
      await loadData()
    } catch (error) {
      alert('Failed to delete expense')
      console.error(error)
    }
  }

  // Filter splits based on active tab
  const filteredSplits = splits.filter(split => {
    if (activeTab === 'owe-me') {
      return split.paid_by_id === currentUserId && split.profile_id !== currentUserId
    }
    return split.paid_by_id !== currentUserId && split.profile_id === currentUserId
  })

  // Format chart data
  const chartData = stats?.weekly_expenses.map((week, idx) => ({
    name: `Week ${idx + 1}`,
    amount: Math.round(week.total)
  })) || []

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: PAGE_BG }}>
        <div className="text-lg font-medium" style={{ color: BROWN }}>Loading expenses...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: PAGE_BG }}>
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2" style={{ color: GREEN }}>Expenses</h1>
            <p style={{ color: BROWN }}>Track and split your expenses</p>
          </div>
          <button
            onClick={() => router.push('/expenses/add-expense')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold hover:opacity-90 transition-all shadow-md"
            style={{ backgroundColor: GREEN, color: "white" }}
          >
            <Plus className="h-5 w-5" />
            Add Expense
          </button>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 border" style={{ borderColor: BROWN }}>
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5" style={{ color: GREEN }} />
              <h3 className="font-semibold" style={{ color: BROWN }}>Net Balance</h3>
            </div>
            <div 
              className="text-3xl font-bold"
              style={{ color: (balance?.net_balance || 0) >= 0 ? GREEN : '#c96b6b' }}
            >
              {(balance?.net_balance || 0) >= 0 ? '+' : '-'}
              ${Math.abs(balance?.net_balance || 0).toFixed(2)}
            </div>
            <p className="text-sm mt-1" style={{ color: BROWN, opacity: 0.7 }}>
              {(balance?.net_balance || 0) >= 0 ? 'You are owed' : 'You owe'}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border" style={{ borderColor: BROWN }}>
            <h3 className="font-semibold mb-2" style={{ color: BROWN }}>Owed to You</h3>
            <div className="text-3xl font-bold" style={{ color: GREEN }}>
              ${(balance?.total_owed_to_me || 0).toFixed(2)}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border" style={{ borderColor: BROWN }}>
            <h3 className="font-semibold mb-2" style={{ color: BROWN }}>You Owe</h3>
            <div className="text-3xl font-bold" style={{ color: '#c96b6b' }}>
              ${(balance?.total_i_owe || 0).toFixed(2)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Splits */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border" style={{ borderColor: BROWN }}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Users className="h-6 w-6" style={{ color: GREEN }} />
                <h2 className="text-2xl font-bold" style={{ color: BROWN }}>Recent Expenses</h2>
              </div>
            </div>

            <div className="flex gap-2 mb-6">
              {[
                { key: 'owe-me' as TabType, label: 'Owe Me' },
                { key: 'i-owe' as TabType, label: 'I Owe' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    backgroundColor: activeTab === tab.key ? GREEN : BEIGE,
                    color: activeTab === tab.key ? 'white' : BROWN,
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {filteredSplits.length > 0 ? (
                filteredSplits.map(split => {
                  const iOwe = split.paid_by_id !== currentUserId && split.profile_id === currentUserId
                  return (
                    <div key={split.split_id} className="p-4 rounded-xl border-2" style={{ borderColor: BROWN, backgroundColor: BEIGE }}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-bold text-base" style={{ color: BROWN }}>{split.item_name}</h4>
                          <p className="text-sm" style={{ color: BROWN }}>
                            {iOwe 
                              ? `You owe ${split.paid_by_name}` 
                              : `${split.profile_name} owes you`}
                          </p>
                          <p className="text-xs mt-1" style={{ color: BROWN, opacity: 0.7 }}>
                            {new Date(split.expense_date || split.date_created).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg mb-2" style={{ color: iOwe ? '#c96b6b' : GREEN }}>
                            ${split.amount_owed.toFixed(2)}
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleSettle(split.split_id)}
                              className="p-1.5 rounded-lg hover:opacity-80 transition-all"
                              style={{ backgroundColor: GREEN, color: 'white' }}
                              title="Settle"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            {split.paid_by_id === currentUserId && (
                              <button
                                onClick={() => handleDelete(split.item_id)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-16 rounded-xl" style={{ backgroundColor: BEIGE }}>
                  <p className="font-medium" style={{ color: BROWN }}>No expenses in this category</p>
                </div>
              )}
            </div>
          </div>

          {/* Weekly Chart */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border" style={{ borderColor: BROWN }}>
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="h-6 w-6" style={{ color: GREEN }} />
              <h2 className="text-2xl font-bold" style={{ color: BROWN }}>Weekly Spending</h2>
            </div>
            
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={BROWN} opacity={0.1} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: BROWN }} />
                  <YAxis tick={{ fontSize: 12, fill: BROWN }} />
                  <Tooltip 
                    formatter={(value) => `$${value}`}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: `2px solid ${BROWN}`,
                      borderRadius: '12px'
                    }}
                  />
                  <Bar dataKey="amount" fill={GREEN} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center rounded-xl" style={{ backgroundColor: BEIGE }}>
                <p className="font-medium" style={{ color: BROWN }}>No expense data yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Person Balances */}
        {personBalances.length > 0 && (
          <div className="mt-6 bg-white rounded-2xl shadow-lg p-6 border" style={{ borderColor: BROWN }}>
            <h2 className="text-2xl font-bold mb-4" style={{ color: BROWN }}>Balance by Person</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {personBalances.map(person => (
                <div key={person.profile_id} className="p-4 rounded-xl" style={{ backgroundColor: BEIGE }}>
                  <div className="flex items-center gap-3">
                    {person.profile_picture ? (
                      <img src={person.profile_picture} alt="" className="w-10 h-10 rounded-full" />
                    ) : (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: GREEN, color: 'white' }}>
                        {person.profile_name[0]}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-semibold" style={{ color: BROWN }}>{person.profile_name}</p>
                      <p className="font-bold" style={{ color: person.amount > 0 ? GREEN : '#c96b6b' }}>
                        {person.amount > 0 ? 'Owes you ' : 'You owe '}
                        ${Math.abs(person.amount).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}