import { authenticatedFetch } from './authService';

export interface Event {
  event_id: number;
  event_name: string;
  event_datetime_start: string;
  event_datetime_end?: string;
  event_location?: string;
  event_notes?: string;
}

export interface EventCreate {
  event_name: string;
  event_datetime_start: string;
  event_datetime_end?: string;
  event_location?: string;
  event_notes?: string;
  group_id?: number;
}

export async function createEvent(event: EventCreate): Promise<{ event_id: number }> {
  const response = await authenticatedFetch('/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  });

  if (!response.ok) {
    throw new Error('Failed to create event');
  }

  return response.json();
}

export async function getUserEvents(startDate?: string, endDate?: string): Promise<Event[]> {
  const params = new URLSearchParams();
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);

  const response = await authenticatedFetch(`/api/events?${params.toString()}`);

  if (!response.ok) {
    throw new Error('Failed to fetch events');
  }

  return response.json();
}

export async function deleteEvent(eventId: number): Promise<void> {
  const response = await authenticatedFetch(`/api/events/${eventId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete event');
  }
}