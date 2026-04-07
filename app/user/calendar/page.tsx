"use client";

import { CalendarView } from "@/components/calendar-view";

export default function UserCalendarPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Live Calendar</h1>
        <p className="mt-1 text-text-secondary">Approved reservations are shown here.</p>
      </div>
      <CalendarView />
    </div>
  );
}
