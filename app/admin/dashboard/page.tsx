"use client";

import { useEffect, useState } from "react";
import { StatCard, Card, Button, Badge } from "@/components/common";
import { fmtDateTime } from "@/lib/utils";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>({});
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/reservations?scope=all").then((r) => r.json()),
      fetch("/api/users").then((r) => r.json()),
      fetch("/api/facilities").then((r) => r.json()),
      fetch("/api/equipment").then((r) => r.json())
    ]).then(([reservations, users, facilities, equipment]) => {
      setStats({
        totalReservations: reservations.length,
        pending: reservations.filter((r: any) => r.status === "PENDING").length,
        totalUsers: users.length,
        totalItems: facilities.length + equipment.length
      });
      setRecent(reservations.slice(0, 5));
    });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Admin Dashboard</h1>
        <p className="mt-1 text-text-secondary">Monitor reservations and manage barangay resources.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Total Reservations" value={String(stats.totalReservations || 0)} />
        <StatCard label="Pending Approvals" value={String(stats.pending || 0)} />
        <StatCard label="Total Users" value={String(stats.totalUsers || 0)} />
        <StatCard label="Total Items" value={String(stats.totalItems || 0)} />
      </div>

      <Card>
        <div className="mb-4 text-lg font-semibold">Recent Requests</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-text-secondary">
                <th className="py-3 pr-4">Reservation ID</th>
                <th className="py-3 pr-4">Name</th>
                <th className="py-3 pr-4">Item</th>
                <th className="py-3 pr-4">Schedule</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((r) => (
                <tr key={r.reservationId} className="border-b border-border">
                  <td className="py-3 pr-4">{r.reservationId}</td>
                  <td className="py-3 pr-4">{r.residentName}</td>
                  <td className="py-3 pr-4">{r.itemName}</td>
                  <td className="py-3 pr-4">{fmtDateTime(r.startDateTime)}</td>
                  <td className="py-3 pr-4"><Badge tone={r.status === "PENDING" ? "yellow" : r.status === "APPROVED" ? "green" : "red"}>{r.status}</Badge></td>
                  <td className="py-3 pr-4">
                    <Button href="/admin/reservations" variant="secondary">View</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
