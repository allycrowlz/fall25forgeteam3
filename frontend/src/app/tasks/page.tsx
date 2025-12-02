"use client";

import React, { useState, useEffect } from 'react';
import { Check, Plus, Eye, Edit2, X, Trash2 } from 'lucide-react';
import ProtectedRoute from '../components/ProtectedRoute';
import { useGroup } from '../../../contexts/GroupContext';
import { getCurrentUser } from '../services/authService';
import { getGroupMembers, type GroupMember } from '../services/groupService';
import { 
  getGroupChores, 
  getUserChores, 
  createChore, 
  deleteChore, 
  toggleChoreStatus,
  assignChore,
  type Chore 
} from '../services/tasksService';

interface Task {
  id: number;
  name: string;
  group: string;
  assignedTo: string;
  description: string;
  completed: boolean;
  chore_id: number;
  profile_id?: number;
  assignees?: Array<{ profile_id: number; profile_name: string; status: string }>;
  currentUserAssigned?: boolean;
  currentUserStatus?: 'pending' | 'completed';
}

export default function TasksPage() {
  const { selectedGroup, setSelectedGroup, loading: groupsLoading, groups } = useGroup();
  const [currentUser, setCurrentUser] = useState<{ profile_id: number; profile_name: string } | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeNav, setActiveNav] = useState('Chores');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'all' | 'my'>('all'); // 'all' or 'my'
  const [viewingDescription, setViewingDescription] = useState<number | null>(null);
  const [newTask, setNewTask] = useState({
    name: '',
    group: '',
    assignedTo: '',
    description: ''
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [assigningProfileId, setAssigningProfileId] = useState<number | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);

  // Fetch user data and chores
  useEffect(() => {
    async function loadData() {
      try {
        // If groups are still loading, wait
        if (groupsLoading) {
          setLoading(true);
          return;
        }

        // If there are no groups at all, show message and stop
        if (!groups || groups.length === 0) {
          setLoading(false);
          setError('Please create or join a group first (go to the Home/Groups page).');
          return;
        }

        // Decide which group to use: current selection or first group
        let effectiveGroup = selectedGroup || groups[0];
        if (!selectedGroup && groups[0]) {
          setSelectedGroup(groups[0]);
        }

        // We have at least one group; clear any previous "no group" error
        setError(null);
        setLoading(true);

        // Get current user
        const user = await getCurrentUser();
        const profileId = parseInt(user.profile_id || '0', 10);
        setCurrentUser({ profile_id: profileId, profile_name: user.profile_name });
        setAssigningProfileId(profileId);

        // Fetch group members
        const members = await getGroupMembers(effectiveGroup.group_id);
        setGroupMembers(members);

        // Fetch chores for the group
        const groupChores = await getGroupChores(effectiveGroup.group_id);
        
        // Transform backend chores to frontend task format
        const transformedTasks: Task[] = groupChores.map((chore: Chore) => {
          // Get the first assignee or default
          const assignee = chore.assignees && chore.assignees.length > 0 
            ? chore.assignees[0] 
            : null;
          
          // Find current user's assignment
          const currentUserAssignment = chore.assignees?.find(
            a => a.profile_id === profileId
          );
          
          return {
            id: chore.chore_id,
            chore_id: chore.chore_id,
            name: chore.name,
            group: chore.category || 'General',
            assignedTo: assignee?.profile_name || 'Unassigned',
            description: chore.notes || '',
            completed: currentUserAssignment?.status === 'completed' || false,
            profile_id: assignee?.profile_id,
            assignees: chore.assignees || [],
            currentUserAssigned: !!currentUserAssignment,
            currentUserStatus: currentUserAssignment?.status as 'pending' | 'completed' | undefined
          };
        });

        setTasks(transformedTasks);
      } catch (err: any) {
        console.error('Error loading tasks:', err);
        setError(err.message || 'Failed to load tasks');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [selectedGroup, groupsLoading]);

  // Get unique task categories/groups from tasks
  const taskGroups = ['All', ...Array.from(new Set(tasks.map(task => task.group)))];

  const toggleComplete = async (id: number) => {
    if (!currentUser) {
      console.error('Cannot toggle: missing user');
      return;
    }

    // Find the task
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    // Optimistic update - update UI immediately
    const newCompleted = !task.completed;
    setTasks(tasks.map(t => 
      t.id === id ? { 
        ...t, 
        completed: newCompleted,
        currentUserStatus: newCompleted ? 'completed' : 'pending',
        currentUserAssigned: true
      } : t
    ));

    try {
      // Check if current user is assigned to this chore
      if (!task.currentUserAssigned) {
        // If not assigned, assign them first, then toggle
        await assignChore(task.chore_id, currentUser.profile_id);
        await toggleChoreStatus(task.chore_id, currentUser.profile_id);
      } else {
        // If already assigned, just toggle
        await toggleChoreStatus(task.chore_id, currentUser.profile_id);
      }
      
      // Refresh tasks in the background to sync with server
      if (selectedGroup) {
        const groupChores = await getGroupChores(selectedGroup.group_id);
        const transformedTasks: Task[] = groupChores.map((chore: Chore) => {
          const assignee = chore.assignees && chore.assignees.length > 0 
            ? chore.assignees[0] 
            : null;
          const currentUserAssignment = chore.assignees?.find(
            a => a.profile_id === currentUser.profile_id
          );
          
          return {
            id: chore.chore_id,
            chore_id: chore.chore_id,
            name: chore.name,
            group: chore.category || 'General',
            assignedTo: assignee?.profile_name || 'Unassigned',
            description: chore.notes || '',
            completed: currentUserAssignment?.status === 'completed' || false,
            profile_id: assignee?.profile_id,
            assignees: chore.assignees || [],
            currentUserAssigned: !!currentUserAssignment,
            currentUserStatus: currentUserAssignment?.status as 'pending' | 'completed' | undefined
          };
        });
        setTasks(transformedTasks);
      }
    } catch (err: any) {
      console.error('Error toggling task:', err);
      // Revert optimistic update on error
      setTasks(tasks.map(t => 
        t.id === id ? { ...t, completed: task.completed } : t
      ));
      setError(err.message || 'Failed to toggle task');
    }
  };

  const deleteTask = async (id: number) => {
    try {
      const task = tasks.find(t => t.id === id);
      if (!task) return;

      await deleteChore(task.chore_id);
      setTasks(tasks.filter(task => task.id !== id));
    } catch (err: any) {
      console.error('Error deleting task:', err);
      setError(err.message || 'Failed to delete task');
    }
  };

  const toggleDescription = (id: number) => {
    setViewingDescription(viewingDescription === id ? null : id);
  };

  const addNewTask = async () => {
    if (!newTask.name || !newTask.assignedTo || !newTask.group || !selectedGroup || !currentUser) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      // First, create the chore
      const createdChore = await createChore({
        group_id: selectedGroup.group_id,
        name: newTask.name,
        category: newTask.group,
        notes: newTask.description || null,
        due_date: null
      });

      // Then assign it to the profile
      // Find the profile_id from the assignedTo name
      const assignedMember = groupMembers.find(m => 
        m.profile_name.toLowerCase() === newTask.assignedTo.toLowerCase()
      );
      
      if (assignedMember) {
        await assignChore(createdChore.chore_id, assignedMember.profile_id);
      } else if (newTask.assignedTo === currentUser.profile_name) {
        // Fallback to current user if name matches
        await assignChore(createdChore.chore_id, currentUser.profile_id);
      } else {
        // If no match found, assign to current user as fallback
        await assignChore(createdChore.chore_id, currentUser.profile_id);
      }

      // Refresh tasks
      const groupChores = await getGroupChores(selectedGroup.group_id);
      const transformedTasks: Task[] = groupChores.map((chore: Chore) => {
        const assignee = chore.assignees && chore.assignees.length > 0 
          ? chore.assignees[0] 
          : null;
        
        return {
          id: chore.chore_id,
          chore_id: chore.chore_id,
          name: chore.name,
          group: chore.category || 'General',
          assignedTo: assignee?.profile_name || 'Unassigned',
          description: chore.notes || '',
          completed: assignee?.status === 'completed' || false,
          profile_id: assignee?.profile_id
        };
      });

      setTasks(transformedTasks);
      setNewTask({ name: '', group: '', assignedTo: '', description: '' });
      setShowAddForm(false);
    } catch (err: any) {
      console.error('Error adding task:', err);
      setError(err.message || 'Failed to add task');
    }
  };

  const navItems = ['Home', 'Lists', 'Chores', 'Expenses', 'Profile', 'Settings'];

  // Filter tasks based on selected category
  const categoryFilteredTasks = selectedGroupFilter === 'All' 
    ? tasks 
    : tasks.filter(task => task.group === selectedGroupFilter);
  
  // Filter by view mode (all tasks vs my tasks)
  const filteredTasks = viewMode === 'my'
    ? categoryFilteredTasks.filter(task => 
        task.assignedTo === currentUser?.profile_name || 
        task.profile_id === currentUser?.profile_id ||
        task.currentUserAssigned
      )
    : categoryFilteredTasks;

  const TaskCard = ({ task, showAssignee = true }: { task: Task, showAssignee?: boolean }) => (
    <div 
      className="bg-white rounded-lg p-4 mb-3 shadow-sm border transition-opacity" 
      style={{ 
        borderColor: '#407947',
        opacity: task.completed ? 0.6 : 1
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h4 
            className={`font-semibold text-lg ${task.completed ? 'line-through' : ''}`} 
            style={{ color: task.completed ? '#888' : '#4C331D' }}
          >
            {task.name}
          </h4>
          <div className="flex gap-4 mt-1 text-sm">
            <span 
              className="px-2 py-1 rounded-full" 
              style={{ 
                backgroundColor: '#E8F3E9', 
                color: task.completed ? '#888' : '#407947',
                textDecoration: task.completed ? 'line-through' : 'none'
              }}
            >
              {task.group}
            </span>
            {showAssignee && (
              <span 
                className="px-2 py-1 rounded-full" 
                style={{ 
                  backgroundColor: '#CFDFD1', 
                  color: task.completed ? '#888' : '#4C331D',
                  textDecoration: task.completed ? 'line-through' : 'none'
                }}
              >
                {task.assignedTo}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => toggleDescription(task.id)}
            className="p-2 rounded hover:bg-gray-100 transition-colors"
            title="View description"
          >
            {viewingDescription === task.id ? <X size={18} /> : <Eye size={18} />}
          </button>
          <button
            onClick={() => deleteTask(task.id)}
            className="p-2 rounded hover:bg-red-100 transition-colors text-red-600"
            title="Delete task"
          >
            <Trash2 size={18} />
          </button>
          <button
            onClick={() => toggleComplete(task.id)}
            className="w-8 h-8 rounded border-2 flex items-center justify-center transition-colors"
            style={{
              backgroundColor: task.completed ? '#407947' : 'white',
              borderColor: task.completed ? '#407947' : '#4C331D'
            }}
            title={task.currentUserAssigned ? 'Toggle completion' : 'Assign and toggle'}
          >
            {task.completed && <Check className="text-white" size={16} />}
          </button>
        </div>
      </div>
      {viewingDescription === task.id && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-sm text-gray-600">{task.description || 'No description'}</p>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#E8F3E9' }}>
          <p className="text-xl" style={{ color: '#4C331D' }}>Loading tasks...</p>
        </div>
      </ProtectedRoute>
    );
  }

  if (error && !loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#E8F3E9' }}>
          <p className="text-xl text-red-600">{error}</p>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
    <div className="min-h-screen" style={{ backgroundColor: '#E8F3E9' }}>
        {/* Main Content */}
        <div className="px-8 py-8">
          <div className="max-w-7xl mx-auto">
            {error && (
              <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            {/* Page Title + Group Selector */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
              <div className="text-center md:text-left">
                <div
                  className="inline-block text-white px-12 py-3 rounded-lg shadow-lg"
                  style={{ backgroundColor: '#4C331D' }}
                >
                  <span className="text-xl font-medium">Task Management</span>
                </div>
              </div>
              {/* Group selector for tasks */}
              {groups.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium" style={{ color: '#4C331D' }}>
                    Group:
                  </span>
                  <select
                    value={selectedGroup?.group_id ?? groups[0].group_id}
                    onChange={(e) => {
                      const id = parseInt(e.target.value, 10);
                      const g = groups.find((grp) => grp.group_id === id) || null;
                      setSelectedGroup(g);
                    }}
                    className="px-4 py-2 rounded-lg border-2 bg-white"
                    style={{ borderColor: '#4C331D', color: '#4C331D' }}
                  >
                    {groups.map((g) => (
                      <option key={g.group_id} value={g.group_id}>
                        {g.group_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* View Mode and Category Filter Tabs */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex bg-white rounded-lg shadow-md p-1">
                {/* View Mode Toggle */}
                <button
                  onClick={() => setViewMode('all')}
                  className={`px-4 py-2 rounded-md font-medium transition-all ${
                    viewMode === 'all' 
                      ? 'text-white shadow-sm' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                  style={{
                    backgroundColor: viewMode === 'all' ? '#407947' : 'transparent'
                  }}
                >
                  All Tasks
                </button>
                <button
                  onClick={() => setViewMode('my')}
                  className={`px-4 py-2 rounded-md font-medium transition-all ${
                    viewMode === 'my' 
                      ? 'text-white shadow-sm' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                  style={{
                    backgroundColor: viewMode === 'my' ? '#407947' : 'transparent'
                  }}
                >
                  My Tasks
                </button>
                
                {/* Divider */}
                <div className="w-px bg-gray-300 mx-1" />
                
                {/* Category Filters */}
                {taskGroups.map(group => (
                  <button
                    key={group}
                    onClick={() => setSelectedGroupFilter(group)}
                    className={`px-4 py-2 rounded-md font-medium transition-all ${
                      selectedGroupFilter === group 
                        ? 'text-white shadow-sm' 
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                    style={{
                      backgroundColor: selectedGroupFilter === group ? '#407947' : 'transparent'
                    }}
                  >
                    {group}
                    {group !== 'All' && (
                      <span className="ml-2 text-xs opacity-75">
                        ({tasks.filter(t => t.group === group).length})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Single Column - All Group Tasks */}
            <div className="rounded-lg p-6" style={{ backgroundColor: '#CFDFD1' }}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold" style={{ color: '#4C331D' }}>
                  {viewMode === 'my' ? 'Your Tasks' : `${selectedGroup?.group_name || 'Group'} Tasks`} {selectedGroupFilter !== 'All' && `(${selectedGroupFilter})`}
                </h2>
                <span className="px-3 py-1 rounded-full text-sm font-medium" 
                      style={{ backgroundColor: '#407947', color: 'white' }}>
                  {filteredTasks.filter(t => !t.completed).length} pending
                </span>
              </div>
              
              <div className="space-y-2">
                {filteredTasks.length > 0 ? (
                  filteredTasks.map(task => (
                    <TaskCard key={task.id} task={task} showAssignee={true} />
                  ))
                ) : (
                  <p className="text-center py-8 text-gray-500">
                    No tasks {selectedGroupFilter !== 'All' && `in ${selectedGroupFilter}`}
                  </p>
                )}
              </div>
            </div>

            {/* Add New Task Section */}
            <div className="mt-8 flex justify-center">
              {!showAddForm ? (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="flex items-center gap-3 px-6 py-3 rounded-full transition-colors"
                  style={{ 
                    backgroundColor: '#4C331D', 
                    color: 'white' 
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  <Plus size={24} />
                  <span className="font-medium">Add New Task</span>
                </button>
              ) : (
                <div className="w-full max-w-2xl rounded-lg p-6" style={{ backgroundColor: '#CFDFD1' }}>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold" style={{ color: '#4C331D' }}>Create New Task</h3>
                    <button
                      onClick={() => setShowAddForm(false)}
                      className="p-1 rounded hover:bg-gray-200"
                    >
                      <X size={20} />
                    </button>
          </div>

                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Task name"
                      value={newTask.name}
                      onChange={(e) => setNewTask({...newTask, name: e.target.value})}
                      className="w-full px-4 py-2 rounded-lg border-2"
                      style={{ borderColor: '#4C331D' }}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Group (e.g., Kitchen, Bathroom)"
                        value={newTask.group}
                        onChange={(e) => setNewTask({...newTask, group: e.target.value})}
                        className="px-4 py-2 rounded-lg border-2"
                        style={{ borderColor: '#4C331D' }}
                      />
                      
                      <select
                        value={newTask.assignedTo}
                        onChange={(e) => setNewTask({...newTask, assignedTo: e.target.value})}
                        className="px-4 py-2 rounded-lg border-2"
                        style={{ borderColor: '#4C331D' }}
                      >
                        <option value="">Select assignee</option>
                        {groupMembers.map(member => (
                          <option key={member.profile_id} value={member.profile_name}>
                            {member.profile_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <textarea
                      placeholder="Task description (optional)"
                      value={newTask.description}
                      onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                      className="w-full px-4 py-2 rounded-lg border-2 h-24"
                      style={{ borderColor: '#4C331D' }}
                    />
                    
                    <button
                      onClick={addNewTask}
                      className="w-full py-3 rounded-lg text-white font-medium transition-colors"
                      style={{ backgroundColor: '#407947' }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                    >
                      Create Task
                    </button>
                  </div>
              </div>
              )}
          </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
