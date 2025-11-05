"use client";

import React, { useMemo, useState } from "react";
import ProtectedRoute from '../components/ProtectedRoute';

// Colors
const PAGE_BG = "#E8F3E9"; // page background
const ACCENT = "#4C331D"; // brown accent
const ACCENT_ALT = "#407947"; // green accent used in Tasks

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}
function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 Sun .. 6 Sat
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

type CalEvent = { id: string; title: string; time?: string; notes?: string };

type EventMap = Record<string, CalEvent[]>; // keyed by YYYY-MM-DD

function CalendarContent() {
  const [viewDate, setViewDate] = useState(new Date());
  const [selected, setSelected] = useState<Date | null>(new Date());
  const [events, setEvents] = useState<EventMap>({});

  // form state
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");

  const monthMatrix = useMemo(() => {
    const start = startOfWeek(startOfMonth(viewDate));
    // always render 6 rows * 7 days = 42 cells
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

  function handleAddEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    if (!title.trim()) return;

    const key = dateKey(selected);
    const newEvent: CalEvent = {
      id: Math.random().toString(36).slice(2),
      title: title.trim(),
      time: time || undefined,
      notes: notes || undefined,
    };

    setEvents((prev) => ({
      ...prev,
      [key]: [ ...(prev[key] || []), newEvent ],
    }));

    // clear form
    setTitle("");
    setTime("");
    setNotes("");
  }

  function removeEvent(id: string) {
    if (!selected) return;
    const key = dateKey(selected);
    setEvents((prev) => ({
      ...prev,
      [key]: (prev[key] || []).filter((ev) => ev.id !== id),
    }));
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
              className="rounded-full px-4 py-2 border-2"
              style={{ borderColor: ACCENT, color: ACCENT }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = PAGE_BG)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
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
              className="rounded-full px-4 py-2 border-2"
              style={{ borderColor: ACCENT, color: ACCENT }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = PAGE_BG)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
            >
              ▶
            </button>
          </div>
        </div>

        {/* Calendar + Add Event panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2">
        {/* Calendar column */}
        <div className="lg:col-span-2">
            {/* Weekday headers (moved here to align with grid) */}
            <div className="grid grid-cols-7 text-sm font-medium mt-6" style={{ color: ACCENT }}>
            {weekDays.map((d) => (
                <div key={d} className="text-center py-2">{d}</div>
            ))}
            </div>

            {/* Calendar grid (unchanged below) */}
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
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 rounded-full border-2 focus:outline-none"
                style={{ borderColor: ACCENT, color: ACCENT }}
                onFocus={(e) => (e.currentTarget.style.borderColor = ACCENT_ALT)}
                onBlur={(e) => (e.currentTarget.style.borderColor = ACCENT)}
              />
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-4 py-2 rounded-full border-2 focus:outline-none"
                style={{ borderColor: ACCENT, color: ACCENT }}
                onFocus={(e) => (e.currentTarget.style.borderColor = ACCENT_ALT)}
                onBlur={(e) => (e.currentTarget.style.borderColor = ACCENT)}
              />
              <textarea
                placeholder="Notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 rounded-2xl border-2 resize-none focus:outline-none"
                style={{ borderColor: ACCENT, color: ACCENT }}
                onFocus={(e) => (e.currentTarget.style.borderColor = ACCENT_ALT)}
                onBlur={(e) => (e.currentTarget.style.borderColor = ACCENT)}
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
              {selectedEvents.length === 0 ? (
                <p className="text-sm" style={{ color: ACCENT }}>No events yet.</p>
              ) : (
                <ul className="space-y-2">
                  {selectedEvents.map((ev) => (
                    <li key={ev.id} className="rounded-lg border-2 px-3 py-2 flex items-start gap-3" style={{ borderColor: ACCENT, background: "#FFFFFF" }}>
                      <div className="mt-1 w-2 h-2 rounded-full" style={{ background: ACCENT_ALT }} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium" style={{ color: ACCENT }}>{ev.title}</span>
                          {ev.time && <span className="text-sm" style={{ color: ACCENT }}>{ev.time}</span>}
                        </div>
                        {ev.notes && <p className="text-sm mt-1" style={{ color: ACCENT }}>{ev.notes}</p>}
                      </div>
                      <button
                        onClick={() => removeEvent(ev.id)}
                        className="text-xs rounded-full px-2 py-1 border-2"
                        style={{ borderColor: ACCENT, color: ACCENT }}
                      >
                        Delete
                      </button>
                    </li>
                  ))}
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
