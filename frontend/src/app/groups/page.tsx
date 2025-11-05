"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from 'react';

export default function Home() {
  const [selectedDate, setSelectedDate] = useState(8);
  
  // Generate calendar days for October 2020
  const getDaysInMonth = () => {
    const days = [];
    const firstDay = 4; // October 1, 2020 is Thursday (0 = Monday)
    
    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let i = 1; i <= 31; i++) {
      days.push(i);
    }
    
    return days;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div>
            <h1 className="text-5xl font-bold mb-8" style={{ color: '#407947' }}>
              Welcome, [Name]!
            </h1>

            {/* Calendar Section */}
            <div className="rounded-3xl p-8 shadow-xl" style={{ backgroundColor: '#DCCEBD' }}>
              <h2 className="text-xl font-semibold mb-6" style={{ color: '#4C331D' }}>October 2020</h2>
              <div className="grid grid-cols-7 gap-2">
                {/* Day headers */}
                {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((day) => (
                  <div key={day} className="text-center font-medium text-sm py-2" style={{ color: '#4C331D' }}>
                    {day}
                  </div>
                ))}
                
                {/* Calendar days */}
                {getDaysInMonth().map((day, index) => (
                  <div
                    key={index}
                    className={`text-center py-3 text-sm ${
                      day === null
                        ? ''
                        : day === selectedDate
                        ? 'text-white rounded-full font-semibold'
                        : 'rounded-full cursor-pointer'
                    }`}
                    style={
                      day === selectedDate
                        ? { backgroundColor: '#4C331D' }
                        : day !== null
                        ? { color: '#4C331D' }
                        : {}
                    }
                  >
                    {day}
                  </div>
                ))}
              </div>
              <button className="mt-6 flex items-center gap-2 text-sm font-medium hover:opacity-80 ml-auto group" style={{ color: '#4C331D' }}>
                View Calendar
                <span className="text-lg group-hover:translate-x-1 transition-transform">→</span>
              </button>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Upcoming Tasks Section */}
            <div className="rounded-3xl p-6 shadow-xl" style={{ backgroundColor: '#CFDFD1' }}>
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#4C331D' }}>Upcoming Tasks ✨</h2>
              <div className="grid grid-cols-3 gap-4 mb-3">
                {[
                  { name: 'Take out trash', date: 'Oct 8', group: 'Group 1', emoji: '🗑️' },
                  { name: 'Clean kitchen', date: 'Oct 9', group: 'Group 1', emoji: '🧽' },
                  { name: 'Vacuum living room', date: 'Oct 10', group: 'Group 2', emoji: '🧹' }
                ].map((task) => (
                  <div
                    key={task.name}
                    className="bg-white rounded-2xl h-40 flex flex-col items-center justify-center px-4 border-2 border-gray-300 hover:shadow-lg transition-all hover:scale-105 cursor-pointer"
                  >
                    <div className="text-3xl mb-2">{task.emoji}</div>
                    <span className="font-bold text-center mb-1 text-sm" style={{ color: '#4C331D' }}>{task.name}</span>
                    <span className="text-xs text-gray-600 text-center font-medium">{task.date}</span>
                    <span className="text-xs text-center font-semibold mt-1" style={{ color: '#407947' }}>{task.group}</span>
                  </div>
                ))}
              </div>
              <button className="flex items-center gap-2 text-base font-semibold hover:opacity-80 ml-auto group" style={{ color: '#4C331D' }}>
                See All Tasks
                <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
              </button>
            </div>

            {/* Your Expenses Section */}
            <div className="rounded-3xl p-6 shadow-xl" style={{ backgroundColor: '#CFDFD1' }}>
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#4C331D' }}>Your Expenses 💰</h2>
              <div className="grid grid-cols-3 gap-4 mb-3">
                {[
                  { name: 'Electric Bill', amount: '$87.50', group: 'Group 1', emoji: '⚡' },
                  { name: 'Groceries', amount: '$142.30', group: 'Group 1', emoji: '🛒' },
                  { name: 'Internet', amount: '$65.00', group: 'Group 2', emoji: '📡' }
                ].map((expense) => (
                  <div
                    key={expense.name}
                    className="bg-white rounded-2xl h-40 flex flex-col items-center justify-center px-4 border-2 border-gray-300 hover:shadow-lg transition-all hover:scale-105 cursor-pointer"
                  >
                    <div className="text-3xl mb-2">{expense.emoji}</div>
                    <span className="font-bold text-center mb-1 text-sm" style={{ color: '#4C331D' }}>{expense.name}</span>
                    <span className="text-lg font-bold text-center" style={{ color: '#407947' }}>{expense.amount}</span>
                    <span className="text-xs text-center font-semibold mt-1" style={{ color: '#407947' }}>{expense.group}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-end">
                <Link href="/expenses" className="flex items-center gap-2 text-base font-semibold hover:opacity-80 group" style={{ color: '#4C331D' }}>
                  See All Expenses
                  <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
                </Link>
              </div>
            </div>

            {/* Your Lists Section */}
            <div className="rounded-3xl p-8 shadow-xl" style={{ backgroundColor: '#CFDFD1' }}>
              <h2 className="text-3xl font-bold mb-6" style={{ color: '#4C331D' }}>Your Lists 📝</h2>
              <div className="grid grid-cols-3 gap-4 mb-4">
                {[
                  { name: 'Groceries', group: 'Group 1', emoji: '🛒' },
                  { name: 'Cleaning Supplies', group: 'Group 1', emoji: '🧴' },
                  { name: 'House Repairs', group: 'Group 2', emoji: '🔧' }
                ].map((list) => (
                  <div
                    key={list.name}
                    className="bg-white rounded-2xl h-40 flex flex-col items-center justify-center px-4 border-2 border-gray-300 hover:shadow-lg transition-all hover:scale-105 cursor-pointer"
                  >
                    <div className="text-3xl mb-2">{list.emoji}</div>
                    <span className="font-bold text-center mb-1 text-sm" style={{ color: '#4C331D' }}>{list.name}</span>
                    <span className="text-xs text-center font-semibold" style={{ color: '#407947' }}>{list.group}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-end">
                <Link href="/shoppinglist" className="flex items-center gap-2 text-base font-semibold hover:opacity-80 group" style={{ color: '#4C331D' }}>
                  See All Lists
                  <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}