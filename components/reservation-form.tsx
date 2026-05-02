"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { Button, Card, Input, Select, Textarea } from "@/components/common";
import { fetchJson, getJsonErrorMessage } from "@/lib/fetch-json";
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

function pad(value: number | string) {
  return String(value).padStart(2, "0");
}

function convert24hTo12h(value: string) {
  const [hourPart, minutePart] = value.split(":");
  const hour24 = Number(hourPart);
  const minute = Number(minutePart);

  if (Number.isNaN(hour24) || Number.isNaN(minute)) {
    return { hour: "08", minute: "00", period: "AM" as const };
  }

  const period: "AM" | "PM" = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;

  return {
    hour: pad(hour12),
    minute: pad(minute),
    period,
  };
}

function convert12hTo24h(
  hour: string,
  minute: string,
  period: "AM" | "PM"
) {
  const parsedHour = Number(hour);
  const parsedMinute = Number(minute);

  if (
    Number.isNaN(parsedHour) ||
    Number.isNaN(parsedMinute) ||
    parsedHour < 1 ||
    parsedHour > 12 ||
    parsedMinute < 0 ||
    parsedMinute > 59
  ) {
    return "";
  }

  let hour24 = parsedHour;

  if (period === "AM" && parsedHour === 12) {
    hour24 = 0;
  } else if (period === "PM" && parsedHour !== 12) {
    hour24 = parsedHour + 12;
  }

  return `${pad(hour24)}:${pad(parsedMinute)}`;
}

function TimeField({
  label,
  hour,
  minute,
  period,
  onHourChange,
  onMinuteChange,
  onPeriodChange,
}: {
  label: string;
  hour: string;
  minute: string;
  period: "AM" | "PM";
  onHourChange: (value: string) => void;
  onMinuteChange: (value: string) => void;
  onPeriodChange: (value: "AM" | "PM") => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-base font-medium sm:text-lg">{label}</label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="grid min-w-0 flex-1 grid-cols-[1fr_auto_1fr] items-center gap-3">
          <Input
            type="number"
            min="1"
            max="12"
            value={hour}
            onChange={(e) => onHourChange(e.target.value)}
            placeholder="HH"
            required
          />

          <span className="text-center text-xl font-semibold text-slate-600">:</span>

          <Input
            type="number"
            min="0"
            max="59"
            value={minute}
            onChange={(e) => onMinuteChange(e.target.value)}
            placeholder="MM"
            required
          />
        </div>

        <div className="sm:w-[120px]">
          <Select
            value={period}
            onChange={(e) => onPeriodChange(e.target.value as "AM" | "PM")}
          >
            <option value="AM">AM</option>
            <option value="PM">PM</option>
          </Select>
        </div>
      </div>
    </div>
  );
}

