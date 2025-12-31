// frontend/services/eventService.ts

import { authenticatedFetch } from "./authService";

export interface Event {
  event_id: number;
  event_name: string;
  event_datetime_start: string;
  event_datetime_end?: string;
  event_location?: string;
  event_notes?: string;
  group_id?: number;
  profile_id?: number;
}

export interface EventCreate {
  event_name: string;
  event_datetime_start: string; // ISO string
  event_datetime_end?: string;
  event_location?: string;
  event_notes?: string;
  group_id?: number;
}

export async function createEvent(
  event: EventCreate
): Promise<{ event_id: number; group_id?: number }> {
  const response = await authenticatedFetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
  });

  if (!response.ok) {
    throw new Error("Failed to create event");
  }

  return response.json();
}

export async function getUserEvents(
  startDate?: string,
  endDate?: string
): Promise<Event[]> {
  const params = new URLSearchParams();
  if (startDate) params.append("start_date", startDate);
  if (endDate) params.append("end_date", endDate);

  const response = await authenticatedFetch(`/api/events?${params.toString()}`, {});

  if (!response.ok) {
    throw new Error("Failed to fetch events");
  }

  return response.json();
}

export async function deleteEvent(eventId: number): Promise<void> {
  const response = await authenticatedFetch(`/api/events/${eventId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete event");
  }
}

export async function getGroupEvents(
  groupId: number,
  startDate: string,
  endDate: string
): Promise<Event[]> {
  const profileId = localStorage.getItem("profile_id");
  if (!profileId) {
    throw new Error("Not authenticated");
  }

  const params = new URLSearchParams({
    start: startDate,
    end: endDate,
    profile_id: profileId,
  });

  const response = await authenticatedFetch(
    `/api/groups/${groupId}/events?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch group events");
  }

  return response.json();
}
