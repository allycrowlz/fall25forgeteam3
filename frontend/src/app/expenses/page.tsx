'use client'
import ProtectedRoute from '../components/ProtectedRoute'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CompleteSplit, getGroupSplits, getUserBalance, getUserSplits } from '../services/expenseService';

function ExpensesContent() {
  const [balance, setBalance] = useState<String>("0.00");
  const [groupSplits, setGroupSplits] = useState<CompleteSplit[]>([]);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [paid, setPaid] = useState<number[]>([]);
  const router = useRouter();

  const expenseSections = ['All', 'Owes Me', 'I Owe'];

  const friends = [
    { name: 'Friend 1', amount: 45.50 },
    { name: 'Friend 2', amount: -23.00 },
    { name: 'Friend 3', amount: 67.25 }
  ]

  useEffect(() =>
  {
    async function loadData(profile_id : number) {
      try {
        const data = await getUserBalance(profile_id);
        setBalance(data);

        const splits = await getUserSplits(profile_id);
        setGroupSplits(splits);
      } catch {
        setBalance("0.00");
      }
      
    }
    loadData(183);
  }, [])

  return (
    <div className="min-h-screen bg-gray-100">

      <div className="px-6 pb-12 pt-6">
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
            </div>
            
            <div className="text-4xl font-bold text-gray-900 mb-2">${balance}</div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Friends & Balances</h2>
              <div className="flex gap-2 mb-4">
                {expenseSections.map((tab, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveTab(i)}
                    className={`flex-1 py-2 rounded text-sm font-medium transition ${
                      activeTab === i
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className='h-88 overflow-auto'>
              {groupSplits.filter((split) => {
                if (activeTab == 1) {
                  return split.profile_id != 183;
                } else if (activeTab == 2) {
                  return split.profile_id == 183;
                } else {
                  return true;
                }
              }).map((split, idx) => (
                <div key={idx} className="flex justify-between items-center py-3 border-b last:border-b-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-semibold">
                      {split.profile_id == 183? split.buyer.charAt(0) : split.profile_name.charAt(0)}
                    </div>
                    <span className="text-gray-800 font-medium">{split.profile_id == 183? split.buyer : split.profile_name}</span>
                  </div>
                  <span className={`font-semibold ${split.profile_id == 183 ? 'text-red-600' : 'text-green-600'}`}>
                    {split.profile_id == 183 ? '-' : '+'}${Math.abs(split.amount_owed).toFixed(2)}
                  </span>
                </div>
              ))}
              </div>
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

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <ExpensesContent />
    </ProtectedRoute>
  );
}