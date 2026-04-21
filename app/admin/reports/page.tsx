"use client";

import { useState, useEffect } from "react";

type Reservation = {
  id: string;
  name?: string;
  date?: string;
  time?: string;
  status?: string;
  facility?: {
    itemName?: string;
  };
  itemName?: string;
  item?: string;
};

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

        const res = await fetch("/api/reservations", {
          method: "GET",
          cache: "no-store", // ✅ IMPORTANT: prevents stale data
        });

        if (!res.ok) {
          throw new Error("Failed to fetch reservations");
        }

        const data = await res.json();

        // ✅ handles both {data: []} and []
        const normalized = Array.isArray(data)
          ? data
          : data?.data || [];

        setReservations(normalized);
      } catch (error: any) {
        console.error(error);
        setError("Unable to load reservations.");
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, []);

  const filtered = reservations.filter((item) => {
    if (!fromDate && !toDate) return true;

    if (!item.date) return false;

    const itemDate = new Date(item.date).getTime();
    const from = fromDate ? new Date(fromDate).getTime() : null;
    const to = toDate ? new Date(toDate).getTime() : null;

    if (from && itemDate < from) return false;
    if (to && itemDate > to) return false;

    return true;
  });

  const exportPDF = () => {
    window.print();
  };

  return (
    <div className="p-6 w-full flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Reports & Analytics</h1>
        <p className="text-sm text-gray-600">
          Generate and view system usage and reservation reports.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Reservations Summary</h2>

          <button
            onClick={exportPDF}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm"
          >
            📥 Export All Data
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm font-medium">From:</span>

          <input
            type="date"
            className="border rounded-md px-2 py-1 text-sm"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />

          <span className="text-sm font-medium">To:</span>

          <input
            type="date"
            className="border rounded-md px-2 py-1 text-sm"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>

        {/* States */}
        {loading && (
          <p className="text-sm text-gray-500">Loading reservations...</p>
        )}

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        {/* Table */}
        {!loading && !error && (
          <div className="overflow-x-auto rounded-lg">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Facility / Equipment</th>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>

              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center py-6 text-gray-500 italic"
                    >
                      No data available
                    </td>
                  </tr>
                ) : (
                  filtered.map((row) => (
                    <tr key={row.id} className="border-b">
                      <td className="py-3 px-4">{row.id}</td>
                      <td className="py-3 px-4">{row.name || "—"}</td>

                      <td className="py-3 px-4">
                        {row.facility?.itemName ||
                          row.itemName ||
                          row.item ||
                          "—"}
                      </td>

                      <td className="py-3 px-4">{row.time || "—"}</td>

                      <td className="py-3 px-4">
                        {row.status === "Approved" && (
                          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs">
                            Approved
                          </span>
                        )}
                        {row.status === "Denied" && (
                          <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs">
                            Denied
                          </span>
                        )}
                        {row.status === "Pending" && (
                          <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs">
                            Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}