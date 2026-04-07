"use client";

import { ReservationsTable } from "@/components/reservations-table";

export default function AdminReservationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Reservations</h1>
        <p className="mt-1 text-text-secondary">Approve, deny, and review every reservation.</p>
      </div>
      <ReservationsTable mode="admin" />
    </div>
  );
}
