"use client";

import type {
  DatesSetArg,
  EventClickArg,
  EventContentArg,
} from "@fullcalendar/core";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge, Modal } from "@/components/common";
import { useEffect, useRef, useState } from "react";
import { cn, fmtDateTime } from "@/lib/utils";

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

type CalendarScope = "approved" | "all";
type CalendarViewMode = "dayGridMonth" | "timeGridWeek" | "timeGridDay";

const viewOptions: Array<{ label: string; value: CalendarViewMode }> = [
  { label: "Month", value: "dayGridMonth" },
  { label: "Week", value: "timeGridWeek" },
  { label: "Day", value: "timeGridDay" },
];

function formatEventTime(start: Date | null, end: Date | null) {
  if (!start) {
    return "";
  }

  const formatter = new Intl.DateTimeFormat("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  });

  const startLabel = formatter.format(start);
  if (!end) {
    return startLabel;
  }

  return `${startLabel} - ${formatter.format(end)}`;
}

function formatStatusLabel(status: string) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function getBadgeTone(status: string) {
  if (status === "PENDING") {
    return "yellow" as const;
  }

  if (status === "DENIED" || status === "CANCELLED") {
    return "red" as const;
  }

  return "green" as const;
}

export function CalendarView({ scope = "approved" }: { scope?: CalendarScope }) {
  const calendarRef = useRef<FullCalendar | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selected, setSelected] = useState<CalendarEvent | null>(null);
  const [activeView, setActiveView] = useState<CalendarViewMode>("dayGridMonth");
  const [currentTitle, setCurrentTitle] = useState(() =>
    new Intl.DateTimeFormat("en-PH", {
      month: "long",
      year: "numeric",
    }).format(new Date())
  );

  useEffect(() => {
    const url =
      scope === "all" ? "/api/calendar/events?scope=all" : "/api/calendar/events";

    fetch(url)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setEvents(Array.isArray(data) ? data : []))
      .catch(() => setEvents([]));
  }, [scope]);

  function handleDatesSet(arg: DatesSetArg) {
    setCurrentTitle(arg.view.title);
    setActiveView(arg.view.type as CalendarViewMode);
  }

  function handleNavigation(action: "prev" | "next" | "today") {
    const calendarApi = calendarRef.current?.getApi();
    if (!calendarApi) {
      return;
    }

    if (action === "prev") {
      calendarApi.prev();
      return;
    }

    if (action === "next") {
      calendarApi.next();
      return;
    }

    calendarApi.today();
  }

  function handleViewChange(view: CalendarViewMode) {
    calendarRef.current?.getApi().changeView(view);
  }

  function handleEventClick(arg: EventClickArg) {
    const details = arg.event.extendedProps as CalendarEvent["extendedProps"];

    setSelected({
      id: arg.event.id,
      title: arg.event.title,
      start: arg.event.start?.toISOString() ?? arg.event.startStr,
      end: arg.event.end?.toISOString() || arg.event.endStr || undefined,
      extendedProps: {
        status: String(details.status ?? "APPROVED"),
        purpose: String(details.purpose ?? ""),
        expectedAttendees: details.expectedAttendees ?? null,
        residentName: String(details.residentName ?? ""),
        itemType: String(details.itemType ?? ""),
        itemName: String(details.itemName ?? ""),
      },
    });
  }

  function renderEventContent(arg: EventContentArg) {
    const status = String(arg.event.extendedProps.status ?? "APPROVED");
    const pillTone =
      status === "PENDING" ? "calendar-event-pill--amber" : "calendar-event-pill--green";
    const timeLabel = formatEventTime(arg.event.start, arg.event.end);

    return (
      <div className={cn("calendar-event-pill", pillTone)}>
        <div className="calendar-event-pill__title" title={arg.event.title}>
          {arg.event.title}
        </div>
        {timeLabel ? <div className="calendar-event-pill__time">{timeLabel}</div> : null}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-[2rem] border border-[#e6ebf2] bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)] sm:p-8">
        <div className="flex flex-col gap-5 border-b border-[#edf1f5] pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => handleNavigation("today")}
              className="inline-flex h-11 items-center rounded-full bg-[#f1f4f8] px-5 text-sm font-semibold text-[#475467] transition hover:bg-[#e8edf4]"
            >
              Today
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleNavigation("prev")}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#e4eaf1] bg-[#f8fafc] text-[#344054] transition hover:bg-[#eef2f6]"
                aria-label="Previous period"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleNavigation("next")}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#e4eaf1] bg-[#f8fafc] text-[#344054] transition hover:bg-[#eef2f6]"
                aria-label="Next period"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <h2 className="ml-1 text-[1.9rem] font-semibold tracking-[-0.03em] text-[#11233d]">
              {currentTitle}
            </h2>
          </div>

          <div className="inline-flex w-fit items-center rounded-full bg-[#eef2f6] p-1">
            {viewOptions.map((option) => {
              const isActive = activeView === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleViewChange(option.value)}
                  className={cn(
                    "inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-semibold transition",
                    isActive
                      ? "bg-[#11233d] text-white shadow-[0_6px_14px_rgba(15,23,42,0.14)]"
                      : "text-[#4b5563] hover:text-[#11233d]"
                  )}
                  aria-pressed={isActive}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="calendar-dashboard mt-6">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={false}
            height="auto"
            firstDay={0}
            fixedWeekCount={false}
            displayEventTime={false}
            eventDisplay="block"
            dayMaxEventRows={3}
            allDaySlot={false}
            dayHeaderFormat={{ weekday: "long" }}
            events={events}
            datesSet={handleDatesSet}
            eventClick={handleEventClick}
            eventContent={renderEventContent}
            eventClassNames={(arg) => [
              "calendar-event-shell",
              String(arg.event.extendedProps.status ?? "") === "PENDING"
                ? "calendar-event-shell--amber"
                : "calendar-event-shell--green",
            ]}
          />
        </div>
      </div>

      <Modal open={!!selected} title="Reservation Details" onClose={() => setSelected(null)}>
        {selected ? (
          <div className="space-y-4">
            <div className="rounded-[1.5rem] bg-[#f8fafc] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#98a2b3]">
                Reservation
              </p>
              <p className="mt-2 text-lg font-semibold text-[#11233d]">{selected.title}</p>
              <Badge
                tone={getBadgeTone(selected.extendedProps.status)}
                className="mt-3 inline-flex w-fit"
              >
                {formatStatusLabel(selected.extendedProps.status)}
              </Badge>
            </div>

            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-[1.25rem] border border-[#e7ecf2] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#98a2b3]">
                  Item
                </p>
                <p className="mt-2 font-semibold text-[#11233d]">
                  {selected.extendedProps.itemName}
                </p>
              </div>
              <div className="rounded-[1.25rem] border border-[#e7ecf2] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#98a2b3]">
                  Type
                </p>
                <p className="mt-2 font-semibold text-[#11233d]">
                  {selected.extendedProps.itemType}
                </p>
              </div>
              <div className="rounded-[1.25rem] border border-[#e7ecf2] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#98a2b3]">
                  Resident
                </p>
                <p className="mt-2 font-semibold text-[#11233d]">
                  {selected.extendedProps.residentName}
                </p>
              </div>
              <div className="rounded-[1.25rem] border border-[#e7ecf2] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#98a2b3]">
                  Expected Attendees
                </p>
                <p className="mt-2 font-semibold text-[#11233d]">
                  {selected.extendedProps.expectedAttendees ?? "N/A"}
                </p>
              </div>
              <div className="rounded-[1.25rem] border border-[#e7ecf2] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#98a2b3]">
                  Start
                </p>
                <p className="mt-2 font-semibold text-[#11233d]">
                  {fmtDateTime(selected.start)}
                </p>
              </div>
              <div className="rounded-[1.25rem] border border-[#e7ecf2] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#98a2b3]">
                  End
                </p>
                <p className="mt-2 font-semibold text-[#11233d]">
                  {selected.end ? fmtDateTime(selected.end) : "N/A"}
                </p>
              </div>
            </div>

            <div className="rounded-[1.25rem] border border-[#e7ecf2] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#98a2b3]">
                Purpose
              </p>
              <p className="mt-2 text-sm leading-6 text-[#344054]">
                {selected.extendedProps.purpose}
              </p>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
