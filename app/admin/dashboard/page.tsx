"use client";

import { useEffect, useState } from "react";
import { StatCard, Card, Button, Badge } from "@/components/common";
import { fetchJson, getJsonErrorMessage } from "@/lib/fetch-json";
import { fmtDateTime } from "@/lib/utils";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>({});
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    let ignore = false;

    const loadDashboard = async () => {
      try {
        const [reservationsResult, usersResult, facilitiesResult, equipmentResult] =
          await Promise.all([
            fetchJson<any[] | { error?: string }>("/api/reservations?scope=all", {
              cache: "no-store",
            }),
            fetchJson<any[] | { error?: string }>("/api/users", { cache: "no-store" }),
            fetchJson<any[] | { error?: string }>("/api/facilities", {
              cache: "no-store",
            }),
            fetchJson<any[] | { error?: string }>("/api/equipment", {
              cache: "no-store",
            }),
          ]);

        if (!reservationsResult.response.ok) {
          throw new Error(
            getJsonErrorMessage(reservationsResult.data, "Failed to load reservations")
          );
        }

        if (!usersResult.response.ok) {
          throw new Error(getJsonErrorMessage(usersResult.data, "Failed to load users"));
        }

        if (!facilitiesResult.response.ok) {
          throw new Error(
            getJsonErrorMessage(facilitiesResult.data, "Failed to load facilities")
          );
        }

        if (!equipmentResult.response.ok) {
          throw new Error(
            getJsonErrorMessage(equipmentResult.data, "Failed to load equipment")
          );
        }

        const reservations = Array.isArray(reservationsResult.data)
          ? reservationsResult.data
          : [];
        const users = Array.isArray(usersResult.data) ? usersResult.data : [];
        const facilities = Array.isArray(facilitiesResult.data)
          ? facilitiesResult.data
          : [];
        const equipment = Array.isArray(equipmentResult.data)
          ? equipmentResult.data
          : [];

        if (ignore) {
          return;
        }

        setStats({
          totalReservations: reservations.length,
          pending: reservations.filter((r: any) => r.status === "PENDING").length,
          totalUsers: users.length,
          totalItems: facilities.length + equipment.length,
        });
        setRecent(reservations.slice(0, 5));
      } catch (error) {
        console.error("Failed to load admin dashboard", error);

        if (ignore) {
          return;
        }

        setStats({
          totalReservations: 0,
          pending: 0,
          totalUsers: 0,
          totalItems: 0,
        });
        setRecent([]);
      }
    };

    void loadDashboard();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold sm:text-3xl">Admin Dashboard</h1>
        <p className="mt-1 text-text-secondary">
          Monitor reservations and manage barangay resources.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Total Reservations" value={String(stats.totalReservations || 0)} />
        <StatCard label="Pending Approvals" value={String(stats.pending || 0)} />
        <StatCard label="Total Users" value={String(stats.totalUsers || 0)} />
        <StatCard label="Total Items" value={String(stats.totalItems || 0)} />
      </div>

      <Card>
        <div className="mb-4 text-lg font-semibold">Recent Requests</div>

        <div className="space-y-3 md:hidden">
          {recent.map((row) => (
            <div
              key={row.reservationId}
              className="rounded-2xl border border-border bg-slate-50 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
                    Reservation #{row.reservationId}
                  </p>
                  <p className="mt-1 text-base font-semibold text-text-primary">
                    {row.itemName}
                  </p>
                </div>
                <Badge
                  tone={
                    row.status === "PENDING"
                      ? "yellow"
                      : row.status === "APPROVED"
                        ? "green"
                        : "red"
                  }
                >
                  {row.status}
                </Badge>
              </div>

              <div className="mt-3 space-y-2 text-sm text-text-secondary">
                <p>
                  <strong className="text-text-primary">Resident:</strong> {row.residentName}
                </p>
                <p>
                  <strong className="text-text-primary">Schedule:</strong>{" "}
                  {fmtDateTime(row.startDateTime)}
                </p>
              </div>

              <Button href="/admin/reservations" variant="secondary" className="mt-4 w-full">
                View
              </Button>
            </div>
          ))}
        </div>

        <div className="hidden overflow-x-auto md:block">
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
              {recent.map((row) => (
                <tr key={row.reservationId} className="border-b border-border">
                  <td className="py-3 pr-4">{row.reservationId}</td>
                  <td className="py-3 pr-4">{row.residentName}</td>
                  <td className="py-3 pr-4">{row.itemName}</td>
                  <td className="py-3 pr-4">{fmtDateTime(row.startDateTime)}</td>
                  <td className="py-3 pr-4">
                    <Badge
                      tone={
                        row.status === "PENDING"
                          ? "yellow"
                          : row.status === "APPROVED"
                            ? "green"
                            : "red"
                      }
                    >
                      {row.status}
                    </Badge>
                  </td>
                  <td className="py-3 pr-4">
                    <Button href="/admin/reservations" variant="secondary">
                      View
                    </Button>
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
