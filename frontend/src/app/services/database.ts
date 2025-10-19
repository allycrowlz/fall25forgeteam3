
export async function getUserGroups(profile_id: number) {
    const response = await fetch(`/api/groups/profile_id=${profile_id}`);
    if (!response.ok) throw new Error("Failed to fetch groups.")
    return response.json();
}