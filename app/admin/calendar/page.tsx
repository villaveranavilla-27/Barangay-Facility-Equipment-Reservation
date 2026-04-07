"use client";

import { CalendarView } from "@/components/calendar-view";

export default function AdminCalendarPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Live Calendar</h1>
        <p className="mt-1 text-text-secondary">Click a booked slot to see request details.</p>
      </div>
      <CalendarView />
    </div>
  );
}
