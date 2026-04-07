"use client";

import { useEffect, useState } from "react";
import { Card, StatCard, Button } from "@/components/common";

export default function UserDashboardPage() {
  const [data, setData] = useState<any>({ pending: 0, announcements: 0 });

  useEffect(() => {
    fetch("/api/reservations")
      .then((res) => res.json())
      .then((rows) => {
        setData({
          pending: rows.filter((r: any) => r.status === "PENDING").length,
          approved: rows.filter((r: any) => r.status === "APPROVED").length,
          announcements: 1
        });
      });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-text-secondary">Welcome back. Manage your barangay requests here.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Pending Requests" value={String(data.pending)} />
        <StatCard label="Approved Requests" value={String(data.approved)} />
        <StatCard label="Announcements" value={String(data.announcements)} />
      </div>
      <Card>
        <div className="grid gap-3 md:grid-cols-4">
          <Button href="/user/facilities" className="w-full">View Facilities</Button>
          <Button href="/user/reservations/new" className="w-full">Make Reservation</Button>
          <Button href="/user/reservations" className="w-full">Track Status</Button>
          <Button href="/user/calendar" className="w-full">Live Calendar</Button>
        </div>
      </Card>
    </div>
  );
}
