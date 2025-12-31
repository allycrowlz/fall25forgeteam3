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
  
  export interface Group {
    group_id: number;
    group_name: string;
    date_created: string;
    group_photo: string | null;
    join_code: string;
    role: string;
    is_creator: boolean;
  }
  
  export interface GroupMember {
    profile_id: number;
    profile_name: string;
    email: string;
    picture: string | null;
    role: string;
    is_creator: boolean;
    birthday?: string | null;
  }
  
  export interface CreateGroupData {
    group_name: string;
    group_photo?: string | null;
    profile_id: number;
  }
  
  export interface JoinGroupResponse {
    message: string;
    group: {
      group_id: number;
      group_name: string;
      group_photo: string | null;
    };
  }
  
  // ==================== GROUP FUNCTIONS ====================
  
  export async function createGroup(data: CreateGroupData): Promise<Group> {
    const response = await fetch(`${API_BASE_URL}/groups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to create group');
    }
  
    return response.json();
  }
  
  export async function joinGroup(
    joinCode: string,
    profileId: number
  ): Promise<JoinGroupResponse> {
    const response = await fetch(`${API_BASE_URL}/groups/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        join_code: joinCode, 
        profile_id: profileId 
      }),
    });
  
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to join group');
    }
  
    return response.json();
  }
  
  export async function getUserGroups(profileId: number): Promise<Group[]> {
    const response = await fetch(`${API_BASE_URL}/groups?profile_id=${profileId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to fetch groups');
    }
  
    return response.json();
  }
  
  export async function getGroup(groupId: number, profileId: number): Promise<Group> {
    const response = await fetch(`${API_BASE_URL}/groups/${groupId}?profile_id=${profileId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to fetch group');
    }
  
    return response.json();
  }
  
  export async function getGroupMembers(groupId: number): Promise<GroupMember[]> {
    const response = await fetch(`${API_BASE_URL}/groups/${groupId}/members`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to fetch group members');
    }
  
    return response.json();
  }
  
  export async function updateGroup(
    groupId: number,
    profileId: number,
    data: { group_name: string; group_photo?: string | null }
  ): Promise<Group> {
    const response = await fetch(`${API_BASE_URL}/groups/${groupId}?profile_id=${profileId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to update group');
    }
  
    return response.json();
  }
  
  export async function regenerateJoinCode(
    groupId: number,
    profileId: number
  ): Promise<{ join_code: string }> {
    const response = await fetch(`${API_BASE_URL}/groups/${groupId}/regenerate-code?profile_id=${profileId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to regenerate code');
    }
  
    return response.json();
  }
  
  export async function leaveGroup(groupId: number, profileId: number): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/groups/${groupId}/leave?profile_id=${profileId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to leave group');
    }
  
    return response.json();
  }
  
  export async function removeMember(
    groupId: number,
    userId: number,
    profileId: number
  ): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/groups/${groupId}/members/${userId}?profile_id=${profileId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to remove member');
    }
  
    return response.json();
  }

  export async function deleteGroup(
    groupId: number,
    profileId: number
  ): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/groups/${groupId}?profile_id=${profileId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to delete group');
    }
  
    return response.json();
  }

// Add this interface and function to your existing groupService.ts

export interface GroupEvent {
  event_id: number;
  event_name: string;
  event_datetime_start: string;
  event_datetime_end?: string;
  event_location?: string;
  event_notes?: string;
  profile_id?: number;
  group_id?: number;        
}

export async function getGroupEvents(
    groupId: number,
    start: string,
    end: string
  ): Promise<GroupEvent[]> {
    if (typeof window === 'undefined') {
      return [];
    }
  
    const profileId = localStorage.getItem('profile_id');
    if (!profileId) {
      console.warn('No profile_id found in localStorage');
      return [];
    }
  
    const response = await fetch(
      `http://localhost:8000/api/groups/${groupId}/events?start=${start}&end=${end}&profile_id=${profileId}`
    );
  

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: 'Failed to fetch group events' }));
      console.error('Error response:', error);
      return [];
    }

    const data = await response.json();
    console.log('📦 Raw group events from API:', data);
    return data as GroupEvent[]; 
}