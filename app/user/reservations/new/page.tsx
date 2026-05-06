"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/common";
import { ReservationForm } from "@/components/reservation-form";

export default function NewReservationPage() {
  const searchParams = useSearchParams();
  const [userId, setUserId] = useState<number>(0);

  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then((u) => setUserId(u.userId));
  }, []);

  return (
    <div className="space-y-6">
      <div className="app-page__header">
        <h1 className="app-page__title">Make a Reservation</h1>
        <p className="app-page__description">
          Select an item, choose a schedule, and submit your request.
        </p>
      </div>
      <ReservationForm userId={userId} />
    </div>
  );
}
