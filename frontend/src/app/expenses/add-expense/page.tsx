'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AddExpense() {
  const [isRecurring, setIsRecurring] = useState(false)
  const [customSplit, setCustomSplit] = useState(false)
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-md mb-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between items-center py-4">
            <div className="text-2xl font-bold text-gray-800">💰 ExpenseTracker</div>
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/expenses')}
                className="px-6 py-2 rounded-lg font-medium transition bg-gray-100 text-gray-700 hover:bg-gray-200"
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
                className="px-6 py-2 rounded-lg font-medium transition bg-blue-600 text-white"
              >
                Add Expense
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="px-6 pb-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Add New Expense</h1>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Amount *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-500 text-lg">$</span>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full border-2 border-gray-300 rounded-lg p-2 pl-8 focus:border-blue-500 focus:outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description *
                  </label>
                  <input
                    type="text"
                    className="w-full border-2 border-gray-300 rounded-lg p-2 focus:border-blue-500 focus:outline-none"
                    placeholder="What was this expense for?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    className="w-full border-2 border-gray-300 rounded-lg p-2 focus:border-blue-500 focus:outline-none"
                    defaultValue={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className="text-gray-700 font-medium">Recurring Expense?</span>
                  <button
                    type="button"
                    onClick={() => setIsRecurring(!isRecurring)}
                    className={`w-14 h-7 rounded-full transition relative ${
                      isRecurring ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition transform absolute top-1 ${
                      isRecurring ? 'translate-x-7' : 'translate-x-1'
                    }`}></div>
                  </button>
                </div>

                {isRecurring && (
                  <div className="pl-4 border-l-4 border-blue-500">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Frequency
                    </label>
                    <select className="w-full border-2 border-gray-300 rounded-lg p-2 bg-white focus:border-blue-500 focus:outline-none">
                      <option>Daily</option>
                      <option>Weekly</option>
                      <option>Monthly</option>
                      <option>Yearly</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    className="w-full border-2 border-gray-300 rounded-lg p-2 h-24 focus:border-blue-500 focus:outline-none resize-none"
                    placeholder="Add any additional details..."
                  />
                </div>
              </div>

              <div className="space-y-4 border-t pt-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-400 transition cursor-pointer">
                  <div className="text-center">
                    <div className="text-5xl mb-3">📤</div>
                    <div className="text-gray-700 font-medium mb-1">Upload Receipt</div>
                    <div className="text-sm text-gray-500">Click or drag file to upload</div>
                  </div>
                </div>

                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Who Paid? *
                    </label>
                    <select className="w-full border-2 border-gray-300 rounded-lg p-2 bg-white focus:border-blue-500 focus:outline-none">
                      <option value="">Select person...</option>
                      <option>John</option>
                      <option>Sarah</option>
                      <option>Mike</option>
                      <option>Me</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Split With
                    </label>
                    <select 
                      multiple 
                      className="w-full border-2 border-gray-300 rounded-lg p-2 bg-white focus:border-blue-500 focus:outline-none h-24"
                    >
                      <option>John</option>
                      <option>Sarah</option>
                      <option>Mike</option>
                      <option>Friend 1</option>
                      <option>Friend 2</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <span className="text-gray-700 font-medium">Custom Split?</span>
                    <button
                      type="button"
                      onClick={() => setCustomSplit(!customSplit)}
                      className={`w-14 h-7 rounded-full transition relative ${
                        customSplit ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition transform absolute top-1 ${
                        customSplit ? 'translate-x-7' : 'translate-x-1'
                      }`}></div>
                    </button>
                  </div>

                  {customSplit && (
                    <div className="space-y-2 pl-4 border-l-4 border-blue-500">
                      <div className="text-sm font-semibold text-gray-700 mb-2">Split Amounts:</div>
                      {['John', 'Sarah'].map((person) => (
                        <div key={person} className="flex items-center gap-3">
                          <span className="text-sm text-gray-700 w-20">{person}</span>
                          <input
                            type="number"
                            step="0.01"
                            className="flex-1 border border-gray-300 rounded p-2 text-sm"
                            placeholder="0.00"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Category
                    </label>
                    <select className="w-full border-2 border-gray-300 rounded-lg p-2 bg-white focus:border-blue-500 focus:outline-none">
                      <option value="">Select category...</option>
                      <option>🛒 Groceries</option>
                      <option>🏠 Utilities</option>
                      <option>🍿 Entertainment</option>
                      <option>🚗 Transportation</option>
                      <option>🍔 Food & Dining</option>
                      <option>💊 Healthcare</option>
                      <option>📱 Subscriptions</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => router.push('/expenses')}
                  className="flex-1 bg-gray-200 text-gray-700 font-semibold py-4 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-4 rounded-lg hover:from-green-600 hover:to-green-700 transition shadow-lg flex items-center justify-center gap-2"
                >
                  <span className="text-xl">+</span>
                  Add Expense
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}