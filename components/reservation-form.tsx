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

const FACILITY_DEFAULT_RATE = 500;

export function ReservationForm({ userId }: { userId: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [form, setForm] = useState({
    itemType: "FACILITY",
    facilityId: "",
    equipmentId: "",
    equipmentQuantity: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    purpose: "",
    expectedAttendees: "",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/facilities").then((r) => r.json()),
      fetch("/api/equipment").then((r) => r.json()),
    ]).then(([facilities, equipment]) => {
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
    const quantity = searchParams.get("quantity");

    if (type === "FACILITY" || type === "EQUIPMENT") {
      setForm((prev) => ({ ...prev, itemType: type }));
    }

    if (id) {
      if (type === "EQUIPMENT") {
        setForm((prev) => ({ ...prev, equipmentId: id }));
      } else {
        setForm((prev) => ({ ...prev, facilityId: id }));
      }
    }

    if (quantity) setForm((prev) => ({ ...prev, equipmentQuantity: quantity }));

    if (start && type === "FACILITY") {
      const [startDate, startTime] = start.split("T");
      setForm((prev) => ({
        ...prev,
        startDate: startDate || prev.startDate,
        startTime: startTime ? startTime.slice(0, 5) : prev.startTime,
      }));
    }

    if (end && type === "FACILITY") {
      const [endDate, endTime] = end.split("T");
      setForm((prev) => ({
        ...prev,
        endDate: endDate || prev.endDate,
        endTime: endTime ? endTime.slice(0, 5) : prev.endTime,
      }));
    }

    if (purpose) setForm((prev) => ({ ...prev, purpose }));
    if (expected) setForm((prev) => ({ ...prev, expectedAttendees: expected }));
  }, [searchParams]);

  const selectedItem = useMemo(() => {
    const selectedId =
      form.itemType === "FACILITY" ? form.facilityId : form.equipmentId;

    return items.find(
      (item) => item.type === form.itemType && String(item.id) === selectedId
    );
  }, [items, form.itemType, form.facilityId, form.equipmentId]);

  const isFacility = form.itemType === "FACILITY";
  const isEquipment = form.itemType === "EQUIPMENT";

  const facilityRate = selectedItem?.pricePerDay ?? FACILITY_DEFAULT_RATE;
  const halfDayRate = facilityRate / 2;
  const availableQuantity = selectedItem?.quantity ?? null;

  const selectedEquipmentQuantity =
    form.equipmentQuantity === "" ? null : Number(form.equipmentQuantity);

  const quantityExceeds =
    isEquipment &&
    selectedEquipmentQuantity !== null &&
    availableQuantity !== null &&
    selectedEquipmentQuantity > availableQuantity;

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    if (quantityExceeds) {
      toast.error("Selected quantity exceeds the available quantity.");
      return;
    }

    const startDateTime = isFacility
      ? form.startDate && form.startTime
        ? `${form.startDate}T${form.startTime}`
        : ""
      : form.startDate
      ? `${form.startDate}T00:00`
      : "";

    const endDateTime = isFacility
      ? form.endDate && form.endTime
        ? `${form.endDate}T${form.endTime}`
        : ""
      : form.endDate
      ? `${form.endDate}T23:59`
      : "";

    const res = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemType: form.itemType,
        facilityId: form.itemType === "FACILITY" ? Number(form.facilityId) : null,
        equipmentId: form.itemType === "EQUIPMENT" ? Number(form.equipmentId) : null,
        equipmentQuantity:
          form.itemType === "EQUIPMENT" && form.equipmentQuantity !== ""
            ? Number(form.equipmentQuantity)
            : null,
        startDateTime,
        endDateTime,
        purpose: form.purpose,
        expectedAttendees:
          form.itemType === "FACILITY" && form.expectedAttendees
            ? Number(form.expectedAttendees)
            : null,
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

  const selectableItems = items.filter((item) => item.type === form.itemType);

  return (
    <Card className="mx-auto max-w-6xl">
      <form className="space-y-4" onSubmit={submit}>
        <div>
          <label className="mb-1 block text-[20px] font-medium">Item Type</label>
          <Select
            value={form.itemType}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                itemType: e.target.value,
                facilityId: "",
                equipmentId: "",
                equipmentQuantity: "",
                expectedAttendees: "",
                startTime: "",
                endTime: "",
              }))
            }
          >
            <option value="FACILITY">Facility</option>
            <option value="EQUIPMENT">Equipment</option>
          </Select>
        </div>

        <div>
          <label className="mb-1 block text-[20px] font-medium">Select Item</label>
          <Select
            value={form.itemType === "FACILITY" ? form.facilityId : form.equipmentId}
            onChange={(e) =>
              setForm((prev) =>
                prev.itemType === "FACILITY"
                  ? { ...prev, facilityId: e.target.value }
                  : { ...prev, equipmentId: e.target.value, equipmentQuantity: "" }
              )
            }
            required
          >
            {selectableItems.map((item) => (
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
              {selectedItem.type === "FACILITY" ? (
                <>
                  <p>{selectedItem.description || "No description provided."}</p>
                  <p>Price per day: {money(facilityRate)}</p>
                  <p>Half-day rate: {money(halfDayRate)}</p>
                  <p>Status: {selectedItem.status ?? "AVAILABLE"}</p>
                </>
              ) : (
                <>
                  <p>
                    Price:{" "}
                    {selectedItem.price == null
                      ? "Not set"
                      : money(Number(selectedItem.price))}
                  </p>
                  <p>Available quantity: {selectedItem.quantity ?? "Not set"}</p>
                </>
              )}
            </div>
          ) : null}
        </div>

        {isFacility ? (
          <div>
            <label className="mb-1 block text-[20px] font-medium">
              Expected Attendees
            </label>
            <Input
              type="number"
              min="1"
              value={form.expectedAttendees}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, expectedAttendees: e.target.value }))
              }
            />
          </div>
        ) : null}

        {isEquipment ? (
          <div>
            <label className="mb-1 block text-[20px] font-medium">Quantity</label>
            <Input
              type="number"
              min="1"
              max={availableQuantity ?? undefined}
              value={form.equipmentQuantity}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, equipmentQuantity: e.target.value }))
              }
              required
            />
            {quantityExceeds ? (
              <p className="mt-1 text-sm text-red-600">
                Selected quantity exceeds the available quantity.
              </p>
            ) : null}
            {availableQuantity != null ? (
              <p className="mt-1 text-sm text-text-secondary">
                Maximum available: {availableQuantity}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-[20px] font-medium">Start Date</label>
            <Input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-[20px] font-medium">End Date</label>
            <Input
              type="date"
              value={form.endDate}
              onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
              required
            />
          </div>
        </div>

        {isFacility ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-[20px] font-medium">Start Time</label>
              <Input
                type="time"
                value={form.startTime}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, startTime: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-[20px] font-medium">End Time</label>
              <Input
                type="time"
                value={form.endTime}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, endTime: e.target.value }))
                }
                required
              />
            </div>
          </div>
        ) : null}

        <div>
          <label className="mb-1 block text-[20px] font-medium">Purpose</label>
          <Textarea
            rows={3}
            value={form.purpose}
            onChange={(e) => setForm((prev) => ({ ...prev, purpose: e.target.value }))}
            required
          />
        </div>

        <Button type="submit">Submit Reservation</Button>
      </form>
    </Card>
  );
}