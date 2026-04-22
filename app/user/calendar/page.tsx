"use client";

import { CalendarView } from "@/components/calendar-view";

export default function UserCalendarPage() {
  return (
    <div className="-m-6 min-h-full bg-[#f4f1eb] px-8 py-7">
      <div className="mx-auto max-w-[1500px] space-y-8">
        <div>
          <h1 className="text-[2.35rem] font-semibold tracking-[-0.03em] text-[#11233d]">
            Calendar
          </h1>
          <p className="mt-2 text-base font-medium text-[#6b7280]">
            View and manage all upcoming events and reservations.
          </p>
        </div>

        <CalendarView />
      </div>
    </div>
  );
}
