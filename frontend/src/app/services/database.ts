
export async function getUserGroups(profileId: number) {
    const response = await fetch(`/api/groups/profile_id=${profileId}`);
    if (!response.ok) throw new Error("Failed to fetch groups.")
    return response.json();
}

export async function getGroupMembers(groupId : number) {
    const response = await fetch(`api/groups/${groupId}/members`);
    if (!response.ok) throw new Error("Failed to fetch groups.")
    return response.json();
}