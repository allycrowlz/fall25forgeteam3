"use client";

import React, { useMemo, useState, useEffect } from "react";
import ProtectedRoute from '../components/ProtectedRoute';
import { createEvent, deleteEvent } from '../services/eventServices';
import { useGroup } from '../contexts/GroupContext';
import { getGroupMembers, getGroupEvents } from '../services/groupService';
import { ChevronLeft, ChevronRight, Plus, Trash2, Calendar as CalendarIcon, Clock, Cake, DollarSign } from 'lucide-react';

// Colors
const PAGE_BG = "#E8F3E9";
const BROWN = "#4C331D";
const GREEN = "#407947";
const LIGHT_GREEN = "#CFDFD1";
const BEIGE = "#DCCEBD";

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

interface CalEvent {
  event_id: number;
  id: string;
  event_name: string;
  event_datetime_start: string;
  event_datetime_end?: string;
  event_location?: string;
  event_notes?: string;
  profile_id?: number;
  group_id?: number;
}

type EventMap = Record<string, CalEvent[]>;

function CalendarContent() {
  const { currentGroup } = useGroup();
  const [viewDate, setViewDate] = useState(new Date());
  const [selected, setSelected] = useState<Date | null>(new Date());
  const [events, setEvents] = useState<EventMap>({});
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // form state
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");

  // Reset form when selected date changes
  useEffect(() => {
    setTitle("");
    setTime("");
    setNotes("");
    setShowAddForm(false);
  }, [selected]);

  // Check authentication status with more aggressive retry
  useEffect(() => {
    const checkAuth = () => {
      if (typeof window !== 'undefined') {
        const profileId = localStorage.getItem('profile_id');
        if (profileId) {
          console.log('✅ Authentication successful, profile_id:', profileId);
          setIsAuthenticated(true);
          return true;
        }
      }
      return false;
    };

    // Check immediately
    if (checkAuth()) {
      return;
    }

    console.log('⏳ Checking for authentication...');

    // Set up an interval to check more frequently
    const interval = setInterval(() => {
      setRetryCount(prev => prev + 1);
      if (checkAuth()) {
        clearInterval(interval);
      }
    }, 50);

    // Timeout after 5 seconds
    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (!isAuthenticated) {
        console.error('❌ Authentication timeout - profile_id not found in localStorage');
        setLoading(false);
      }
    }, 5000);

    // Clean up
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isAuthenticated]);

  // Load events on mount and when viewDate, currentGroup, or authentication changes
  useEffect(() => {
    async function loadEvents() {
      // Don't load events if no group is selected
      if (!currentGroup) {
        console.log('ℹ️ No group selected');
        setEvents({});
        setLoading(false);
        return;
      }

      // Wait for authentication
      if (!isAuthenticated) {
        console.log('⏳ Waiting for authentication... (attempt', retryCount, ')');
        return;
      }

      try {
        setLoading(true);
        console.log('🔄 Loading events for group:', currentGroup.group_name, 'ID:', currentGroup.group_id);
        
        // Expand date range to cover entire calendar view
        const firstDayOfCalendar = startOfWeek(startOfMonth(viewDate));
        const lastDayOfCalendar = addDays(firstDayOfCalendar, 41);
        
        console.log('📅 Date range:', {
          from: firstDayOfCalendar.toISOString(),
          to: lastDayOfCalendar.toISOString()
        });
        
        // Fetch events for the current group
        const fetchedEvents = await getGroupEvents(
          currentGroup.group_id,
          firstDayOfCalendar.toISOString(),
          lastDayOfCalendar.toISOString()
        );

        console.log('📥 Fetched events from API:', fetchedEvents);

        const eventMap: EventMap = {};
        
        // Track seen event_ids to avoid duplicates (same event for multiple profiles)
        const seenEventIds = new Set<number>();
        
        // Add fetched events
        fetchedEvents.forEach((event: any) => {
          const eventDate = new Date(event.event_datetime_start);
          const key = dateKey(eventDate);
                  
          const isExpenseEvent = event.event_location?.startsWith('EXPENSE:');
          
          // Skip if we've already added this event_id (it's the same event, just for a different profile)
          if (seenEventIds.has(event.event_id)) {
            console.log('⚠️ Skipping duplicate event_id:', event.event_id);
            return;
          }
          seenEventIds.add(event.event_id);
          
          // Create unique React key using event_id only
          const uniqueId = isExpenseEvent 
            ? `expense-${event.event_id}` 
            : `event-${event.event_id}`;
        
          const calEvent: CalEvent = {
            event_id: event.event_id,
            id: uniqueId,
            event_name: event.event_name,
            event_datetime_start: event.event_datetime_start,
            event_datetime_end: event.event_datetime_end,
            event_location: event.event_location,
            event_notes: event.event_notes,
            profile_id: event.profile_id,
            group_id: event.group_id ?? currentGroup.group_id,
          };
        
          console.log('✅ Processing event:', {
            name: calEvent.event_name,
            event_id: calEvent.event_id,
            unique_id: calEvent.id,
            group_id: calEvent.group_id,
            date: eventDate.toLocaleDateString(),
            key: key
          });
                  
          if (!eventMap[key]) {
            eventMap[key] = [];
          }
          eventMap[key].push(calEvent);
        });

        console.log('📊 Event map after processing fetched events:', eventMap);

        // Add birthday events for group members
        try {
          const members = await getGroupMembers(currentGroup.group_id);
          const currentYear = viewDate.getFullYear();
          
          members.forEach(member => {
            if (member.birthday) {
              // Parse birthday (format: YYYY-MM-DD)
              const [year, month, day] = member.birthday.split('-').map(Number);
              
              // Create birthday for current year
              const birthdayThisYear = new Date(currentYear, month - 1, day, 0, 0, 0);
              const key = dateKey(birthdayThisYear);
              
              console.log('🎂 Adding birthday:', {
                name: member.profile_name,
                date: birthdayThisYear.toLocaleDateString(),
                key: key
              });
              
              // Check if this date is in our current view
              if (birthdayThisYear >= firstDayOfCalendar && birthdayThisYear <= lastDayOfCalendar) {
                const birthdayEvent: CalEvent = {
                  event_id: -Math.abs(member.profile_id),
                  id: `birthday-${member.profile_id}-${currentYear}`,
                  event_name: `${member.profile_name}'s Birthday`,
                  event_datetime_start: birthdayThisYear.toISOString(),
                  event_notes: 'Birthday',
                  profile_id: member.profile_id,
                  group_id: currentGroup.group_id,
                };
                
                if (!eventMap[key]) {
                  eventMap[key] = [];
                }
                eventMap[key].push(birthdayEvent);
              }
            }
          });
        } catch (error) {
          console.error('❌ Failed to load birthdays:', error);
        }

        console.log('✅ Final event map:', eventMap);
        console.log('📈 Total event days:', Object.keys(eventMap).length);

        // Sort events within each day by time
        Object.keys(eventMap).forEach(key => {
          eventMap[key].sort((a, b) => {
            const timeA = new Date(a.event_datetime_start).getTime();
            const timeB = new Date(b.event_datetime_start).getTime();
            return timeA - timeB;
          });
        });

        setEvents(eventMap);
      } catch (error) {
        console.error('❌ Failed to load events:', error);
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, [viewDate, currentGroup, isAuthenticated, retryCount]);

  const monthMatrix = useMemo(() => {
    if (viewMode === 'week') {
      const start = startOfWeek(viewDate);
      return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    } else {
      const start = startOfWeek(startOfMonth(viewDate));
      return Array.from({ length: 42 }, (_, i) => addDays(start, i));
    }
  }, [viewDate, viewMode]);

  const displayTitle = useMemo(() => {
    if (viewMode === 'week') {
      const start = startOfWeek(viewDate);
      const end = addDays(start, 6);
      
      if (start.getMonth() === end.getMonth()) {
        return `${start.toLocaleString(undefined, { month: 'long' })} ${start.getDate()}-${end.getDate()}, ${start.getFullYear()}`;
      } else {
        return `${start.toLocaleString(undefined, { month: 'short', day: 'numeric' })} - ${end.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
      }
    } else {
      return viewDate.toLocaleString(undefined, { month: "long", year: "numeric" });
    }
  }, [viewDate, viewMode]);

  const goPrev = () => {
    if (viewMode === 'week') {
      setViewDate(addDays(viewDate, -7));
    } else {
      setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    }
  };
  
  const goNext = () => {
    if (viewMode === 'week') {
      setViewDate(addDays(viewDate, 7));
    } else {
      setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    }
  };
  
  const goToday = () => {
    const now = new Date();
    setViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelected(now);
  };

  const firstOfMonth = startOfMonth(viewDate);
  const lastOfMonth = endOfMonth(viewDate);
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
  const isOutsideView = (day: Date) => {
    if (viewMode === 'week') {
      const weekStart = startOfWeek(viewDate);
      const weekEnd = addDays(weekStart, 6);
      return day < weekStart || day > weekEnd;
    } else {
      return day < firstOfMonth || day > lastOfMonth;
    }
  };

  const selectedKey = selected ? dateKey(selected) : "";
  const selectedEvents: CalEvent[] = selected 
    ? (events[selectedKey] || []).sort((a, b) => {
        const timeA = new Date(a.event_datetime_start).getTime();
        const timeB = new Date(b.event_datetime_start).getTime();
        return timeA - timeB;
      })
    : [];

  async function handleAddEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !title.trim() || !currentGroup) return;

    try {
      const year = selected.getFullYear();
      const month = selected.getMonth();
      const day = selected.getDate();
      
      let hours = 12;
      let minutes = 0;
      
      if (time) {
        [hours, minutes] = time.split(':').map(Number);
      }
      
      // Create date in LOCAL timezone
      const eventDate = new Date(year, month, day, hours, minutes);
      
      console.log('📝 Creating event:', {
        title: title.trim(),
        localTime: eventDate.toString(),
        isoString: eventDate.toISOString(),
        group_id: currentGroup.group_id
      });

      const result = await createEvent({
        event_name: title.trim(),
        event_datetime_start: eventDate.toISOString(),
        event_notes: notes || undefined,
        group_id: currentGroup.group_id,
      });

      console.log('✅ Event created, response:', result);

      // Clear the form
      setTitle("");
      setTime("");
      setNotes("");
      setShowAddForm(false);
      
      // Force a reload of events by incrementing retry count
      // This will trigger the useEffect that fetches events
      setRetryCount(prev => prev + 1);
    } catch (error) {
      console.error('❌ Error creating event:', error);
      alert(error instanceof Error ? error.message : 'Failed to create event');
    }
  }

  async function removeEvent(eventId: string) {
    if (eventId.startsWith('birthday-') || eventId.startsWith('expense-')) {
      alert(eventId.startsWith('birthday-') 
        ? 'Birthday events cannot be deleted' 
        : 'Expense events are managed in the Expenses page');
      return;
    }
    
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      // Find the actual event to get the real event_id
      if (!selected) return;
      const key = dateKey(selected);
      const eventToDelete = events[key]?.find((ev) => ev.id === eventId);
      
      if (!eventToDelete) {
        console.error('❌ Event not found in state:', eventId);
        return;
      }
      
      console.log('🗑️ Deleting event:', {
        uniqueId: eventId,
        actualEventId: eventToDelete.event_id
      });
      
      await deleteEvent(eventToDelete.event_id);

      // Reload events from backend instead of manually filtering state
      setRetryCount(prev => prev + 1);
      
      console.log('✅ Event deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting event:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete event');
    }
  }

  if (!currentGroup) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: PAGE_BG }}>
        <div className="bg-white rounded-3xl shadow-lg p-12 border text-center max-w-md" style={{ borderColor: BROWN }}>
          <CalendarIcon className="h-16 w-16 mx-auto mb-4" style={{ color: GREEN }} />
          <h2 className="text-2xl font-bold mb-2" style={{ color: BROWN }}>No Group Selected</h2>
          <p className="text-gray-600 mb-6">Please select or create a group to view the calendar</p>
          <button
            onClick={() => window.location.href = '/groups'}
            className="px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-all shadow-md"
            style={{ backgroundColor: GREEN, color: "white" }}
          >
            Go to Groups
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: PAGE_BG }}>
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold" style={{ color: GREEN }}>Calendar</h1>
              <p className="text-sm mt-1" style={{ color: BROWN }}>
                Showing events for <span className="font-semibold">{currentGroup.group_name}</span>
              </p>
            </div>
            <button
              onClick={goToday}
              className="px-5 py-2.5 rounded-xl font-semibold hover:opacity-90 transition-all shadow-md"
              style={{ backgroundColor: GREEN, color: "white" }}
            >
              Today
            </button>
          </div>

          {/* Month Navigation */}
          <div className="bg-white rounded-3xl shadow-lg p-6 border" style={{ borderColor: BROWN }}>
            <div className="flex items-center justify-between">
              <button
                onClick={goPrev}
                className="p-2 rounded-lg hover:opacity-80 transition-all"
                style={{ color: BROWN, backgroundColor: BEIGE }}
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              
              <div className="flex items-center gap-4">
                <CalendarIcon className="h-6 w-6" style={{ color: GREEN }} />
                <h2 className="text-2xl font-bold" style={{ color: BROWN }}>{displayTitle}</h2>
                
                {/* View Toggle */}
                <div className="flex rounded-lg border-2 overflow-hidden" style={{ borderColor: BROWN }}>
                  <button
                    onClick={() => setViewMode('month')}
                    className="px-4 py-1.5 text-sm font-semibold transition-all"
                    style={{
                      backgroundColor: viewMode === 'month' ? GREEN : 'white',
                      color: viewMode === 'month' ? 'white' : BROWN,
                    }}
                  >
                    Month
                  </button>
                  <button
                    onClick={() => setViewMode('week')}
                    className="px-4 py-1.5 text-sm font-semibold transition-all border-l-2"
                    style={{
                      backgroundColor: viewMode === 'week' ? GREEN : 'white',
                      color: viewMode === 'week' ? 'white' : BROWN,
                      borderColor: BROWN,
                    }}
                  >
                    Week
                  </button>
                </div>
              </div>
              
              <button
                onClick={goNext}
                className="p-2 rounded-lg hover:opacity-80 transition-all"
                style={{ color: BROWN, backgroundColor: BEIGE }}
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-lg p-6 border" style={{ borderColor: BROWN }}>
              {/* Weekday headers */}
              <div className="grid grid-cols-7 mb-4">
                {weekDays.map((day) => (
                  <div key={day} className="text-center py-3 font-semibold text-sm" style={{ color: BROWN }}>
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className={`grid gap-2 ${viewMode === 'week' ? 'grid-cols-7' : 'grid-cols-7'}`}>
                {monthMatrix.map((day, i) => {
                  const outside = isOutsideView(day);
                  const isToday = isSameDay(day, new Date());
                  const isSelected = selected && isSameDay(day, selected);
                  const dayEvents = events[dateKey(day)] || [];
                  const hasEvents = dayEvents.length > 0;

                  return (
                    <button
                      key={i}
                      onClick={() => setSelected(day)}
                      className={`rounded-xl border-2 p-3 transition-all hover:shadow-md relative ${viewMode === 'week' ? 'h-32' : 'h-24'}`}
                      style={{
                        borderColor: BROWN,
                        backgroundColor: isSelected ? BEIGE : outside ? "#fafafa" : "white",
                        opacity: outside ? 0.5 : 1,
                      }}
                    >
                      <div className="flex flex-col h-full">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`font-semibold ${viewMode === 'week' ? 'text-base' : 'text-sm'}`} style={{ color: BROWN }}>
                            {day.getDate()}
                          </span>
                          {isToday && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ backgroundColor: GREEN, color: "white" }}>
                              Today
                            </span>
                          )}
                        </div>
                        
                        {/* Event indicator dots */}
                        {hasEvents && (
                          <div className="mt-auto flex items-center justify-center gap-1">
                            {dayEvents.slice(0, 3).map((ev, idx) => (
                              <div
                                key={`${ev.id}-dot-${idx}`}
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: GREEN }}
                              />
                            ))}
                            {dayEvents.length > 3 && (
                              <span className="text-[10px] font-semibold ml-1" style={{ color: GREEN }}>
                                +{dayEvents.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Events Panel */}
          <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            {/* Selected Date Info */}
            <div className="bg-white rounded-3xl shadow-lg p-6 border" style={{ borderColor: BROWN }}>
              <h3 className="text-lg font-bold mb-3" style={{ color: BROWN }}>
                {selected ? (
                  <>
                    {selected.toLocaleDateString(undefined, { weekday: 'long' })},<br />
                    {selected.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                  </>
                ) : (
                  'Select a date'
                )}
              </h3>
              
              {selected && (
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold hover:opacity-90 transition-all shadow-md"
                  style={{ backgroundColor: GREEN, color: "white" }}
                >
                  <Plus className="h-5 w-5" />
                  Add Event
                </button>
              )}
            </div>

            {/* Add Event Form */}
            {showAddForm && selected && (
              <div className="bg-white rounded-3xl shadow-lg p-6 border" style={{ borderColor: BROWN }}>
                <h3 className="text-lg font-bold mb-4" style={{ color: BROWN }}>New Event</h3>
                <form onSubmit={handleAddEvent} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: BROWN }}>Event Title</label>
                    <input
                      type="text"
                      placeholder="Enter event title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border-2 focus:outline-none focus:ring-2 bg-white"
                      style={{ borderColor: BROWN, color: BROWN }}
                      autoComplete="off"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: BROWN }}>Time</label>
                    <input
                      type="text"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      placeholder="12:00 or 14:30"
                      className="w-full px-4 py-2.5 rounded-xl border-2 focus:outline-none focus:ring-2 bg-white"
                      style={{ borderColor: BROWN, color: BROWN }}
                      pattern="[0-9]{1,2}:[0-9]{2}"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: BROWN }}>Notes (optional)</label>
                    <textarea
                      placeholder="Add notes..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2.5 rounded-xl border-2 resize-none focus:outline-none focus:ring-2 bg-white"
                      style={{ borderColor: BROWN, color: BROWN }}
                      autoComplete="off"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false);
                        setTitle("");
                        setTime("");
                        setNotes("");
                      }}
                      className="flex-1 px-4 py-2.5 border-2 rounded-xl font-semibold hover:opacity-80 transition-all"
                      style={{ borderColor: BROWN, color: BROWN, backgroundColor: "white" }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!title.trim()}
                      className="flex-1 px-4 py-2.5 rounded-xl font-semibold hover:opacity-90 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: GREEN, color: "white" }}
                    >
                      Add Event
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Events List */}
            <div className="bg-white rounded-3xl shadow-lg p-6 border" style={{ borderColor: BROWN }}>
              <h3 className="text-lg font-bold mb-4" style={{ color: BROWN }}>
                Events {selected && `(${selectedEvents.length})`}
              </h3>
              
              {loading ? (
                <div className="space-y-3">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="h-20 rounded-xl animate-pulse" style={{ backgroundColor: BEIGE }} />
                  ))}
                </div>
              ) : selectedEvents.length === 0 ? (
                <div className="text-center py-8 rounded-xl" style={{ backgroundColor: BEIGE }}>
                  <p className="font-medium" style={{ color: BROWN }}>No events</p>
                  <p className="text-sm mt-1" style={{ color: BROWN }}>Click "Add Event" to create one</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {selectedEvents.map((ev) => {
                    const eventDate = new Date(ev.event_datetime_start);
                    const hours = eventDate.getHours();
                    const minutes = eventDate.getMinutes();
                    const ampm = hours >= 12 ? 'PM' : 'AM';
                    const displayHours = hours % 12 || 12;
                    const timeStr = `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
                    
                    return (
                      <li key={ev.id} className="rounded-xl border-2 p-4" style={{ borderColor: BROWN, backgroundColor: BEIGE }}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {ev.id.toString().startsWith('birthday-') && (
                              <Cake className="h-8 w-8 flex-shrink-0" style={{ color: GREEN }} />
                            )}
                            {ev.id.toString().startsWith('expense-') && (
                              <DollarSign className="h-5 w-5 flex-shrink-0" style={{ color: GREEN }} />
                            )}
                            <h4 className="font-bold text-lg" style={{ color: BROWN }}>{ev.event_name}</h4>
                          </div>
                          {!ev.id.toString().startsWith('birthday-') && !ev.id.toString().startsWith('expense-') && (
                            <button
                              onClick={() => removeEvent(ev.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              aria-label="Delete event"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        
                        {!ev.id.toString().startsWith('birthday-') && (
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="h-4 w-4" style={{ color: GREEN }} />
                            <span className="text-sm font-medium" style={{ color: BROWN }}>{timeStr}</span>
                          </div>
                        )}
                        
                        {ev.event_notes && ev.event_notes !== 'Birthday' && (
                          <p className="text-sm mt-2 p-2 rounded-lg" style={{ backgroundColor: "white", color: BROWN }}>
                            {ev.event_notes}
                          </p>
                        )}
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