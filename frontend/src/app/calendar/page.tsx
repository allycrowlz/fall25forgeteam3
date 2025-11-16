"use client";

import React, { useMemo, useState, useEffect } from "react";
import ProtectedRoute from '../components/ProtectedRoute';
import { createEvent, getUserEvents, deleteEvent, Event } from '../services/eventService';
import { getCurrentUser } from '../services/authService';

// Colors
const PAGE_BG = "#E8F3E9";
const ACCENT = "#4C331D";
const ACCENT_ALT = "#407947";

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}
function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}
function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function dateKey(d: Date) {
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-");
}

type CalEvent = Event & { id: string };
type EventMap = Record<string, CalEvent[]>;

function CalendarContent() {
  const [viewDate, setViewDate] = useState(new Date());
  const [selected, setSelected] = useState<Date | null>(new Date());
  const [events, setEvents] = useState<EventMap>({});
  const [loading, setLoading] = useState(true);
  const [groupId, setGroupId] = useState<number | null>(null);

  // form state
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");

  // Reset form when selected date changes
  useEffect(() => {
    setTitle("");
    setTime("");
    setNotes("");
  }, [selected]);

  // Load events on mount
  useEffect(() => {
    async function loadEvents() {
      try {
        setLoading(true);
        const user = await getCurrentUser();
        
        // Get events for the current month
        const start = startOfMonth(viewDate);
        const end = endOfMonth(viewDate);
        
        const fetchedEvents = await getUserEvents(
          start.toISOString(),
          end.toISOString()
        );

        // Convert to event map
        const eventMap: EventMap = {};
        fetchedEvents.forEach((event) => {
          // Parse the datetime string directly without timezone conversion
          const eventDate = new Date(event.event_datetime_start);
          const key = dateKey(eventDate);
          
          const calEvent: CalEvent = {
            ...event,
            id: event.event_id.toString(),
          };
          
          if (!eventMap[key]) {
            eventMap[key] = [];
          }
          eventMap[key].push(calEvent);
        });

        setEvents(eventMap);
        console.log('Loaded events:', eventMap);
      } catch (error) {
        console.error('Failed to load events:', error);
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, [viewDate]);

  const monthMatrix = useMemo(() => {
    const start = startOfWeek(startOfMonth(viewDate));
    return Array.from({ length: 42 }, (_, i) => addDays(start, i));
  }, [viewDate]);

  const monthName = viewDate.toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });

  const goPrev = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const goNext = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  const goToday = () => {
    const now = new Date();
    setViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelected(now);
  };

  const firstOfMonth = startOfMonth(viewDate);
  const lastOfMonth = endOfMonth(viewDate);
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const selectedKey = selected ? dateKey(selected) : "";
  const selectedEvents: CalEvent[] = selected ? events[selectedKey] || [] : [];

  async function handleAddEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !title.trim()) return;

    try {
      // Create datetime in local timezone
      const year = selected.getFullYear();
      const month = selected.getMonth();
      const day = selected.getDate();
      
      let hours = 12; // Default to noon
      let minutes = 0;
      
      if (time) {
        [hours, minutes] = time.split(':').map(Number);
      }
      
      // Create date in local timezone
      const eventDate = new Date(year, month, day, hours, minutes);

      const result = await createEvent({
        event_name: title.trim(),
        event_datetime_start: eventDate.toISOString(),
        event_notes: notes || undefined,
        group_id: groupId || undefined,
      });

      // Add to local state
      const key = dateKey(selected);
      const newEvent: CalEvent = {
        event_id: result.event_id,
        id: result.event_id.toString(),
        event_name: title.trim(),
        event_datetime_start: eventDate.toISOString(),
        event_notes: notes || undefined,
      };

      setEvents((prev) => ({
        ...prev,
        [key]: [...(prev[key] || []), newEvent],
      }));

      // Clear form
      setTitle("");
      setTime("");
      setNotes("");
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to create event');
    }
  }

  async function removeEvent(eventId: string) {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      await deleteEvent(parseInt(eventId));

      // Remove from local state
      if (!selected) return;
      const key = dateKey(selected);
      setEvents((prev) => ({
        ...prev,
        [key]: (prev[key] || []).filter((ev) => ev.id !== eventId),
      }));
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete event');
    }
  }

  return (
    <div className="min-h-screen px-6 pb-12" style={{ backgroundColor: PAGE_BG }}>
      <div className="max-w-5xl mx-auto relative rounded-lg p-2 pt-6">
        {/* Header controls */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-4">
          <h2 className="text-xl font-semibold" style={{ color: ACCENT }}>{monthName}</h2>

          <div className="flex items-center gap-3">
            <button
              onClick={goPrev}
              className="rounded-full px-4 py-2 border-2 bg-white hover:opacity-80"
              style={{ borderColor: ACCENT, color: ACCENT }}
            >
              ◀
            </button>
            <button
              onClick={goToday}
              className="rounded-full px-4 py-2 border-2 font-medium"
              style={{ borderColor: ACCENT, color: "white", backgroundColor: ACCENT_ALT }}
            >
              Today
            </button>
            <button
              onClick={goNext}
              className="rounded-full px-4 py-2 border-2 bg-white hover:opacity-80"
              style={{ borderColor: ACCENT, color: ACCENT }}
            >
              ▶
            </button>
          </div>
        </div>

        {/* Calendar + Add Event panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2">
          {/* Calendar column */}
          <div className="lg:col-span-2">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 text-sm font-medium mt-6" style={{ color: ACCENT }}>
              {weekDays.map((d) => (
                <div key={d} className="text-center py-2">{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-2">
              {monthMatrix.map((day, i) => {
                const outside = day < firstOfMonth || day > lastOfMonth;
                const isToday = isSameDay(day, new Date());
                const isSelected = selected && isSameDay(day, selected);
                const hasEvents = (events[dateKey(day)] || []).length > 0;

                return (
                  <button
                    key={i}
                    onClick={() => setSelected(day)}
                    className="aspect-square rounded-lg border-2 flex flex-col p-2 transition"
                    style={{
                      borderColor: ACCENT,
                      backgroundColor: isSelected ? "#DCCEBD" : "white",
                      alignItems: "flex-end",
                    }}
                  >
                    <span className="text-sm" style={{ color: ACCENT }}>{day.getDate()}</span>
                    <div className="mt-auto w-full flex items-center justify-between">
                      {isToday && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: ACCENT_ALT, color: "white" }}>
                          today
                        </span>
                      )}
                      {hasEvents && <span className="ml-auto w-2 h-2 rounded-full" style={{ background: ACCENT }} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Add Event panel */}
          <div className="rounded-xl p-4 border-2" style={{ borderColor: ACCENT, background: "white" }}>
            <h3 className="text-lg font-semibold mb-3" style={{ color: ACCENT }}>Add event</h3>
            <p className="text-sm mb-3" style={{ color: ACCENT }}>
              {selected ? (
                <>For <span className="font-medium">{selected.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</span></>
              ) : (
                <>Pick a date to add an event.</>
              )}
            </p>

            <form onSubmit={handleAddEvent} className="space-y-3">
              <input
                type="text"
                placeholder="Event title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 rounded-full border-2 focus:outline-none focus:border-opacity-100"
                style={{ borderColor: ACCENT, color: ACCENT }}
                autoComplete="off"
              />
              <input
                type="text"
                value={time}
                onChange={(e) => {
                  console.log('Time input changed to:', e.target.value);
                  setTime(e.target.value);
                }}
                placeholder="Time (e.g., 12:31 or 14:30)"
                className="w-full px-4 py-2 rounded-full border-2 focus:outline-none focus:border-opacity-100"
                style={{ borderColor: ACCENT, color: ACCENT }}
                pattern="[0-9]{1,2}:[0-9]{2}"
              />
              <textarea
                placeholder="Notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 rounded-2xl border-2 resize-none focus:outline-none focus:border-opacity-100"
                style={{ borderColor: ACCENT, color: ACCENT }}
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={!selected || !title.trim()}
                className="w-full rounded-full px-4 py-2 border-2 font-medium disabled:opacity-60"
                style={{ borderColor: ACCENT_ALT, backgroundColor: ACCENT_ALT, color: "white" }}
              >
                Add event
              </button>
            </form>

            {/* Events list for selected date */}
            <div className="mt-5">
              <h4 className="font-medium mb-2" style={{ color: ACCENT }}>Events this day</h4>
              {loading ? (
                <p className="text-sm" style={{ color: ACCENT }}>Loading...</p>
              ) : selectedEvents.length === 0 ? (
                <p className="text-sm" style={{ color: ACCENT }}>No events yet.</p>
              ) : (
                <ul className="space-y-2">
                  {selectedEvents.map((ev) => {
                    // Parse the ISO string from the database
                    const eventDate = new Date(ev.event_datetime_start);
                    console.log('Event from DB:', ev.event_datetime_start, 'Parsed as:', eventDate.toString());
                    
                    // Format time as HH:MM AM/PM in local timezone
                    const hours = eventDate.getHours();
                    const minutes = eventDate.getMinutes();
                    const ampm = hours >= 12 ? 'PM' : 'AM';
                    const displayHours = hours % 12 || 12;
                    const timeStr = `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
                    
                    return (
                      <li key={ev.id} className="rounded-lg border-2 px-3 py-2 flex items-start gap-3" style={{ borderColor: ACCENT, background: "#FFFFFF" }}>
                        <div className="mt-1 w-2 h-2 rounded-full" style={{ background: ACCENT_ALT }} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium" style={{ color: ACCENT }}>{ev.event_name}</span>
                            <span className="text-sm" style={{ color: ACCENT }}>{timeStr}</span>
                          </div>
                          {ev.event_notes && <p className="text-sm mt-1" style={{ color: ACCENT }}>{ev.event_notes}</p>}
                        </div>
                        <button
                          onClick={() => removeEvent(ev.id)}
                          className="text-xs rounded-full px-2 py-1 border-2 hover:bg-red-50"
                          style={{ borderColor: ACCENT, color: ACCENT }}
                        >
                          Delete
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CalendarPage() {
  return (
    <ProtectedRoute>
      <CalendarContent />
    </ProtectedRoute>
  );
}