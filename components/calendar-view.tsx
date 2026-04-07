"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Modal, Card, Badge } from "@/components/common";
import { useEffect, useState } from "react";
import { fmtDateTime } from "@/lib/utils";

type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end?: string;
  extendedProps: {
    status: string;
    purpose: string;
    expectedAttendees?: number | null;
    residentName: string;
    itemType: string;
    itemName: string;
  };
};

export function CalendarView() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selected, setSelected] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    fetch("/api/calendar/events")
      .then((res) => res.json())
      .then(setEvents);
  }, []);

  return (
    <div className="space-y-4">
      <Card>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          height="auto"
          events={events}
          eventClick={(arg) => setSelected(arg.event.toPlainObject() as CalendarEvent)}
          headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,timeGridDay" }}
        />
      </Card>

      <Modal open={!!selected} title="Booked Slot Details" onClose={() => setSelected(null)}>
        {selected ? (
          <div className="space-y-2 text-sm">
            <div><strong>Item:</strong> {selected.extendedProps.itemName}</div>
            <div><strong>Type:</strong> {selected.extendedProps.itemType}</div>
            <div><strong>Resident:</strong> {selected.extendedProps.residentName}</div>
            <div><strong>Start:</strong> {fmtDateTime(selected.start)}</div>
            <div><strong>End:</strong> {selected.end ? fmtDateTime(selected.end) : "N/A"}</div>
            <div><strong>Purpose:</strong> {selected.extendedProps.purpose}</div>
            <div><strong>Expected Attendees:</strong> {selected.extendedProps.expectedAttendees ?? "N/A"}</div>
            <Badge tone="green">{selected.extendedProps.status}</Badge>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
