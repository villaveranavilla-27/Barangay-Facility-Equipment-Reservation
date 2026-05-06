"use client";

import { CalendarView } from "@/components/calendar-view";

export default function UserCalendarPage() {
  return (
    <div className="space-y-6">
      <div className="app-page__header">
        <h1 className="app-page__title">Calendar</h1>
        <p className="app-page__description">
          View and manage all upcoming events and reservations.
        </p>
      </div>

      <CalendarView />
    </div>
  );
}
