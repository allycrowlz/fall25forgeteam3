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
}

export interface CreateGroupData {
  group_name: string;
  group_photo?: string | null;
  profile_id: number;
}

export interface JoinGroupData {
  join_code: string;
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

// ==================== HELPER FUNCTIONS ====================

const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    let errorMessage = 'An error occurred';
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorData.message || errorMessage;
    } catch {
      // If response is not JSON, use status text
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }
  return response.json();
};

// ==================== GROUP FUNCTIONS ====================

export async function createGroup(data: CreateGroupData): Promise<Group> {
  const response = await fetch(`${API_BASE_URL}/groups`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  return handleResponse<Group>(response);
}

export async function joinGroup(
  joinCode: string,
  profileId: number
): Promise<JoinGroupResponse> {
  const response = await fetch(`${API_BASE_URL}/groups/join`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      join_code: joinCode.toUpperCase(),
      profile_id: profileId,
    }),
  });

  return handleResponse<JoinGroupResponse>(response);
}

export async function getUserGroups(): Promise<Group[]> {
  const response = await fetch(`${API_BASE_URL}/groups`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  return handleResponse<Group[]>(response);
}

export async function getGroup(groupId: number): Promise<Group> {
  const response = await fetch(`${API_BASE_URL}/groups/${groupId}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  return handleResponse<Group>(response);
}

export async function getGroupMembers(groupId: number): Promise<GroupMember[]> {
  const response = await fetch(`${API_BASE_URL}/groups/${groupId}/members`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  return handleResponse<GroupMember[]>(response);
}

export async function leaveGroup(groupId: number): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/groups/${groupId}/leave`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  return handleResponse<{ message: string }>(response);
}
