const API_BASE_URL = 'http://localhost:8000/api';

export interface Group {
    group_id: number;
    group_name: string;
    group_photo?: string;
}

export interface JoinGroupResponse {
    message: string;
    group: Group;
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
        body: JSON.stringify({ join_code: joinCode, profile_id: profileId }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to join group');
    }

    return response.json();
}

