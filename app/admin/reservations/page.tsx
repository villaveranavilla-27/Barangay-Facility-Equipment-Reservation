"use client";

import { ReservationsTable } from "@/components/reservations-table";

export default function AdminReservationsPage() {
  return (
    <div className="space-y-6">
      <div className="app-page__header">
        <h1 className="app-page__title">Reservations</h1>
        <p className="app-page__description">
          Approve, deny, review, and mark borrowed equipment as returned.
        </p>
      </div>
      <ReservationsTable mode="admin" />
    </div>
  );
}
