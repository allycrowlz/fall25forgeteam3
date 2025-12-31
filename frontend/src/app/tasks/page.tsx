'use client';
import ProtectedRoute from '../components/ProtectedRoute';
import { useState, useEffect } from 'react';
import { Plus, Trash2, Check, Circle, User, Calendar, ChevronDown } from 'lucide-react';
import { getCurrentUser } from '../services/authService';
import { authenticatedFetch } from '../services/authService';
import { useGroup } from '../contexts/GroupContext';

// Color scheme matching your app
const PAGE_BG = "#E8F3E9";
const BROWN = "#4C331D";
const GREEN = "#407947";
const LIGHT_GREEN = "#CFDFD1";
const BEIGE = "#DCCEBD";
const CARD_BG = "#FFFFFF";

interface Assignee {
  profile_id: number;
  profile_name: string;
  status: string;
}

interface Chore {
  chore_id: number;
  group_id: number;
  name: string;
  assigned_date: string;
  due_date?: string | null;
  notes?: string | null;
  assignees?: Assignee[];
  individual_status?: string;
  group_name?: string;
}

interface GroupMember {
  profile_id: number;
  profile_name: string;
  email?: string;
}

function TasksChoresContent() {
  const { currentGroup, loading: groupLoading } = useGroup();
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>('');
  const [tasks, setTasks] = useState<Chore[]>([]);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState({ 
    name: "", 
    assignedToId: "",
    due_date: "",
    notes: ""
  });
  const [activeTab, setActiveTab] = useState<'your' | 'all'>('your');

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (currentGroup && currentUserId) {
      loadTasks();
      loadGroupMembers();
    }
  }, [currentGroup, currentUserId]);

  async function loadUser() {
    try {
      console.log('Loading user...');
      const user = await getCurrentUser();
      console.log('User loaded:', user);
      
      const userId = user.profile_id ? parseInt(user.profile_id, 10) : null;
      setCurrentUserId(userId);
      setCurrentUserName(user.profile_name || '');
      
      if (!userId) {
        setError('User ID not found');
      }
    } catch (e: any) {
      console.error('Error loading user:', e);
      setError(e?.message || 'Failed to load user data');
    }
  }

  async function loadGroupMembers() {
    if (!currentGroup) return;
    
    try {
      console.log('Loading group members for group:', currentGroup.group_id);
      const response = await authenticatedFetch(
        `/api/groups/${currentGroup.group_id}/members`
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to load group members:', errorText);
        throw new Error('Failed to load group members');
      }
      
      const data = await response.json();
      console.log('Group members loaded:', data);
      setGroupMembers(data);
    } catch (e: any) {
      console.error('Error loading group members:', e);
      // Don't set error state, just log it - this is not critical
    }
  }

  async function loadTasks() {
    if (!currentGroup) return;
    
    try {
      setLoading(true);
      console.log('Loading tasks for group:', currentGroup.group_id);
      
      const response = await authenticatedFetch(
        `/api/groups/${currentGroup.group_id}/chores/detailed`
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to load tasks:', errorText);
        throw new Error('Failed to load tasks');
      }
      
      const data = await response.json();
      console.log('Tasks loaded:', data);
      setTasks(data);
      setError(null); // Clear any previous errors
    } catch (e: any) {
      console.error('Error loading tasks:', e);
      setError(e?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddTask() {
    if (!newTask.name.trim() || !currentGroup) return;

    try {
      // Format the due_date properly - just send YYYY-MM-DD string
      const payload = {
        group_id: currentGroup.group_id,
        name: newTask.name.trim(),
        due_date: newTask.due_date || null,
        notes: newTask.notes.trim() || null
      };

      console.log('Creating chore with payload:', payload);

      // Create the chore
      const createResponse = await authenticatedFetch('/api/chores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json().catch(() => ({ detail: 'Unknown error' }));
        console.error('Create chore error:', errorData);
        throw new Error(errorData.detail || 'Failed to create task');
      }

      const createdChore = await createResponse.json();
      console.log('Created chore:', createdChore);

      // Assign to user if specified
      if (newTask.assignedToId) {
        const assignPayload = {
          chore_id: createdChore.chore_id,
          profile_id: parseInt(newTask.assignedToId)
        };
        
        console.log('Assigning chore with payload:', assignPayload);
        
        const assignResponse = await authenticatedFetch(`/api/chores/${createdChore.chore_id}/assign`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(assignPayload)
        });

        if (!assignResponse.ok) {
          console.error('Failed to assign chore, but chore was created');
          // Don't throw error, the chore was still created successfully
        }
      }

      setNewTask({ name: "", assignedToId: "", due_date: "", notes: "" });
      setShowAddModal(false);
      await loadTasks();
    } catch (e: any) {
      console.error('Error in handleAddTask:', e);
      alert(e?.message || 'Failed to create task');
    }
  }

  async function toggleComplete(chore_id: number) {
    if (!currentUserId) return;
  
    // Optimistic update - update UI immediately
    setTasks(prevTasks => 
      prevTasks.map(task => {
        if (task.chore_id === chore_id && task.assignees) {
          return {
            ...task,
            assignees: task.assignees.map(assignee => 
              assignee.profile_id === currentUserId
                ? {
                    ...assignee,
                    status: assignee.status === 'completed' ? 'pending' : 'completed'
                  }
                : assignee
            )
          };
        }
        return task;
      })
    );
  
    // Then sync with server in the background
    try {
      const response = await authenticatedFetch(
        `/api/chores/${chore_id}/toggle/${currentUserId}`,
        { method: 'PATCH' }
      );
  
      if (!response.ok) {
        // If server update fails, revert the optimistic update
        await loadTasks();
        throw new Error('Failed to toggle task status');
      }
    } catch (e: any) {
      console.error('Error toggling task:', e);
      alert(e?.message || 'Failed to update task');
    }
  }

  async function deleteTask(chore_id: number) {
    if (!confirm('Are you sure you want to delete this task?')) return;
  
    // Optimistic update - remove from UI immediately
    setTasks(prevTasks => prevTasks.filter(task => task.chore_id !== chore_id));
  
    try {
      const response = await authenticatedFetch(`/api/chores/${chore_id}`, {
        method: 'DELETE'
      });
  
      if (!response.ok) {
        // If deletion fails, reload to restore the task
        await loadTasks();
        throw new Error('Failed to delete task');
      }
    } catch (e: any) {
      console.error('Error deleting task:', e);
      alert(e?.message || 'Failed to delete task');
    }
  }

  // Filter tasks based on active tab
  const yourTasks = tasks.filter(task => 
    task.assignees?.some(a => a.profile_id === currentUserId)
  );
  const allTasks = tasks;

  const displayTasks = activeTab === 'your' ? yourTasks : allTasks;
  
  // Calculate completion based on current user's status for "Your Tasks"
  const completedCount = activeTab === 'your' 
    ? yourTasks.filter(t => 
        t.assignees?.find(a => a.profile_id === currentUserId)?.status === 'completed'
      ).length
    : allTasks.filter(t => 
        t.assignees?.every(a => a.status === 'completed') && t.assignees.length > 0
      ).length;
  const totalCount = displayTasks.length;

  function formatDate(dateStr?: string | null) {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  }

  function isOverdue(dateStr?: string | null) {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  }

  const TaskList = ({ taskList }: { taskList: Chore[] }) => (
    <div className="space-y-3">
      {taskList.map(task => {
        const userAssignment = task.assignees?.find(a => a.profile_id === currentUserId);
        const isCompleted = activeTab === 'your' 
          ? userAssignment?.status === 'completed'
          : task.assignees?.every(a => a.status === 'completed') && (task.assignees?.length || 0) > 0;
        const overdue = isOverdue(task.due_date);

        return (
          <div
            key={task.chore_id}
            className="rounded-xl shadow-md p-5 transition-all hover:shadow-lg"
            style={{ 
              backgroundColor: CARD_BG,
              border: `1px solid ${overdue && !isCompleted ? '#EF4444' : LIGHT_GREEN}`,
              opacity: isCompleted ? 0.7 : 1
            }}
          >
            <div className="flex items-start gap-4">
              {/* Complete Button */}
              {activeTab === 'your' && userAssignment && (
                <button
                  onClick={() => toggleComplete(task.chore_id)}
                  className="flex-shrink-0 rounded-full p-1 transition-colors mt-1"
                  style={{ 
                    backgroundColor: isCompleted ? GREEN : 'transparent',
                    border: `2px solid ${isCompleted ? GREEN : BROWN}`
                  }}
                >
                  {isCompleted ? (
                    <Check size={20} style={{ color: 'white' }} />
                  ) : (
                    <Circle size={20} style={{ color: BROWN, opacity: 0.3 }} />
                  )}
                </button>
              )}

              {/* Task Info */}
              <div className="flex-1 min-w-0">
                <h3 
                  className="text-lg font-semibold mb-1"
                  style={{ 
                    color: BROWN,
                    textDecoration: isCompleted ? 'line-through' : 'none'
                  }}
                >
                  {task.name}
                </h3>
                
                {task.notes && (
                  <p className="text-sm mb-2" style={{ color: BROWN, opacity: 0.7 }}>
                    {task.notes}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3 text-sm">
                  {/* Assignees */}
                  {task.assignees && task.assignees.length > 0 && (
                    <div className="flex items-center gap-1" style={{ color: BROWN, opacity: 0.6 }}>
                      <User size={14} />
                      <span>
                        {task.assignees.map(a => a.profile_name).join(', ')}
                      </span>
                    </div>
                  )}

                  {/* Due Date */}
                  {task.due_date && (
                    <div 
                      className="flex items-center gap-1" 
                      style={{ color: overdue && !isCompleted ? '#EF4444' : BROWN, opacity: overdue && !isCompleted ? 1 : 0.6 }}
                    >
                      <Calendar size={14} />
                      <span>{formatDate(task.due_date)}</span>
                      {overdue && !isCompleted && (
                        <span className="text-xs font-semibold">(Overdue)</span>
                      )}
                    </div>
                  )}

                  {/* Status badges for all tasks view */}
                  {activeTab === 'all' && task.assignees && task.assignees.length > 0 && (
                    <div className="flex gap-1">
                      {task.assignees.filter(a => a.status === 'completed').length > 0 && (
                        <span 
                          className="px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={{ backgroundColor: GREEN, color: 'white' }}
                        >
                          {task.assignees.filter(a => a.status === 'completed').length}/{task.assignees.length} done
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Delete Button */}
              <button
                onClick={() => deleteTask(task.chore_id)}
                className="flex-shrink-0 p-2 rounded-lg transition-colors"
                style={{ color: '#DC2626' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEE2E2'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        );
      })}
      
      {taskList.length === 0 && (
        <div 
          className="rounded-xl p-12 text-center"
          style={{ backgroundColor: CARD_BG, border: `2px dashed ${LIGHT_GREEN}` }}
        >
          <p className="text-lg" style={{ color: BROWN, opacity: 0.5 }}>
            {activeTab === 'your' 
              ? 'No tasks assigned to you yet.'
              : 'No tasks yet. Click "Add Task" to get started!'
            }
          </p>
        </div>
      )}
    </div>
  );

  if (groupLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: PAGE_BG }}>
        <div className="text-lg font-medium" style={{ color: BROWN }}>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: PAGE_BG }}>
        <div className="text-center">
          <div className="text-red-600 font-medium mb-4">{error}</div>
          <button
            onClick={() => {
              setError(null);
              loadUser();
            }}
            className="px-6 py-3 rounded-xl font-semibold shadow-md"
            style={{ backgroundColor: GREEN, color: 'white' }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!currentGroup) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: PAGE_BG }}>
        <div className="text-center">
          <p className="text-lg mb-4" style={{ color: BROWN }}>
            You need to join a group first to manage tasks.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: PAGE_BG }}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: BROWN }}>
            Tasks & Chores
          </h1>
          <p className="text-lg" style={{ color: BROWN, opacity: 0.7 }}>
            {currentGroup.group_name}
          </p>
        </div>

        {/* Stats Card */}
        <div 
          className="rounded-2xl shadow-lg p-6 mb-6"
          style={{ 
            backgroundColor: CARD_BG,
            border: `2px solid ${LIGHT_GREEN}`
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold mb-1" style={{ color: BROWN, opacity: 0.6 }}>
                {activeTab === 'your' ? 'Your Progress' : 'Overall Progress'}
              </p>
              <p className="text-3xl font-bold" style={{ color: BROWN }}>
                {completedCount} / {totalCount}
              </p>
              <p className="text-sm mt-1" style={{ color: BROWN, opacity: 0.6 }}>
                tasks completed
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="rounded-xl px-6 py-3 font-semibold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
              style={{ 
                backgroundColor: GREEN,
                color: 'white'
              }}
            >
              <Plus size={20} />
              Add Task
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4 h-3 rounded-full overflow-hidden" style={{ backgroundColor: LIGHT_GREEN }}>
            <div 
              className="h-full rounded-full transition-all duration-300"
              style={{ 
                backgroundColor: GREEN,
                width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`
              }}
            />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('your')}
            className="flex-1 py-3 px-6 rounded-xl font-semibold transition-all"
            style={{
              backgroundColor: activeTab === 'your' ? GREEN : CARD_BG,
              color: activeTab === 'your' ? 'white' : BROWN,
              border: `2px solid ${activeTab === 'your' ? GREEN : LIGHT_GREEN}`,
            }}
          >
            Your Tasks ({yourTasks.length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className="flex-1 py-3 px-6 rounded-xl font-semibold transition-all"
            style={{
              backgroundColor: activeTab === 'all' ? GREEN : CARD_BG,
              color: activeTab === 'all' ? 'white' : BROWN,
              border: `2px solid ${activeTab === 'all' ? GREEN : LIGHT_GREEN}`,
            }}
          >
            All Tasks ({allTasks.length})
          </button>
        </div>

        {/* Tasks List */}
        <TaskList taskList={displayTasks} />
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div 
          className="fixed inset-0 flex items-center justify-center p-4 z-50"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="rounded-2xl shadow-2xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto"
            style={{ 
              backgroundColor: CARD_BG,
              border: `2px solid ${LIGHT_GREEN}`
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-6" style={{ color: BROWN }}>
              Add New Task
            </h2>
            
            <div className="space-y-5">
              <div>
                <label 
                  htmlFor="taskTitle"
                  className="block text-sm font-semibold mb-2"
                  style={{ color: BROWN }}
                >
                  Task Description *
                </label>
                <input
                  id="taskTitle"
                  type="text"
                  value={newTask.name}
                  onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                  placeholder="e.g., Clean the bathroom"
                  className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2"
                  style={{ 
                    border: `2px solid ${LIGHT_GREEN}`,
                    color: BROWN,
                    backgroundColor: PAGE_BG
                  }}
                />
              </div>

              <div>
                <label 
                  htmlFor="assignedTo"
                  className="block text-sm font-semibold mb-2"
                  style={{ color: BROWN }}
                >
                  Assign To (optional)
                </label>
                <div className="relative">
                  <select
                    id="assignedTo"
                    value={newTask.assignedToId}
                    onChange={(e) => setNewTask({ ...newTask, assignedToId: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 appearance-none"
                    style={{ 
                      border: `2px solid ${LIGHT_GREEN}`,
                      color: BROWN,
                      backgroundColor: PAGE_BG
                    }}
                  >
                    <option value="" style={{ color: BROWN }}>Select a person...</option>
                    {groupMembers.map(member => (
                      <option key={member.profile_id} value={member.profile_id} style={{ color: BROWN }}>
                        {member.profile_name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown 
                    size={20} 
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none"
                    style={{ color: BROWN }}
                  />
                </div>
              </div>

              <div>
                <label 
                  htmlFor="dueDate"
                  className="block text-sm font-semibold mb-2"
                  style={{ color: BROWN }}
                >
                  Due Date (optional)
                </label>
                <input
                  id="dueDate"
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2"
                  style={{ 
                    border: `2px solid ${LIGHT_GREEN}`,
                    color: BROWN,
                    backgroundColor: PAGE_BG
                  }}
                />
              </div>

              <div>
                <label 
                  htmlFor="notes"
                  className="block text-sm font-semibold mb-2"
                  style={{ color: BROWN }}
                >
                  Notes (optional)
                </label>
                <textarea
                  id="notes"
                  value={newTask.notes}
                  onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
                  placeholder="Additional details..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 resize-none"
                  style={{ 
                    border: `2px solid ${LIGHT_GREEN}`,
                    color: BROWN,
                    backgroundColor: PAGE_BG
                  }}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewTask({ name: "", assignedToId: "", due_date: "", notes: "" });
                  }}
                  className="flex-1 px-4 py-3 rounded-xl font-semibold transition-colors"
                  style={{ 
                    backgroundColor: BEIGE,
                    color: BROWN,
                    border: `2px solid ${LIGHT_GREEN}`
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTask}
                  disabled={!newTask.name.trim()}
                  className="flex-1 px-4 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ 
                    backgroundColor: GREEN,
                    color: 'white'
                  }}
                >
                  Add Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TasksChoresPage() {
  return (
    <ProtectedRoute>
      <TasksChoresContent />
    </ProtectedRoute>
  );
}