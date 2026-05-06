"use client";

import { ReservationsTable } from "@/components/reservations-table";

export default function UserReservationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold sm:text-3xl">My Requests</h1>
        <p className="mt-1 text-text-secondary">Track the status of all your reservations.</p>
      </div>
      <ReservationsTable mode="user" />
    </div>
  );
}
