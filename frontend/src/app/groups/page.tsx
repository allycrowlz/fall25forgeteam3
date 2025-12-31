"use client";

import Link from "next/link";
import { useState, useEffect } from 'react';
import ProtectedRoute from '../components/ProtectedRoute';
import { getCurrentUser, authenticatedFetch, type User } from '../services/authService';
import { CheckCircle, DollarSign, FileText, Calendar as CalendarIcon, ArrowRight, Sparkles, Clock } from 'lucide-react';

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

export interface Event {
  event_id: number;
  event_name: string;
  event_datetime_start: string;
  event_datetime_end?: string;
  event_location?: string;
  event_notes?: string;
  group_id: number;
  profile_id: number;
  group_name?: string;
}

function GroupsContent() {
  const [selectedDate] = useState(new Date().getDate());
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [lists, setLists] = useState<List[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch user data
        const userData = await getCurrentUser();
        setUser(userData);
        setLoading(false);

        // Fetch chores/tasks for user's profile
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

        // Fetch expenses from ALL user's groups
        authenticatedFetch(`/api/groups?profile_id=${userData.profile_id}`)
          .then(async (groupsResponse) => {
            if (groupsResponse.ok) {
              const groupsData = await groupsResponse.json();
              
              if (groupsData && groupsData.length > 0) {
                try {
                  // Fetch expenses from ALL groups
                  const allExpensesPromises = groupsData.map((group: any) =>
                    authenticatedFetch(`/api/expenses/groups/${group.group_id}/expenses`)
                      .then(res => res.ok ? res.json() : [])
                      .then(expenses => expenses.map((exp: any) => ({
                        ...exp,
                        group_name: group.group_name
                      })))
                      .catch(() => [])
                  );
                  
                  const allExpensesArrays = await Promise.all(allExpensesPromises);
                  const allExpenses = allExpensesArrays.flat();
                  
                  // Sort by date (most recent first) and take top 3
                  const sortedExpenses = allExpenses.sort((a: any, b: any) => {
                    const dateA = new Date(a.date_created || 0).getTime();
                    const dateB = new Date(b.date_created || 0).getTime();
                    return dateB - dateA;
                  });
                  
                  const recentExpenses = sortedExpenses
                    .slice(0, 3)
                    .map((expense: any) => ({
                      id: expense.item_id,
                      description: expense.item_name || 'Expense',
                      amount: parseFloat(expense.item_total_cost || 0),
                      group_name: expense.group_name || 'My Group'
                    }));
                  
                  setExpenses(recentExpenses);
                } catch (fetchError) {
                  console.error('Exception during expenses fetch:', fetchError);
                  setExpenses([]);
                }
              } else {
                setExpenses([]);
              }
            } else {
              setExpenses([]);
            }
          })
          .catch((err) => {
            console.error('Error in groups/expenses fetch:', err);
            setExpenses([]);
          });

        // Fetch shopping lists
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

        // Fetch upcoming events - FILTER OUT NON-EVENTS
        const now = new Date();
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30);
        
        authenticatedFetch(`/api/events?start_date=${now.toISOString()}&end_date=${futureDate.toISOString()}`)
          .then(async (eventsResponse) => {
            if (eventsResponse.ok) {
              const eventsData: any[] = await eventsResponse.json();
              
              console.log('📊 Raw events data received:', eventsData);
              console.log('📊 Total events:', eventsData.length);
              
              // Log each event for debugging
              eventsData.forEach((item: any, index: number) => {
                console.log(`Event ${index + 1}:`, {
                  id: item.event_id,
                  name: item.event_name,
                  location: item.event_location,
                  group_id: item.group_id,
                  start: item.event_datetime_start
                });
              });
              
              // Filter to only include actual events
              // ONLY exclude events that are marked as expenses with EXPENSE: in event_location
              const actualEvents = eventsData.filter((item: any) => {
                // Check if this is an expense event (marked with EXPENSE: prefix in location)
                const isExpenseEvent = item.event_location?.startsWith('EXPENSE:');
                
                if (isExpenseEvent) {
                  console.log('❌ Filtered out expense event:', item.event_name, 'Location:', item.event_location);
                  return false;
                }
                
                console.log('✅ Including event:', item.event_name);
                // Include all other events
                return true;
              });
              
              console.log('Filtered events:', actualEvents);
              
              const sortedEvents = actualEvents
                .sort(
                  (a, b) =>
                    new Date(a.event_datetime_start).getTime() -
                    new Date(b.event_datetime_start).getTime()
                )
                .slice(0, 5);
              setEvents(sortedEvents);
            }
          })
          .catch((err) => {
            console.log('Failed to fetch events:', err);
            setEvents([]);
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
    
    const days: (number | null)[] = [];
    
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
    
    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push(null);
    }
    
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

  const formatEventDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      if (date.toDateString() === today.toDateString()) {
        return 'Today';
      } else if (date.toDateString() === tomorrow.toDateString()) {
        return 'Tomorrow';
      } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-stone-50 to-neutral-100 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#407947', animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#407947', animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#407947', animationDelay: '300ms' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-stone-50 to-neutral-100">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div>
            <div className="mb-8">
              <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-[#407947] to-[#2d5833] bg-clip-text text-transparent">
                Welcome back,
              </h1>
              <h2 className="text-4xl font-bold" style={{ color: '#4C331D' }}>
                {user?.profile_name || 'there'}!
              </h2>
            </div>

            {/* Calendar Section */}
            <div className="rounded-2xl p-8 backdrop-blur-sm bg-white/80 shadow-lg hover:shadow-xl transition-shadow duration-300" style={{ backgroundColor: 'rgba(220, 206, 189, 0.6)', borderWidth: '2px', borderStyle: 'solid', borderColor: '#8B6F47' }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: '#4C331D' }}>
                  <CalendarIcon size={24} strokeWidth={2.5} style={{ color: '#4C331D' }} />
                  {getCurrentMonthYear()}
                </h2>
              </div>
              <div className="grid grid-cols-7 gap-2 mb-6">
                {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((day) => (
                  <div key={day} className="text-center font-bold text-xs py-2 opacity-60" style={{ color: '#4C331D' }}>
                    {day}
                  </div>
                ))}
                
                {getDaysInMonth().map((day, index) => (
                  <div
                    key={index}
                    className={`text-center py-3 text-sm font-medium ${
                      day === null
                        ? ''
                        : day === selectedDate
                        ? 'text-white rounded-xl font-bold shadow-md transform scale-105'
                        : 'rounded-xl hover:bg-white/50 transition-all duration-200 cursor-pointer'
                    }`}
                    style={
                      day === selectedDate
                        ? { backgroundColor: '#407947' }
                        : day !== null
                        ? { color: '#4C331D' }
                        : {}
                    }
                  >
                    {day}
                  </div>
                ))}
              </div>
              <Link href="/calendar" className="flex items-center justify-end gap-2 text-sm font-bold hover:gap-3 transition-all duration-200 group" style={{ color: '#4C331D' }}>
                View Full Calendar
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Upcoming Events Section */}
            <div className="rounded-2xl p-8 backdrop-blur-sm bg-white/80 shadow-lg hover:shadow-xl transition-shadow duration-300 mt-6" style={{ backgroundColor: 'rgba(220, 206, 189, 0.6)', borderWidth: '2px', borderStyle: 'solid', borderColor: '#8B6F47' }}>
              <div className="flex items-center gap-2 mb-6">
                <Clock size={24} strokeWidth={2.5} style={{ color: '#4C331D' }} />
                <h2 className="text-2xl font-bold" style={{ color: '#4C331D' }}>Upcoming Events</h2>
              </div>
              <div className="space-y-3 mb-6">
                {events.length > 0 ? (
                  events.map((event) => {
                    const eventTime = new Date(event.event_datetime_start).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    });

                    return (
                      <div
                        key={event.event_id}
                        className="bg-white/90 backdrop-blur-sm rounded-xl p-4 flex items-center gap-4 shadow-md border border-gray-100 hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
                      >
                        <div className="flex-shrink-0">
                          <CalendarIcon size={24} strokeWidth={2.5} style={{ color: '#4C331D' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-sm mb-1 truncate" style={{ color: '#4C331D' }}>
                            {event.event_name}
                          </h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ color: '#407947', backgroundColor: 'rgba(64, 121, 71, 0.15)' }}>
                              {formatEventDate(event.event_datetime_start)}
                            </span>
                            <span className="text-xs font-medium" style={{ color: '#4C331D' }}>
                              {eventTime}
                            </span>
                            <span className="text-xs font-medium truncate" style={{ color: '#4C331D', opacity: 0.7 }}>
                              {event.group_name || 'Personal'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 font-medium" style={{ color: '#4C331D', opacity: 0.5 }}>
                    No upcoming events
                  </div>
                )}
              </div>
              <Link href="/calendar" className="flex items-center justify-end gap-2 text-sm font-bold hover:gap-3 transition-all duration-200 group" style={{ color: '#4C331D' }}>
                See All Events
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Upcoming Tasks Section */}
            <div className="rounded-2xl p-8 backdrop-blur-sm bg-white/80 shadow-lg hover:shadow-xl transition-shadow duration-300" style={{ backgroundColor: 'rgba(207, 223, 209, 0.6)', borderWidth: '2px', borderStyle: 'solid', borderColor: '#2d5833' }}>
              <div className="flex items-center gap-2 mb-6">
                <Sparkles size={24} strokeWidth={2.5} style={{ color: '#407947' }} />
                <h2 className="text-2xl font-bold" style={{ color: '#4C331D' }}>Upcoming Tasks</h2>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                {tasks.length > 0 ? (
                  tasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-white/90 backdrop-blur-sm rounded-xl p-5 flex flex-col items-center justify-center shadow-md border border-gray-100 hover:shadow-lg hover:scale-105 transition-all duration-200"
                    >
                      <div className="mb-3">
                        <CheckCircle size={32} strokeWidth={2.5} style={{ color: '#407947' }} />
                      </div>
                      <span className="font-bold text-center mb-2 text-sm line-clamp-2" style={{ color: '#4C331D' }}>
                        {task.name}
                      </span>
                      <span className="text-xs text-center font-semibold mb-2" style={{ color: '#4C331D' }}>
                        {formatDate(task.due_date)}
                      </span>
                      <span className="text-xs text-center font-bold px-3 py-1.5 rounded-full" style={{ color: '#407947', backgroundColor: 'rgba(64, 121, 71, 0.15)' }}>
                        {task.group_name}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="col-span-3 text-center py-12 font-medium" style={{ color: '#4C331D', opacity: 0.5 }}>
                    No upcoming tasks
                  </div>
                )}
              </div>
              <Link href="/tasks" className="flex items-center justify-end gap-2 text-sm font-bold hover:gap-3 transition-all duration-200 group" style={{ color: '#4C331D' }}>
                See All Tasks
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Your Expenses Section */}
            <div className="rounded-2xl p-8 backdrop-blur-sm bg-white/80 shadow-lg hover:shadow-xl transition-shadow duration-300" style={{ backgroundColor: 'rgba(207, 223, 209, 0.6)', borderWidth: '2px', borderStyle: 'solid', borderColor: '#2d5833' }}>
              <div className="flex items-center gap-2 mb-6">
                <DollarSign size={24} strokeWidth={2.5} style={{ color: '#407947' }} />
                <h2 className="text-2xl font-bold" style={{ color: '#4C331D' }}>Recent Expenses</h2>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                {expenses.length > 0 ? (
                  expenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="bg-white/90 backdrop-blur-sm rounded-xl p-5 flex flex-col items-center justify-center shadow-md border border-gray-100 hover:shadow-lg hover:scale-105 transition-all duration-200"
                    >
                      <div className="mb-3">
                        <DollarSign size={32} strokeWidth={2.5} style={{ color: '#407947' }} />
                      </div>
                      <span className="font-bold text-center mb-2 text-sm line-clamp-2" style={{ color: '#4C331D' }}>
                        {expense.description}
                      </span>
                      <span className="text-2xl font-bold text-center mb-2" style={{ color: '#407947' }}>
                        ${expense.amount.toFixed(2)}
                      </span>
                      <span className="text-xs text-center font-bold px-3 py-1.5 rounded-full" style={{ color: '#407947', backgroundColor: 'rgba(64, 121, 71, 0.15)' }}>
                        {expense.group_name}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="col-span-3 text-center py-12 font-medium" style={{ color: '#4C331D', opacity: 0.5 }}>
                    No recent expenses
                  </div>
                )}
              </div>
              <Link href="/expenses" className="flex items-center justify-end gap-2 text-sm font-bold hover:gap-3 transition-all duration-200 group" style={{ color: '#4C331D' }}>
                See All Expenses
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Your Lists Section */}
            <div className="rounded-2xl p-8 backdrop-blur-sm bg-white/80 shadow-lg hover:shadow-xl transition-shadow duration-300" style={{ backgroundColor: 'rgba(207, 223, 209, 0.6)', borderWidth: '2px', borderStyle: 'solid', borderColor: '#2d5833' }}>
              <div className="flex items-center gap-2 mb-6">
                <FileText size={24} strokeWidth={2.5} style={{ color: '#407947' }} />
                <h2 className="text-2xl font-bold" style={{ color: '#4C331D' }}>Your Lists</h2>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                {lists.length > 0 ? (
                  lists.map((list) => (
                    <div
                      key={list.id}
                      className="bg-white/90 backdrop-blur-sm rounded-xl p-5 flex flex-col items-center justify-center shadow-md border border-gray-100 hover:shadow-lg hover:scale-105 transition-all duration-200"
                    >
                      <div className="mb-3">
                        <FileText size={32} strokeWidth={2.5} style={{ color: '#407947' }} />
                      </div>
                      <span className="font-bold text-center mb-2 text-sm line-clamp-2" style={{ color: '#4C331D' }}>
                        {list.name}
                      </span>
                      <span className="text-xs text-center font-bold px-3 py-1.5 rounded-full" style={{ color: '#407947', backgroundColor: 'rgba(64, 121, 71, 0.15)' }}>
                        {list.group_name}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="col-span-3 text-center py-12 font-medium" style={{ color: '#4C331D', opacity: 0.5 }}>
                    No lists yet
                  </div>
                )}
              </div>
              <Link href="/lists" className="flex items-center justify-end gap-2 text-sm font-bold hover:gap-3 transition-all duration-200 group" style={{ color: '#4C331D' }}>
                See All Lists
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
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