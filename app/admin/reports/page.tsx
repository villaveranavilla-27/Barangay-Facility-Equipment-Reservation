"use client";

import { useEffect, useMemo, useState } from "react";

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
  if (!start && !end) return "—";

  const formatValue = (value?: string) => {
    if (!value) return "—";

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

  return raw || "—";
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

        const res = await fetch("/api/reservations?scope=all", {
          method: "GET",
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error("Failed to fetch reservations");
        }

        const data = await res.json();

        const normalized = Array.isArray(data) ? data : data?.data || [];

        setReservations(normalized);
      } catch (error) {
        console.error(error);
        setError("Unable to load reservations.");
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, []);

  const filtered = useMemo(() => {
    const includedStatuses = new Set([
      "APPROVED",
      "DENIED",
      "CANCELLED",
      "BORROWED",
    ]);

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

  const exportPDF = () => {
    window.print();
  };

  return (
    <div className="flex w-full flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Reports &amp; Analytics</h1>
        <p className="text-sm text-gray-600">
          Generate and view system usage and reservation reports.
        </p>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Reservations Summary</h2>

          <button
            onClick={exportPDF}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm text-white"
          >
            📥 Export All Data
          </button>
        </div>

        <div className="mb-4 flex items-center gap-3">
          <span className="text-sm font-medium">From:</span>

          <input
            type="date"
            className="rounded-md border px-2 py-1 text-sm"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />

          <span className="text-sm font-medium">To:</span>

          <input
            type="date"
            className="rounded-md border px-2 py-1 text-sm"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>

        {loading && (
          <p className="text-sm text-gray-500">Loading reservations...</p>
        )}

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        {!loading && !error && (
          <div className="overflow-x-auto rounded-lg">
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
                    <td
                      colSpan={5}
                      className="py-6 text-center italic text-gray-500"
                    >
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
                      <tr
                        key={row.reservationId ?? row.id ?? index}
                        className="border-b"
                      >
                        <td className="px-4 py-3">
                          {row.reservationId ?? row.id ?? "—"}
                        </td>

                        <td className="px-4 py-3">
                          {row.residentName || row.name || "—"}
                        </td>

                        <td className="px-4 py-3">
                          {row.facility?.itemName || row.itemName || "—"}
                        </td>

                        <td className="px-4 py-3">
                          {row.startDateTime || row.endDateTime
                            ? formatDateTimeRange(row.startDateTime, row.endDateTime)
                            : row.time || "—"}
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
        )}
      </div>
    </div>
  );
}