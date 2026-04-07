"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { Button, Card, Input, Select, Textarea } from "@/components/common";

export function ReservationForm({ userId }: { userId: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({
    itemType: "FACILITY",
    facilityId: "",
    equipmentId: "",
    startDateTime: "",
    endDateTime: "",
    purpose: "",
    expectedAttendees: ""
  });

  useEffect(() => {
    Promise.all([fetch("/api/facilities").then((r) => r.json()), fetch("/api/equipment").then((r) => r.json())]).then(([facilities, equipment]) => {
      setItems([
        ...facilities.map((f: any) => ({ ...f, type: "FACILITY", id: f.facilityId })),
        ...equipment.map((e: any) => ({ ...e, type: "EQUIPMENT", id: e.equipmentId }))
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

    if (type) setForm((p) => ({ ...p, itemType: type }));
    if (id) {
      if (type === "EQUIPMENT") setForm((p) => ({ ...p, equipmentId: id }));
      else setForm((p) => ({ ...p, facilityId: id }));
    }
    if (start) setForm((p) => ({ ...p, startDateTime: start }));
    if (end) setForm((p) => ({ ...p, endDateTime: end }));
    if (purpose) setForm((p) => ({ ...p, purpose }));
    if (expected) setForm((p) => ({ ...p, expectedAttendees: expected }));
  }, [searchParams]);

  const selectedItem = useMemo(() => {
    return items.find((item) => String(item.id) === (form.itemType === "FACILITY" ? form.facilityId : form.equipmentId));
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
        userId
      })
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
    <Card className="mx-auto max-w-3xl">
      <form className="space-y-4" onSubmit={submit}>
        <div>
          <label className="mb-1 block text-sm font-medium">Item Type</label>
          <Select value={form.itemType} onChange={(e) => setForm({ ...form, itemType: e.target.value, facilityId: "", equipmentId: "" })}>
            <option value="FACILITY">Facility</option>
            <option value="EQUIPMENT">Equipment</option>
          </Select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Select Item</label>
          <Select
            value={form.itemType === "FACILITY" ? form.facilityId : form.equipmentId}
            onChange={(e) => setForm(form.itemType === "FACILITY" ? { ...form, facilityId: e.target.value } : { ...form, equipmentId: e.target.value })}
            required
          >
            <option value="">Choose one</option>
            {items.filter((item) => item.type === form.itemType).map((item) => (
              <option key={`${item.type}-${item.id}`} value={item.id}>{item.itemName}</option>
            ))}
          </Select>
          {selectedItem ? <p className="mt-1 text-sm text-text-secondary">{selectedItem.description}</p> : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Start Date & Time</label>
            <Input type="datetime-local" value={form.startDateTime} onChange={(e) => setForm({ ...form, startDateTime: e.target.value })} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">End Date & Time</label>
            <Input type="datetime-local" value={form.endDateTime} onChange={(e) => setForm({ ...form, endDateTime: e.target.value })} required />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Purpose</label>
          <Textarea rows={3} value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} required />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Expected Attendees</label>
          <Input type="number" value={form.expectedAttendees} onChange={(e) => setForm({ ...form, expectedAttendees: e.target.value })} />
        </div>

        <Button type="submit">Submit Reservation</Button>
      </form>
    </Card>
  );
}
