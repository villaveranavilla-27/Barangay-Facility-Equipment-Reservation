"use client";

import { ReservationsTable } from "@/components/reservations-table";

export default function UserReservationsPage() {
  return (
    <div className="space-y-6">
      <div className="app-page__header">
        <h1 className="app-page__title">My Requests</h1>
        <p className="app-page__description">Track the status of all your reservations.</p>
      </div>
      <ReservationsTable mode="user" />
    </div>
  );
}
