'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus } from 'lucide-react'
import { getCurrentUser } from '../../services/authService'
import { 
  createExpense, 
  getGroupExpenseLists, 
  createExpenseList,
  type ExpenseList,
  type ExpenseItemCreate 
} from '../../services/expenseService'
import { getGroupMembers } from '../../services/groupService'
import { useGroup } from '../../contexts/GroupContext'

const PAGE_BG = "#E8F3E9"
const BROWN = "#4C331D"
const GREEN = "#407947"
const BEIGE = "#DCCEBD"

interface Member {
  profile_id: number
  profile_name: string
  email: string
  picture: string | null
}

interface SplitAmount {
  profile_id: number
  profile_name: string
  amount: number
}

export default function AddExpense() {
  const router = useRouter()
  const { currentGroup } = useGroup()
  const [loading, setLoading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  
  // Form state
  const [expenseName, setExpenseName] = useState('')
  const [cost, setCost] = useState('')
  const [notes, setNotes] = useState('')
  const [paidBy, setPaidBy] = useState<number | null>(null)
  const [selectedList, setSelectedList] = useState<number | null>(null)
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurringFrequency, setRecurringFrequency] = useState<'weekly' | 'monthly' | 'yearly'>('weekly')
  const [recurringEndDate, setRecurringEndDate] = useState('')
  
  // Split state
  const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal')
  const [selectedMembers, setSelectedMembers] = useState<Set<number>>(new Set())
  const [customSplits, setCustomSplits] = useState<Map<number, number>>(new Map())
  
  // Data
  const [expenseLists, setExpenseLists] = useState<ExpenseList[]>([])
  const [groupMembers, setGroupMembers] = useState<Member[]>([])
  const [newListName, setNewListName] = useState('')
  const [showNewList, setShowNewList] = useState(false)

  useEffect(() => {
    loadData()
  }, [currentGroup])

  async function loadData() {
    if (!currentGroup) return
    
    try {
      const user = await getCurrentUser()
      if (!user.profile_id) {
        console.error('No profile_id found')
        return
      }
      const userId = parseInt(user.profile_id, 10)
      setCurrentUserId(userId)
      setPaidBy(userId)

      const [lists, members] = await Promise.all([
        getGroupExpenseLists(currentGroup.group_id),
        getGroupMembers(currentGroup.group_id)
      ])

      setExpenseLists(lists)
      setGroupMembers(members)

      // Pre-select all members
      setSelectedMembers(new Set(members.map(m => m.profile_id)))
    } catch (error) {
      console.error('Failed to load data:', error)
    }
  }

  async function handleCreateList() {
    if (!currentGroup || !newListName.trim()) return
    
    try {
      const newList = await createExpenseList(currentGroup.group_id, newListName)
      setExpenseLists([newList, ...expenseLists])
      setSelectedList(newList.list_id)
      setNewListName('')
      setShowNewList(false)
    } catch (error) {
      alert('Failed to create expense list')
      console.error(error)
    }
  }

  function toggleMember(profileId: number) {
    const newSelected = new Set(selectedMembers)
    if (newSelected.has(profileId)) {
      newSelected.delete(profileId)
      customSplits.delete(profileId)
    } else {
      newSelected.add(profileId)
    }
    setSelectedMembers(newSelected)
  }

  function updateCustomSplit(profileId: number, amount: string) {
    const value = parseFloat(amount) || 0
    const newSplits = new Map(customSplits)
    newSplits.set(profileId, value)
    setCustomSplits(newSplits)
  }

  function calculateSplits(): SplitAmount[] {
    const totalCost = parseFloat(cost) || 0
    const selected = Array.from(selectedMembers)
    
    if (splitType === 'equal') {
      const amountPerPerson = selected.length > 0 ? totalCost / selected.length : 0
      return selected.map(id => ({
        profile_id: id,
        profile_name: groupMembers.find(m => m.profile_id === id)?.profile_name || '',
        amount: amountPerPerson
      }))
    } else {
      return selected.map(id => ({
        profile_id: id,
        profile_name: groupMembers.find(m => m.profile_id === id)?.profile_name || '',
        amount: customSplits.get(id) || 0
      }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!currentUserId || !paidBy || !selectedList) {
      alert('Please fill in all required fields')
      return
    }

    const totalCost = parseFloat(cost) || 0
    const splits = calculateSplits()
    const totalSplit = splits.reduce((sum, s) => sum + s.amount, 0)

    if (Math.abs(totalSplit - totalCost) > 0.01) {
      alert(`Split amounts ($${totalSplit.toFixed(2)}) don't match total cost ($${totalCost.toFixed(2)})`)
      return
    }

    try {
      setLoading(true)
      
      const expense: ExpenseItemCreate = {
        item_name: expenseName,
        list_id: selectedList,
        item_total_cost: totalCost,
        notes: notes || undefined,
        paid_by_id: paidBy,
        is_recurring: isRecurring,
        recurring_frequency: isRecurring ? recurringFrequency : undefined,
        recurring_end_date: isRecurring && recurringEndDate ? recurringEndDate : undefined,
        splits: splits.map(s => ({
          profile_id: s.profile_id,
          amount_owed: s.amount
        }))
      }

      await createExpense(expense)
      router.push('/expenses')
    } catch (error) {
      alert('Failed to create expense')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const splits = calculateSplits()
  const totalSplit = splits.reduce((sum, s) => sum + s.amount, 0)
  const totalCost = parseFloat(cost) || 0

  return (
    <div className="min-h-screen" style={{ backgroundColor: PAGE_BG }}>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 mb-6 hover:opacity-70 transition-opacity"
          style={{ color: BROWN }}
        >
          <ArrowLeft className="h-5 w-5" />
          Back
        </button>

        <h1 className="text-4xl font-bold mb-8" style={{ color: GREEN }}>Add Expense</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 border" style={{ borderColor: BROWN }}>
          {/* Basic Info */}
          <div className="space-y-6 mb-8">
            <div>
              <label className="block font-semibold mb-2" style={{ color: BROWN }}>Expense Name *</label>
              <input
                type="text"
                value={expenseName}
                onChange={(e) => setExpenseName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:border-green-500"
                style={{ borderColor: BROWN, backgroundColor: 'white', color: BROWN }}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block font-semibold mb-2" style={{ color: BROWN }}>Total Cost *</label>
                <input
                  type="number"
                  step="0.01"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:border-green-500"
                  style={{ borderColor: BROWN, backgroundColor: 'white', color: BROWN }}
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-2" style={{ color: BROWN }}>Paid By *</label>
                <select
                  value={paidBy || ''}
                  onChange={(e) => setPaidBy(parseInt(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:border-green-500"
                  style={{ borderColor: BROWN, backgroundColor: 'white', color: BROWN }}
                  required
                >
                  <option value="">Select...</option>
                  {groupMembers.map(member => (
                    <option key={member.profile_id} value={member.profile_id}>
                      {member.profile_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-2" style={{ color: BROWN }}>Expense List *</label>
              {!showNewList ? (
                <div className="flex gap-2">
                  <select
                    value={selectedList || ''}
                    onChange={(e) => setSelectedList(parseInt(e.target.value))}
                    className="flex-1 px-4 py-3 rounded-xl border-2 focus:outline-none focus:border-green-500"
                    style={{ borderColor: BROWN, backgroundColor: 'white', color: BROWN }}
                    required
                  >
                    <option value="">Select list...</option>
                    {expenseLists.map(list => (
                      <option key={list.list_id} value={list.list_id}>
                        {list.list_name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowNewList(true)}
                    className="px-4 py-3 rounded-xl font-semibold"
                    style={{ backgroundColor: GREEN, color: 'white' }}
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="New list name"
                    className="flex-1 px-4 py-3 rounded-xl border-2 focus:outline-none focus:border-green-500"
                    style={{ borderColor: BROWN, backgroundColor: 'white', color: BROWN }}
                  />
                  <button
                    type="button"
                    onClick={handleCreateList}
                    className="px-4 py-3 rounded-xl font-semibold"
                    style={{ backgroundColor: GREEN, color: 'white' }}
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewList(false)}
                    className="px-4 py-3 rounded-xl font-semibold"
                    style={{ backgroundColor: BEIGE, color: BROWN }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block font-semibold mb-2" style={{ color: BROWN }}>Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:border-green-500"
                style={{ borderColor: BROWN, backgroundColor: 'white', color: BROWN }}
                rows={3}
              />
            </div>

            {/* Recurring */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="w-5 h-5"
                />
                <span className="font-semibold" style={{ color: BROWN }}>Recurring Expense</span>
              </label>
              
              {isRecurring && (
                <div className="mt-4 grid grid-cols-2 gap-4 p-4 rounded-xl" style={{ backgroundColor: BEIGE }}>
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: BROWN }}>Frequency</label>
                    <select
                      value={recurringFrequency}
                      onChange={(e) => setRecurringFrequency(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-lg border-2"
                      style={{ borderColor: BROWN, backgroundColor: 'white', color: BROWN }}
                    >
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: BROWN }}>End Date (optional)</label>
                    <input
                      type="date"
                      value={recurringEndDate}
                      onChange={(e) => setRecurringEndDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border-2"
                      style={{ borderColor: BROWN, backgroundColor: 'white', color: BROWN }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Split Section */}
          <div className="border-t-2 pt-8" style={{ borderColor: BROWN }}>
            <h2 className="text-2xl font-bold mb-4" style={{ color: BROWN }}>Split With</h2>
            
            <div className="flex gap-2 mb-6">
              <button
                type="button"
                onClick={() => setSplitType('equal')}
                className="flex-1 py-2.5 rounded-xl font-semibold"
                style={{
                  backgroundColor: splitType === 'equal' ? GREEN : BEIGE,
                  color: splitType === 'equal' ? 'white' : BROWN
                }}
              >
                Equal Split
              </button>
              <button
                type="button"
                onClick={() => setSplitType('custom')}
                className="flex-1 py-2.5 rounded-xl font-semibold"
                style={{
                  backgroundColor: splitType === 'custom' ? GREEN : BEIGE,
                  color: splitType === 'custom' ? 'white' : BROWN
                }}
              >
                Custom Amounts
              </button>
            </div>

            <div className="space-y-3 mb-6">
              {groupMembers.map(member => (
                <div key={member.profile_id} className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: BEIGE }}>
                  <input
                    type="checkbox"
                    checked={selectedMembers.has(member.profile_id)}
                    onChange={() => toggleMember(member.profile_id)}
                    className="w-5 h-5"
                  />
                  <div className="flex-1">
                    <p className="font-semibold" style={{ color: BROWN }}>{member.profile_name}</p>
                  </div>
                  {splitType === 'custom' && selectedMembers.has(member.profile_id) && (
                    <input
                      type="number"
                      step="0.01"
                      value={customSplits.get(member.profile_id) || ''}
                      onChange={(e) => updateCustomSplit(member.profile_id, e.target.value)}
                      placeholder="0.00"
                      className="w-24 px-3 py-2 rounded-lg border-2"
                      style={{ borderColor: BROWN, backgroundColor: 'white', color: BROWN }}
                    />
                  )}
                  {splitType === 'equal' && selectedMembers.has(member.profile_id) && (
                    <span className="font-bold" style={{ color: GREEN }}>
                      ${(totalCost / selectedMembers.size).toFixed(2)}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Split Summary */}
            <div className="p-4 rounded-xl mb-6" style={{ backgroundColor: BEIGE }}>
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold" style={{ color: BROWN }}>Total Cost:</span>
                <span className="font-bold text-lg" style={{ color: BROWN }}>${totalCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold" style={{ color: BROWN }}>Total Split:</span>
                <span 
                  className="font-bold text-lg"
                  style={{ color: Math.abs(totalSplit - totalCost) < 0.01 ? GREEN : '#c96b6b' }}
                >
                  ${totalSplit.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || Math.abs(totalSplit - totalCost) > 0.01}
            className="w-full py-4 rounded-xl font-bold text-lg transition-opacity disabled:opacity-50"
            style={{ backgroundColor: GREEN, color: 'white' }}
          >
            {loading ? 'Creating...' : 'Create Expense'}
          </button>
        </form>
      </div>
    </div>
  )
}