"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchJson, getJsonErrorMessage } from "@/lib/fetch-json";

type Reservation = {
  reservationId?: number;
  id?: string | number;
  residentName?: string;
  name?: string;
  status?: string;
  itemName?: string;
  itemType?: "FACILITY" | "EQUIPMENT";
  startDateTime?: string;
  endDateTime?: string;
  date?: string;
  time?: string;
  facility?: {
    itemName?: string;
  };
  equipmentReturnStatus?: string | null;
};

function formatDateTimeRange(start?: string, end?: string) {
  if (!start && !end) return "N/A";

  const formatValue = (value?: string) => {
    if (!value) return "N/A";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return `${formatValue(start)} - ${formatValue(end)}`;
}

function normalizeStatus(status?: string, equipmentReturnStatus?: string | null) {
  const raw = equipmentReturnStatus || status || "";
  const normalized = raw.toUpperCase().replace(/\s+/g, "_");

  if (normalized === "APPROVED") return "APPROVED";
  if (normalized === "DENIED") return "DENIED";
  if (normalized === "PENDING") return "PENDING";
  if (normalized === "BORROWED") return "BORROWED";
  if (normalized === "RETURNED") return "RETURNED";
  if (normalized === "CANCELLED") return "CANCELLED";

  return raw || "N/A";
}

function getStatusClasses(status: string) {
  switch (status) {
    case "APPROVED":
      return "bg-green-100 text-green-700";
    case "DENIED":
      return "bg-red-100 text-red-700";
    case "BORROWED":
      return "bg-blue-100 text-blue-700";
    case "CANCELLED":
      return "bg-gray-200 text-gray-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function formatStatusLabel(status: string) {
  return status
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function ReportsAnalytics() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        setLoading(true);
        setError("");

        const { response, data } = await fetchJson<Reservation[] | { error?: string }>(
          "/api/reservations?scope=all",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(getJsonErrorMessage(data, "Failed to fetch reservations"));
        }

        setReservations(Array.isArray(data) ? data : []);
      } catch (fetchError) {
        console.error(fetchError);
        setError("Unable to load reservations.");
      } finally {
        setLoading(false);
      }
    };

    void fetchReservations();
  }, []);

  const filtered = useMemo(() => {
    const includedStatuses = new Set(["APPROVED", "DENIED", "CANCELLED", "BORROWED"]);

    return reservations.filter((item) => {
      const displayStatus = normalizeStatus(item.status, item.equipmentReturnStatus);

      if (!includedStatuses.has(displayStatus)) {
        return false;
      }

      const baseDateValue = item.startDateTime || item.date;
      if (!baseDateValue) return !fromDate && !toDate;

      const reservationDate = new Date(baseDateValue);
      if (Number.isNaN(reservationDate.getTime())) return false;

      if (fromDate) {
        const from = new Date(`${fromDate}T00:00:00`);
        if (reservationDate < from) return false;
      }

      if (toDate) {
        const to = new Date(`${toDate}T23:59:59.999`);
        if (reservationDate > to) return false;
      }

      return true;
    });
  }, [reservations, fromDate, toDate]);

  return (
    <div className="flex w-full flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold">Reports &amp; Analytics</h1>
        <p className="text-sm text-gray-600">
          Generate and view system usage and reservation reports.
        </p>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow sm:p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-bold">Reservations Summary</h2>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm text-white sm:w-auto"
          >
            Export All Data
          </button>
        </div>

        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[auto_1fr_auto_1fr] lg:items-center">
          <span className="text-sm font-medium">From:</span>

          <input
            type="date"
            className="rounded-md border px-2 py-2 text-sm"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />

          <span className="text-sm font-medium">To:</span>

          <input
            type="date"
            className="rounded-md border px-2 py-2 text-sm"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>

        {loading ? <p className="text-sm text-gray-500">Loading reservations...</p> : null}

        {error ? <p className="text-sm text-red-500">{error}</p> : null}

        {!loading && !error ? (
          <div className="space-y-3">
            <div className="space-y-3 md:hidden">
              {filtered.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm italic text-gray-500">
                  No reservations found for the selected date range.
                </div>
              ) : (
                filtered.map((row, index) => {
                  const displayStatus = normalizeStatus(row.status, row.equipmentReturnStatus);

                  return (
                    <div
                      key={row.reservationId ?? row.id ?? index}
                      className="rounded-2xl border border-gray-200 bg-slate-50 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            Reservation #{row.reservationId ?? row.id ?? "N/A"}
                          </p>
                          <p className="mt-1 font-semibold text-slate-900">
                            {row.facility?.itemName || row.itemName || "N/A"}
                          </p>
                        </div>
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(
                            displayStatus
                          )}`}
                        >
                          {formatStatusLabel(displayStatus)}
                        </span>
                      </div>

                      <div className="mt-3 space-y-2 text-sm text-gray-600">
                        <p>
                          <strong className="text-slate-900">Resident:</strong>{" "}
                          {row.residentName || row.name || "N/A"}
                        </p>
                        <p>
                          <strong className="text-slate-900">Time:</strong>{" "}
                          {row.startDateTime || row.endDateTime
                            ? formatDateTimeRange(row.startDateTime, row.endDateTime)
                            : row.time || "N/A"}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="hidden overflow-x-auto rounded-lg md:block">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100 text-left">
                    <th className="px-4 py-3">Reservation ID</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Facility / Equipment</th>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center italic text-gray-500">
                        No reservations found for the selected date range.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((row, index) => {
                      const displayStatus = normalizeStatus(
                        row.status,
                        row.equipmentReturnStatus
                      );

                      return (
                        <tr key={row.reservationId ?? row.id ?? index} className="border-b">
                          <td className="px-4 py-3">{row.reservationId ?? row.id ?? "N/A"}</td>
                          <td className="px-4 py-3">{row.residentName || row.name || "N/A"}</td>
                          <td className="px-4 py-3">
                            {row.facility?.itemName || row.itemName || "N/A"}
                          </td>
                          <td className="px-4 py-3">
                            {row.startDateTime || row.endDateTime
                              ? formatDateTimeRange(row.startDateTime, row.endDateTime)
                              : row.time || "N/A"}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(
                                displayStatus
                              )}`}
                            >
                              {formatStatusLabel(displayStatus)}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
