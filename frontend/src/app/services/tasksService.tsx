// Automatically detect backend URL based on current hostname
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    return `http://${hostname}:8000/api`;
  }
  return 'http://localhost:8000/api';
};

const API_BASE_URL = getApiBaseUrl();

// ==================== INTERFACES ====================

export interface ChoreAssignee {
  profile_id: number;
  profile_name: string;
  status: 'pending' | 'completed';
}

export interface Chore {
  chore_id: number;
  group_id: number;
  name: string;
  category: string | null;
  assigned_date: string;
  due_date: string | null;
  notes: string | null;
  assignees?: ChoreAssignee[];
  individual_status?: 'pending' | 'completed'; // For user's own status when fetched via profile
}

export interface CreateChoreData {
  group_id: number;
  name: string;
  category?: string | null;
  due_date?: string | null;
  notes?: string | null;
}

export interface AssignChoreData {
  profile_id: number;
}

export interface UpdateChoreStatusData {
  status: 'pending' | 'completed';
}

// ==================== CHORE FUNCTIONS ====================

// Get all chores for a group (with assignees)
export async function getGroupChores(groupId: number): Promise<Chore[]> {
  const response = await fetch(`${API_BASE_URL}/groups/${groupId}/chores/detailed`);
  if (!response.ok) {
    throw new Error(`Failed to fetch chores: ${response.statusText}`);
  }
  return response.json();
}

// Get all chores assigned to current user
export async function getUserChores(profileId: number): Promise<Chore[]> {
  const response = await fetch(`${API_BASE_URL}/profiles/${profileId}/chores`);
  if (!response.ok) {
    throw new Error(`Failed to fetch user chores: ${response.statusText}`);
  }
  return response.json();
}

// Get a single chore by ID
export async function getChore(choreId: number): Promise<Chore> {
  const response = await fetch(`${API_BASE_URL}/chores/${choreId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch chore: ${response.statusText}`);
  }
  return response.json();
}

// Create a new chore
export async function createChore(data: CreateChoreData): Promise<Chore> {
  const response = await fetch(`${API_BASE_URL}/chores`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || `Failed to create chore: ${response.statusText}`);
  }
  return response.json();
}

// Update a chore
export async function updateChore(choreId: number, data: CreateChoreData): Promise<Chore> {
  const response = await fetch(`${API_BASE_URL}/chores/${choreId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || `Failed to update chore: ${response.statusText}`);
  }
  return response.json();
}

// Delete a chore
export async function deleteChore(choreId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/chores/${choreId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || `Failed to delete chore: ${response.statusText}`);
  }
}

// Assign a chore to a profile
export async function assignChore(choreId: number, profileId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/chores/${choreId}/assign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ profile_id: profileId }),
  });
  if (!response.ok) {
    let errorMessage = `Failed to assign chore: ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (typeof errorData.detail === 'string') {
        errorMessage = errorData.detail;
      } else if (typeof errorData === 'string') {
        errorMessage = errorData;
      } else if (errorData.message) {
        errorMessage = errorData.message;
      } else {
        errorMessage = JSON.stringify(errorData);
      }
    } catch (e) {
      // If response isn't JSON, use the status text
    }
    throw new Error(errorMessage);
  }
  // Even if response is ok, check if it's already assigned (not an error, just info)
  const data = await response.json();
  if (data.already_assigned) {
    console.log('Chore already assigned to this profile');
  }
}

// Unassign a chore from a profile
export async function unassignChore(choreId: number, profileId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/chores/${choreId}/unassign/${profileId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || `Failed to unassign chore: ${response.statusText}`);
  }
}

// Toggle chore status (pending <-> completed)
export async function toggleChoreStatus(choreId: number, profileId: number): Promise<{ new_status: string }> {
  const response = await fetch(`${API_BASE_URL}/chores/${choreId}/toggle/${profileId}`, {
    method: 'PATCH',
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || `Failed to toggle chore status: ${response.statusText}`);
  }
  const data = await response.json();
  return { new_status: data.new_status };
}

// Update chore status explicitly
export async function updateChoreStatus(
  choreId: number,
  profileId: number,
  status: 'pending' | 'completed'
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/chores/${choreId}/status/${profileId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || `Failed to update chore status: ${response.statusText}`);
  }
}

