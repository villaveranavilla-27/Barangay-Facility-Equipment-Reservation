"use client";

import { ReservationsTable } from "@/components/reservations-table";

export default function AdminReservationsPage() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold sm:text-3xl">Reservations</h1>
        <p className="mt-1 text-text-secondary">
          Approve, deny, review, and mark borrowed equipment as returned.
        </p>
      </div>
      <ReservationsTable mode="admin" />
    </div>
  );
}
