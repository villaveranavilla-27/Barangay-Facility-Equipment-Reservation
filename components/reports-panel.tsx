"use client";

import { useState, useEffect } from "react";
import { Card, Button, Input, Badge } from "@/components/common";
import { fetchJson, getJsonErrorMessage } from "@/lib/fetch-json";
import { money, fmtDate } from "@/lib/utils";

export function ReportsPanel() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [reservations, setReservations] = useState<any[]>([]);

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const { response, data } = await fetchJson<any[] | { error?: string }>(
          "/api/reservations",
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(getJsonErrorMessage(data, "Failed to load reservations"));
        }

        setReservations(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load reservations", error);
        setReservations([]);
      }
    };

    fetchReservations();
  }, []);

  const filtered = reservations.filter((item) => {
    if (!from && !to) return true;
    const itemDate = new Date(item.date).getTime();
    const fromDate = from ? new Date(from).getTime() : null;
    const toDate = to ? new Date(to).getTime() : null;

    if (fromDate && itemDate < fromDate) return false;
    if (toDate && itemDate > toDate) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <Card>
        <div className="mb-4 text-lg font-semibold">Date Range Selection</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              From Date
            </label>
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              To Date
            </label>
            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button disabled={!from && !to}>
              Filter
            </Button>
          </div>
        </div>
      </Card>

      <Card className="overflow-x-auto">
        <div className="mb-3 text-lg font-semibold">Reservations Summary</div>
        <table className="min-w-full text-left">
          <thead>
            <tr className="border-b border-border text-sm text-text-secondary">
              <th className="py-3 pr-4">ID</th>
              <th className="py-3 pr-4">Name</th>
              <th className="py-3 pr-4">Facility / Equipment</th>
              <th className="py-3 pr-4">Time</th>
              <th className="py-3 pr-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-text-secondary">
                  No data available
                </td>
              </tr>
            ) : (
              filtered.map((row: any) => (
                <tr key={row.id} className="border-b border-border">
                  <td className="py-3 pr-4">{row.id}</td>
                  <td className="py-3 pr-4">{row.name}</td>
                  <td className="py-3 pr-4">
                    {row.facility || row.item}
                  </td>
                  <td className="py-3 pr-4">{row.time}</td>
                  <td className="py-3 pr-4">
                    {row.status === "Approved" && (
                      <Badge className="bg-green-100 text-green-700">
                        Approved
                      </Badge>
                    )}
                    {row.status === "Denied" && (
                      <Badge className="bg-red-100 text-red-700">
                        Denied
                      </Badge>
                    )}
                    {row.status === "Pending" && (
                      <Badge className="bg-yellow-100 text-yellow-700">
                        Pending
                      </Badge>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
