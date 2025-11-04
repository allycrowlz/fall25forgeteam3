"use client";

import React, { useState } from 'react';
import { Check, Plus } from 'lucide-react';

export default function TasksPage() {
  const [tasks, setTasks] = useState([
    { id: 1, roommate: 'Roommate 1', task: '', completed: false },
    { id: 2, roommate: 'Roommate 1', task: '', completed: false },
    { id: 3, roommate: 'Roommate 2', task: '', completed: false },
    { id: 4, roommate: 'Roommate 2', task: '', completed: false },
  ]);

  const [activeNav, setActiveNav] = useState('Chores');

  const toggleComplete = (id: number) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const updateTask = (id: number, value: string) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, task: value } : task
    ));
  };

  const addNewTask = () => {
    const lastTask = tasks[tasks.length - 1];
    const roommate = lastTask.roommate === 'Roommate 1' ? 'Roommate 2' : 'Roommate 1';
    setTasks([...tasks, {
      id: tasks.length + 1,
      roommate: roommate,
      task: '',
      completed: false
    }]);
  };

  const navItems = ['Home', 'Lists', 'Chores', 'Expenses', 'Profile', 'Settings'];

  const groupedTasks = tasks.reduce((acc, task) => {
    if (!acc[task.roommate]) {
      acc[task.roommate] = [];
    }
    acc[task.roommate].push(task);
    return acc;
  }, {} as Record<string, typeof tasks>);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#E8F3E9' }}>
      {/* Header */}
      <header className="px-8 py-4" style={{ backgroundColor: '#407947' }}>
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-white">HomeBase</h1>
            <span className="text-2xl">🏠</span>
          </div>
          <nav className="flex gap-8">
            {navItems.map(item => (
              <button
                key={item}
                onClick={() => setActiveNav(item)}
                className={`font-medium transition-colors text-white hover:text-gray-200 ${
                  activeNav === item ? 'underline' : ''
                }`}
              >
                {item}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Spacer */}
      <div className="py-6"></div>

      {/* Main Content */}
      <div className="px-8 pb-8">
        <div className="max-w-5xl mx-auto rounded-lg p-8 relative" style={{ backgroundColor: '#CFDFD1' }}>
          {/* Tasks Badge */}
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
            <div className="text-white px-12 py-3 rounded-lg shadow-lg" style={{ backgroundColor: '#4C331D' }}>
              <span className="text-lg font-medium">Tasks</span>
            </div>
          </div>

          <div className="mt-8 space-y-8">
            {Object.entries(groupedTasks).map(([roommate, roommateTasks]) => (
              <div key={roommate} className="space-y-4">
                <h3 className="font-medium text-lg" style={{ color: '#4C331D' }}>{roommate}</h3>
                {roommateTasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-6">
                    <input
                      type="text"
                      value={task.task}
                      onChange={(e) => updateTask(task.id, e.target.value)}
                      placeholder="Enter task..."
                      className="flex-1 px-4 py-3 bg-white border-2 rounded-full focus:outline-none transition-colors"
                      style={{ 
                        borderColor: '#4C331D',
                        color: '#4C331D'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#407947'}
                      onBlur={(e) => e.target.style.borderColor = '#4C331D'}
                    />
                    <button
                      onClick={() => toggleComplete(task.id)}
                      className="w-10 h-10 rounded border-2 flex items-center justify-center transition-colors"
                      style={{
                        backgroundColor: task.completed ? '#407947' : 'white',
                        borderColor: task.completed ? '#407947' : '#4C331D'
                      }}
                    >
                      {task.completed && <Check className="text-white" size={24} />}
                    </button>
                    <span className="text-sm w-24 text-right" style={{ color: '#4C331D' }}>
                      Completed?
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Add New Task Button */}
          <div className="mt-12 flex flex-col items-center gap-3">
            <p className="font-medium" style={{ color: '#4C331D' }}>Add new task</p>
            <button
              onClick={addNewTask}
              className="w-12 h-12 bg-transparent border-3 rounded-full flex items-center justify-center transition-colors"
              style={{ borderColor: '#4C331D', borderWidth: '3px' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#CFDFD1'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Plus size={32} strokeWidth={3} style={{ color: '#4C331D' }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}