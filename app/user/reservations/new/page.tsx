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
      <div>
        <h1 className="text-2xl font-semibold sm:text-3xl">Make a Reservation</h1>
        <p className="mt-1 text-text-secondary">Select an item, choose a schedule, and submit your request.</p>
      </div>
      <ReservationForm userId={userId} />
    </div>
  );
}
