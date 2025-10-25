'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '../navbar'
import { getGroupMembers, getUserGroups } from '@/app/services/database';
import { Group } from 'next/dist/shared/lib/router/utils/route-regex';

type GroupInfo = {
  group_id: number;
  group_name: string;
  date_created: string;
  group_photo: string | null;
  role: string;
  is_creator: boolean;
}

type UserInfo = {
  profile_id: number;
  profile_name: string;
  email: string;
  picture: string | null;
  birthday: Date | null;
}

export default function AddExpense() {
  const router = useRouter();

  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [customSplit, setCustomSplit] = useState<boolean>(false);
  const [groups, setGroups] = useState<GroupInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedGroup, setSelectedGroup] = useState<number>();
  const [payer, setPayer] = useState('');
  const [groupMembers, setGroupMembers] = useState<UserInfo[]>([]);
  
  useEffect(() => {
    async function loadGroups() {
      setLoading(true);
      try {
        const data = await getUserGroups(1);
        setGroups(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadGroups();
  }, [])

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="px-6 pb-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Add New Expense</h1>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Group *
                  </label>
                    <select disabled = {loading} onChange={async (e) => {
                    
                    const newGroupId = parseInt(e.target.value);
                    setSelectedGroup(newGroupId);
                    
                    const members = await getGroupMembers(newGroupId);
                    setGroupMembers(members);
                    }
                  }
                    className="w-full border-2 border-gray-300 rounded-lg p-2 bg-white focus:border-blue-500 focus:outline-none">
                      {loading? (
                        <option>Loading groups...</option>
                      ) : 
                      (
                        groups.map(group => (
                          <option key={group.group_id} value={group.group_id}>
                            {group.group_name} 
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Amount *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-700 text-lg">$</span>
                    <input
                      type="number"
                      step="1.00"
                      className="w-full border-2 border-gray-300 rounded-lg p-2 pl-8 text-gray-700 focus:border-blue-500 focus:outline-none"
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
                    className="w-full border-2 border-gray-300 text-gray-700 rounded-lg p-2 focus:border-blue-500 focus:outline-none"
                    placeholder="What was this expense for?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    className="w-full border-2 border-gray-300 text-gray-700 rounded-lg p-2 focus:border-blue-500 focus:outline-none"
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
                    className="w-full border-2 border-gray-300 text-gray-700 rounded-lg p-2 h-24 focus:border-blue-500 focus:outline-none resize-none"
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
                    <select onChange={(e) => setPayer(e.target.value)}
                    className="w-full border-2 border-gray-300 text-gray-700 rounded-lg p-2 bg-white focus:border-blue-500 focus:outline-none">
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
                        {groupMembers.map((member) => (
                          <option value = {member.profile_id} key = {member.profile_id}>{member.profile_name}</option>
                      ))}
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
                      {groupMembers.map((member) => (
                        <div key={member.profile_id} className="flex items-center gap-3">
                          <span className="text-sm text-gray-700 w-20">{member.profile_name}</span>
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