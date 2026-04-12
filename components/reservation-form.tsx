"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { Button, Card, Input, Select, Textarea } from "@/components/common";
import { money } from "@/lib/utils";

type CatalogItem = {
  id: number;
  type: "FACILITY" | "EQUIPMENT";
  itemName: string;
  description?: string | null;
  status?: string | null;
  pricePerDay?: number | null;
  price?: number | string | null;
  quantity?: number | null;
};

export function ReservationForm({ userId }: { userId: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [form, setForm] = useState({
    itemType: "FACILITY",
    facilityId: "",
    equipmentId: "",
    startDateTime: "",
    endDateTime: "",
    purpose: "",
    expectedAttendees: "",
  });

  useEffect(() => {
    Promise.all([fetch("/api/facilities").then((r) => r.json()), fetch("/api/equipment").then((r) => r.json())]).then(([facilities, equipment]) => {
      setItems([
        ...facilities.map((facility: any) => ({
          ...facility,
          type: "FACILITY" as const,
          id: facility.facilityId,
        })),
        ...equipment.map((item: any) => ({
          ...item,
          type: "EQUIPMENT" as const,
          id: item.equipmentId,
        })),
      ]);
    });
  }, []);

  useEffect(() => {
    const type = searchParams.get("type");
    const id = searchParams.get("id");
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    const purpose = searchParams.get("purpose");
    const expected = searchParams.get("expectedAttendees");

    if (type) setForm((previous) => ({ ...previous, itemType: type }));
    if (id) {
      if (type === "EQUIPMENT") setForm((previous) => ({ ...previous, equipmentId: id }));
      else setForm((previous) => ({ ...previous, facilityId: id }));
    }
    if (start) setForm((previous) => ({ ...previous, startDateTime: start }));
    if (end) setForm((previous) => ({ ...previous, endDateTime: end }));
    if (purpose) setForm((previous) => ({ ...previous, purpose }));
    if (expected) setForm((previous) => ({ ...previous, expectedAttendees: expected }));
  }, [searchParams]);

  const selectedItem = useMemo(() => {
    const selectedId = form.itemType === "FACILITY" ? form.facilityId : form.equipmentId;
    return items.find((item) => String(item.id) === selectedId);
  }, [items, form]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemType: form.itemType,
        facilityId: form.itemType === "FACILITY" ? Number(form.facilityId) : null,
        equipmentId: form.itemType === "EQUIPMENT" ? Number(form.equipmentId) : null,
        startDateTime: form.startDateTime,
        endDateTime: form.endDateTime,
        purpose: form.purpose,
        expectedAttendees: form.expectedAttendees ? Number(form.expectedAttendees) : null,
        userId,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Reservation failed");
      return;
    }

    toast.success("Reservation submitted");
    router.push("/user/reservations");
    router.refresh();
  }

  return (
    <Card className="mx-auto max-w-6xl">
      <form className="space-y-4" onSubmit={submit}>
        <div>
          <label className="mb-1 block text-[20px] font-medium">Item Type</label>
          <Select value={form.itemType} onChange={(e) => setForm({ ...form, itemType: e.target.value, facilityId: "", equipmentId: "" })}>
            <option value="FACILITY">Facility</option>
            <option value="EQUIPMENT">Equipment</option>
          </Select>
        </div>

        <div>
          <label className="mb-1 block text-[20px] font-medium">Select Item</label>
          <Select
            value={form.itemType === "FACILITY" ? form.facilityId : form.equipmentId}
            onChange={(e) => setForm(form.itemType === "FACILITY" ? { ...form, facilityId: e.target.value } : { ...form, equipmentId: e.target.value })}
            required
          >
            <option value="">Choose one</option>
            {items
              .filter((item) => item.type === form.itemType)
              .map((item) => (
                <option
                  key={`${item.type}-${item.id}`}
                  value={item.id}
                  disabled={item.type === "FACILITY" && item.status === "UNDER_MAINTENANCE"}
                >
                  {item.itemName}
                  {item.type === "FACILITY" && item.status === "UNDER_MAINTENANCE"
                    ? " (Under maintenance)"
                    : ""}
                </option>
              ))}
          </Select>
          {selectedItem ? (
            <div className="mt-2 space-y-1 rounded-xl bg-slate-50 p-3 text-sm text-text-secondary">
              <p>{selectedItem.description || "No description provided."}</p>
              {selectedItem.type === "FACILITY" ? (
                <>
                  <p>Rate: {money(selectedItem.pricePerDay || 0)} per day</p>
                  <p>Status: {selectedItem.status ?? "AVAILABLE"}</p>
                </>
              ) : (
                <>
                  <p>
                    Price:{" "}
                    {selectedItem.price == null ? "Not set" : money(Number(selectedItem.price))}
                  </p>
                  <p>Available quantity: {selectedItem.quantity ?? "Not set"}</p>
                </>
              )}
            </div>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-[20px] font-medium">Start Date & Time</label>
            <Input type="datetime-local" value={form.startDateTime} onChange={(e) => setForm({ ...form, startDateTime: e.target.value })} required />
          </div>
          <div>
            <label className="mb-1 block text-[20px]  font-medium">End Date & Time</label>
            <Input type="datetime-local" value={form.endDateTime} onChange={(e) => setForm({ ...form, endDateTime: e.target.value })} required />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-[20px] font-medium">Purpose</label>
          <Textarea rows={3} value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} required />
        </div>

        <div>
          <label className="mb-1 block text-[20px] font-medium">Expected Attendees</label>
          <Input type="number" min="1" value={form.expectedAttendees} onChange={(e) => setForm({ ...form, expectedAttendees: e.target.value })} />
        </div>

        <Button type="submit">Submit Reservation</Button>
      </form>
    </Card>
  );
}
