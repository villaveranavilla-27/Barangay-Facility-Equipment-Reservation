"use client";

import { useEffect, useState } from "react";
import { Card, StatCard, Button, Badge } from "@/components/common";
import { fetchJson, getJsonErrorMessage } from "@/lib/fetch-json";

const RECENT_ACTIVITY_LIMIT = 5;

export default function UserDashboardPage() {
  const [data, setData] = useState({ pending: 0, approved: 0 });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    let ignore = false;

    const loadReservations = async () => {
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

        const userRows = Array.isArray(data) ? data : [];

        if (ignore) {
          return;
        }

        setData({
          pending: userRows.filter((r: any) => r.status === "PENDING").length,
          approved: userRows.filter((r: any) => r.status === "APPROVED").length,
        });
        setRecentActivity(userRows.slice(0, RECENT_ACTIVITY_LIMIT));
      } catch (error) {
        console.error("Failed to load reservations", error);

        if (ignore) {
          return;
        }

        setData({ pending: 0, approved: 0 });
        setRecentActivity([]);
      }
    };

    void loadReservations();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold sm:text-3xl">Dashboard</h1>
        <p className="mt-1 text-text-secondary">
          Welcome back. Manage your barangay requests here.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <StatCard label="Pending Requests" value={String(data.pending)} />
        <StatCard label="Approved Requests" value={String(data.approved)} />
      </div>

      <Card>
        <div className="grid gap-3 md:grid-cols-4">
          <Button href="/user/facilities" className="w-full">
            View Facilities
          </Button>
          <Button href="/user/reservations/new" className="w-full">
            Make Reservation
          </Button>
          <Button href="/user/reservations" className="w-full">
            Reservation Request
          </Button>
          <Button href="/user/calendar" className="w-full">
            Live Calendar
          </Button>
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Recent Activity</h2>
            <p className="mt-1 text-sm text-text-secondary">
              Only your reservation activity is shown here.
            </p>
          </div>
          <Button href="/user/reservations" variant="secondary" className="h-10 self-start">
            View all reservations
          </Button>
        </div>

        {recentActivity.length === 0 ? (
          <p className="mt-6 text-sm text-text-secondary">
            No recent activity yet. Create a reservation to see it here.
          </p>
        ) : (
          <div className="mt-6 space-y-4">
            {recentActivity.map((item: any) => (
              <div
                key={item.reservationId}
                className="rounded-2xl border border-border bg-slate-50 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-text-primary">
                      {item.itemName || item.itemType}
                    </div>
                    <div className="mt-1 text-sm text-text-secondary">
                      {item.itemType} | {new Date(item.startDateTime).toLocaleString()} -{" "}
                      {new Date(item.endDateTime).toLocaleString()}
                    </div>
                  </div>
                  <Badge
                    tone={
                      item.status === "APPROVED"
                        ? "green"
                        : item.status === "PENDING"
                          ? "yellow"
                          : item.status === "DENIED"
                            ? "red"
                            : "neutral"
                    }
                  >
                    {item.status}
                  </Badge>
                </div>
                {item.purpose ? (
                  <p className="mt-3 text-sm text-text-secondary">Purpose: {item.purpose}</p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
