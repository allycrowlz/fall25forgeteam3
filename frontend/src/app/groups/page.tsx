"use client";

import Link from "next/link";
import { useState, useEffect } from 'react';
import ProtectedRoute from '../components/ProtectedRoute';
import { getCurrentUser, authenticatedFetch, type User } from '../services/authService';

interface Task {
  id: number;
  name: string;
  due_date: string;
  group_name: string;
  emoji?: string;
}

interface Expense {
  id: number;
  description: string;
  amount: number;
  group_name: string;
  emoji?: string;
}

interface List {
  id: number;
  name: string;
  group_name: string;
  emoji?: string;
}

function GroupsContent() {
  const [selectedDate] = useState(new Date().getDate()); // Removed setSelectedDate
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [lists, setLists] = useState<List[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch user data
        const userData = await getCurrentUser();
        setUser(userData);
        setLoading(false); // Set loading false after user is loaded

        // Fetch chores/tasks for user's profile (don't block on this)
        authenticatedFetch(`/api/profiles/${userData.profile_id}/chores`)
          .then(async (choresResponse) => {
            if (choresResponse.ok) {
              const choresData = await choresResponse.json();
              const formattedTasks = choresData.slice(0, 3).map((chore: any) => ({
                id: chore.chore_id,
                name: chore.name,
                due_date: chore.due_date,
                group_name: chore.group_name || 'My Group',
                emoji: '✓'
              }));
              setTasks(formattedTasks);
            }
          })
          .catch((err) => {
            console.log('Failed to fetch chores:', err);
            setTasks([]);
          });

        // Fetch expenses (don't block on this)
        authenticatedFetch('/api/expenses/recent?limit=3')
          .then(async (expensesResponse) => {
            if (expensesResponse.ok) {
              const expensesData = await expensesResponse.json();
              setExpenses(expensesData);
            }
          })
          .catch((err) => {
            console.log('Failed to fetch expenses:', err);
            setExpenses([]);
          });

        // Fetch shopping lists (don't block on this)
        authenticatedFetch('/api/lists/recent?limit=3')
          .then(async (listsResponse) => {
            if (listsResponse.ok) {
              const listsData = await listsResponse.json();
              setLists(listsData);
            }
          })
          .catch((err) => {
            console.log('Failed to fetch lists:', err);
            setLists([]);
          });
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);
  
  // Generate calendar days for current month
  const getDaysInMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    
    // Adjust for Monday start (0 = Monday, 6 = Sunday)
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
    
    // Add empty cells for days before month starts
    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  };

  const getCurrentMonthYear = () => {
    const now = new Date();
    return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div style={{ color: '#4C331D' }}>Loading your dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div>
            <h1 className="text-5xl font-bold mb-8" style={{ color: '#407947' }}>
              Welcome, {user?.profile_name || 'there'}!
            </h1>

            {/* Calendar Section */}
            <div className="rounded-3xl p-8 shadow-xl" style={{ backgroundColor: '#DCCEBD' }}>
              <h2 className="text-xl font-semibold mb-6" style={{ color: '#4C331D' }}>
                {getCurrentMonthYear()}
              </h2>
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
                        : 'rounded-full'
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
              <Link href="/calendar" className="mt-6 flex items-center gap-2 text-sm font-medium hover:opacity-80 ml-auto group" style={{ color: '#4C331D' }}>
                View Calendar
                <span className="text-lg group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Upcoming Tasks Section */}
            <div className="rounded-3xl p-6 shadow-xl" style={{ backgroundColor: '#CFDFD1' }}>
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#4C331D' }}>Upcoming Tasks ✨</h2>
              <div className="grid grid-cols-3 gap-4 mb-3">
                {tasks.length > 0 ? (
                  tasks.map((task) => (
                    <Link
                      key={task.id}
                      href="/tasks"
                      className="bg-white rounded-2xl h-40 flex flex-col items-center justify-center px-4 border-2 border-gray-300 hover:shadow-lg transition-all hover:scale-105 cursor-pointer"
                    >
                      <div className="text-3xl mb-2">{task.emoji || '✓'}</div>
                      <span className="font-bold text-center mb-1 text-sm" style={{ color: '#4C331D' }}>
                        {task.name}
                      </span>
                      <span className="text-xs text-gray-600 text-center font-medium">
                        {formatDate(task.due_date)}
                      </span>
                      <span className="text-xs text-center font-semibold mt-1" style={{ color: '#407947' }}>
                        {task.group_name}
                      </span>
                    </Link>
                  ))
                ) : (
                  <div className="col-span-3 text-center py-8" style={{ color: '#4C331D' }}>
                    No upcoming tasks
                  </div>
                )}
              </div>
              <div className="flex justify-end">
                <Link href="/tasks" className="flex items-center gap-2 text-base font-semibold hover:opacity-80 group" style={{ color: '#4C331D' }}>
                  See All Tasks
                  <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
                </Link>
              </div>
            </div>

            {/* Your Expenses Section */}
            <div className="rounded-3xl p-6 shadow-xl" style={{ backgroundColor: '#CFDFD1' }}>
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#4C331D' }}>Your Expenses 💰</h2>
              <div className="grid grid-cols-3 gap-4 mb-3">
                {expenses.length > 0 ? (
                  expenses.map((expense) => (
                    <Link
                      key={expense.id}
                      href={`/expenses/${expense.id}`}
                      className="bg-white rounded-2xl h-40 flex flex-col items-center justify-center px-4 border-2 border-gray-300 hover:shadow-lg transition-all hover:scale-105 cursor-pointer"
                    >
                      <div className="text-3xl mb-2">{expense.emoji || '💵'}</div>
                      <span className="font-bold text-center mb-1 text-sm" style={{ color: '#4C331D' }}>
                        {expense.description}
                      </span>
                      <span className="text-lg font-bold text-center" style={{ color: '#407947' }}>
                        ${expense.amount.toFixed(2)}
                      </span>
                      <span className="text-xs text-center font-semibold mt-1" style={{ color: '#407947' }}>
                        {expense.group_name}
                      </span>
                    </Link>
                  ))
                ) : (
                  <div className="col-span-3 text-center py-8" style={{ color: '#4C331D' }}>
                    No recent expenses
                  </div>
                )}
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
                {lists.length > 0 ? (
                  lists.map((list) => (
                    <Link
                      key={list.id}
                      href="/lists"
                      className="bg-white rounded-2xl h-40 flex flex-col items-center justify-center px-4 border-2 border-gray-300 hover:shadow-lg transition-all hover:scale-105 cursor-pointer"
                    >
                      <div className="text-3xl mb-2">{list.emoji || '📋'}</div>
                      <span className="font-bold text-center mb-1 text-sm" style={{ color: '#4C331D' }}>
                        {list.name}
                      </span>
                      <span className="text-xs text-center font-semibold" style={{ color: '#407947' }}>
                        {list.group_name}
                      </span>
                    </Link>
                  ))
                ) : (
                  <div className="col-span-3 text-center py-8" style={{ color: '#4C331D' }}>
                    No lists yet
                  </div>
                )}
              </div>
              <div className="flex justify-end">
                <Link href="/lists" className="flex items-center gap-2 text-base font-semibold hover:opacity-80 group" style={{ color: '#4C331D' }}>
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

export default function Home() {
  return (
    <ProtectedRoute>
      <GroupsContent />
    </ProtectedRoute>
  );
}