export function ReservationForm({ userId }: { userId: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const submissionLockRef = useRef(false);
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    itemType: "FACILITY",
    facilityId: "",
    equipmentId: "",
    equipmentQuantity: "",
    startDate: "",
    startHour: "08",
    startMinute: "00",
    startPeriod: "AM" as "AM" | "PM",
    endDate: "",
    endHour: "05",
    endMinute: "00",
    endPeriod: "PM" as "AM" | "PM",
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
    const rawType = searchParams.get("type");
    const normalizedType =
      rawType?.toUpperCase() === "FACILITY"
        ? "FACILITY"
        : rawType?.toUpperCase() === "EQUIPMENT"
          ? "EQUIPMENT"
          : null;

    const genericId = searchParams.get("id");
    const facilityId = searchParams.get("facilityId");
    const equipmentId = searchParams.get("equipmentId");
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    const purpose = searchParams.get("purpose");
    const expected = searchParams.get("expectedAttendees");
    const quantity = searchParams.get("quantity");

    if (normalizedType) {
      setForm((prev) => ({
        ...prev,
        itemType: normalizedType,
        facilityId: normalizedType === "FACILITY" ? prev.facilityId : "",
        equipmentId: normalizedType === "EQUIPMENT" ? prev.equipmentId : "",
      }));
    }

    if (normalizedType === "FACILITY") {
      const selectedFacilityId = facilityId || genericId;
      if (selectedFacilityId) {
        setForm((prev) => ({
          ...prev,
          facilityId: String(selectedFacilityId),
          equipmentId: "",
        }));
      }
    }

    if (normalizedType === "EQUIPMENT") {
      const selectedEquipmentId = equipmentId || genericId;
      if (selectedEquipmentId) {
        setForm((prev) => ({
          ...prev,
          equipmentId: String(selectedEquipmentId),
          facilityId: "",
        }));
      }
    }

    if (quantity) {
      setForm((prev) => ({ ...prev, equipmentQuantity: quantity }));
    }

    if (start && normalizedType === "FACILITY") {
      const [startDate, startTime] = start.split("T");
      const convertedStart = startTime
        ? convert24hTo12h(startTime.slice(0, 5))
        : null;

      setForm((prev) => ({
        ...prev,
        startDate: startDate || prev.startDate,
        startHour: convertedStart ? convertedStart.hour : prev.startHour,
        startMinute: convertedStart ? convertedStart.minute : prev.startMinute,
        startPeriod: convertedStart ? convertedStart.period : prev.startPeriod,
      }));
    }

    if (end && normalizedType === "FACILITY") {
      const [endDate, endTime] = end.split("T");
      const convertedEnd = endTime
        ? convert24hTo12h(endTime.slice(0, 5))
        : null;

      setForm((prev) => ({
        ...prev,
        endDate: endDate || prev.endDate,
        endHour: convertedEnd ? convertedEnd.hour : prev.endHour,
        endMinute: convertedEnd ? convertedEnd.minute : prev.endMinute,
        endPeriod: convertedEnd ? convertedEnd.period : prev.endPeriod,
      }));
    }

    if (purpose) {
      setForm((prev) => ({ ...prev, purpose }));
    }

    if (expected) {
      setForm((prev) => ({ ...prev, expectedAttendees: expected }));
    }
  }, [searchParams]);

  const selectableItems = useMemo(() => {
    return items.filter((item) => item.type === form.itemType);
  }, [items, form.itemType]);

  useEffect(() => {
    if (selectableItems.length === 0) return;

    if (form.itemType === "FACILITY") {
      const hasValidFacility = selectableItems.some(
        (item) => String(item.id) === form.facilityId
      );

      if (!hasValidFacility) {
        const firstAvailableFacility = selectableItems.find(
          (item) => item.status !== "UNDER_MAINTENANCE"
        );

        if (firstAvailableFacility) {
          setForm((prev) => ({
            ...prev,
            facilityId: String(firstAvailableFacility.id),
          }));
        }
      }
    } else {
      const hasValidEquipment = selectableItems.some(
        (item) => String(item.id) === form.equipmentId
      );

      if (!hasValidEquipment) {
        setForm((prev) => ({
          ...prev,
          equipmentId: String(selectableItems[0].id),
          equipmentQuantity: "",
        }));
      }
    }
  }, [selectableItems, form.itemType, form.facilityId, form.equipmentId]);

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

    const startTime24 = convert12hTo24h(
      form.startHour,
      form.startMinute,
      form.startPeriod
    );
    const endTime24 = convert12hTo24h(
      form.endHour,
      form.endMinute,
      form.endPeriod
    );

    if (isFacility) {
      if (!startTime24) {
        toast.error("Please enter a valid start time.");
        return;
      }

      if (!endTime24) {
        toast.error("Please enter a valid end time.");
        return;
      }
    }

    if (quantityExceeds) {
      toast.error("Selected quantity exceeds the available quantity.");
      return;
    }

    if (submissionLockRef.current) {
      return;
    }

    const startDateTime = isFacility
      ? form.startDate && startTime24
        ? `${form.startDate}T${startTime24}`
        : ""
      : form.startDate
        ? `${form.startDate}T00:00`
        : "";

    const endDateTime = isFacility
      ? form.endDate && endTime24
        ? `${form.endDate}T${endTime24}`
        : ""
      : form.endDate
        ? `${form.endDate}T23:59`
        : "";

    submissionLockRef.current = true;
    setIsSubmitting(true);

    try {
      console.info("[reservation-form] submitting reservation request", {
        itemType: form.itemType,
        facilityId: form.facilityId || null,
        equipmentId: form.equipmentId || null,
        startDateTime,
        endDateTime,
      });

      const { response, data } = await fetchJson<{
        error?: string;
        message?: string;
        mailWarning?: string | null;
      }>("/api/reservations", {
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

      console.info("[reservation-form] reservation API responded", {
        ok: response.ok,
        status: response.status,
        message: data?.message ?? null,
        mailWarning: data?.mailWarning ?? null,
      });

      if (!response.ok) {
        submissionLockRef.current = false;
        setIsSubmitting(false);
        toast.error(getJsonErrorMessage(data, "Reservation failed"));
        return;
      }

      toast.success(data?.message || "Reservation submitted");
      if (data?.mailWarning) {
        toast.error(data.mailWarning);
      }
      submissionLockRef.current = false;
      setIsSubmitting(false);
      router.push("/user/reservations");
      router.refresh();
    } catch (error) {
      submissionLockRef.current = false;
      setIsSubmitting(false);
      console.error("[reservation-form] reservation submission failed", error);
      toast.error("Reservation failed");
    }
  }

  return (
    <Card className="mx-auto max-w-6xl">
      <form className="space-y-4" onSubmit={submit}>
        <div>
          <label className="mb-1 block text-base font-medium sm:text-lg">Item Type</label>
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
                startHour: "08",
                startMinute: "00",
                startPeriod: "AM",
                endHour: "05",
                endMinute: "00",
                endPeriod: "PM",
              }))
            }
          >
            <option value="FACILITY">Facility</option>
            <option value="EQUIPMENT">Equipment</option>
          </Select>
        </div>

        <div>
          <label className="mb-1 block text-base font-medium sm:text-lg">Select Item</label>
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
                value={String(item.id)}
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
            <label className="mb-1 block text-base font-medium sm:text-lg">
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
            <label className="mb-1 block text-base font-medium sm:text-lg">Quantity</label>
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
            <label className="mb-1 block text-base font-medium sm:text-lg">Start Date</label>
            <Input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-base font-medium sm:text-lg">End Date</label>
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
            <TimeField
              label="Start Time"
              hour={form.startHour}
              minute={form.startMinute}
              period={form.startPeriod}
              onHourChange={(value) =>
                setForm((prev) => ({ ...prev, startHour: value }))
              }
              onMinuteChange={(value) =>
                setForm((prev) => ({ ...prev, startMinute: value }))
              }
              onPeriodChange={(value) =>
                setForm((prev) => ({ ...prev, startPeriod: value }))
              }
            />

            <TimeField
              label="End Time"
              hour={form.endHour}
              minute={form.endMinute}
              period={form.endPeriod}
              onHourChange={(value) =>
                setForm((prev) => ({ ...prev, endHour: value }))
              }
              onMinuteChange={(value) =>
                setForm((prev) => ({ ...prev, endMinute: value }))
              }
              onPeriodChange={(value) =>
                setForm((prev) => ({ ...prev, endPeriod: value }))
              }
            />
          </div>
        ) : null}

        <div>
          <label className="mb-1 block text-base font-medium sm:text-lg">Purpose</label>
          <Textarea
            rows={3}
            value={form.purpose}
            onChange={(e) => setForm((prev) => ({ ...prev, purpose: e.target.value }))}
            required
          />
        </div>

        <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Reservation"}
        </Button>
      </form>
    </Card>
  );
}
