"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Modal,
  Textarea,
} from "@/components/common";
import { fmtDateTime, money } from "@/lib/utils";

type Mode = "user" | "admin";
type AdminAction = "APPROVED" | "DENIED" | "RETURNED";
type StatusTone = "yellow" | "green" | "red" | "neutral" | "blue";

type ReservationRow = {
  reservationId: number;
  residentName: string;
  residentEmail: string;
  residentContactNumber: string;
  itemName: string;
  itemType: "FACILITY" | "EQUIPMENT";
  startDateTime: string;
  endDateTime: string;
  purpose: string;
  status: string;
  equipmentReturnStatus?: string | null;
  returnedAt?: string | null;
  itemPrice?: number | string | null;
  equipmentQuantity?: number | null;
  itemQuantity?: number | null;
  expectedAttendees?: number | null;
  adminName?: string | null;
  adminNotes?: string | null;
  facilityId?: number | null;
  equipmentId?: number | null;
};

type DecisionState = {
  action: "APPROVED" | "DENIED";
  reservation: ReservationRow;
};

type PendingState = {
  action: AdminAction;
  reservationId: number;
};

const ADMIN_TABS = [
  "ALL",
  "PENDING",
  "APPROVED",
  "BORROWED",
  "RETURNED",
  "DENIED",
  "CANCELLED",
] as const;

const USER_TABS = ["ALL", "PENDING", "APPROVED", "DENIED", "CANCELLED"] as const;

function statusTone(status: string): StatusTone {
  if (status === "PENDING") return "yellow";
  if (status === "APPROVED") return "green";
  if (status === "BORROWED") return "blue";
  if (status === "RETURNED") return "green";
  if (status === "DENIED" || status === "CANCELLED") return "red";
  return "neutral";
}

function formatStatus(status: string) {
  const normalized = status.replace(/_/g, " ").toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function getDisplayStatus(reservation: ReservationRow, mode: Mode) {
  if (
    mode === "admin" &&
    reservation.itemType === "EQUIPMENT" &&
    reservation.equipmentReturnStatus
  ) {
    return reservation.equipmentReturnStatus;
  }

  return reservation.status;
}

function canReview(reservation: ReservationRow, mode: Mode) {
  return mode === "admin" && reservation.status === "PENDING";
}

function canReturn(reservation: ReservationRow, mode: Mode) {
  return (
    mode === "admin" &&
    reservation.itemType === "EQUIPMENT" &&
    getDisplayStatus(reservation, mode) === "BORROWED"
  );
}

function actionLabel(action: AdminAction) {
  if (action === "APPROVED") return "Approve";
  if (action === "DENIED") return "Deny";
  return "Return Item";
}

function activeLabel(action: AdminAction) {
  if (action === "APPROVED") return "Approving...";
  if (action === "DENIED") return "Denying...";
  return "Returning...";
}

function ReservationActions({
  mode,
  reservation,
  pending,
  onView,
  onApprove,
  onDeny,
  onReturn,
}: {
  mode: Mode;
  reservation: ReservationRow;
  pending: PendingState | null;
  onView: (reservation: ReservationRow) => void;
  onApprove: (reservation: ReservationRow) => void;
  onDeny: (reservation: ReservationRow) => void;
  onReturn: (reservation: ReservationRow) => void;
}) {
  const isRowPending = pending?.reservationId === reservation.reservationId;
  const linkButtonClasses =
    "inline-flex items-center justify-center rounded-lg bg-[#e9f3ea] px-4 py-2 text-sm font-medium text-[#165719] transition hover:bg-[#d8eadb]";

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="secondary"
        disabled={isRowPending}
        onClick={() => onView(reservation)}
      >
        View
      </Button>

      {canReview(reservation, mode) ? (
        <>
          <Button disabled={isRowPending} onClick={() => onApprove(reservation)}>
            {isRowPending && pending?.action === "APPROVED" ? activeLabel("APPROVED") : "Approve"}
          </Button>
          <Button
            variant="danger"
            disabled={isRowPending}
            onClick={() => onDeny(reservation)}
          >
            {isRowPending && pending?.action === "DENIED" ? activeLabel("DENIED") : "Deny"}
          </Button>
        </>
      ) : null}

      {canReturn(reservation, mode) ? (
        <Button
          variant="secondary"
          disabled={isRowPending}
          onClick={() => onReturn(reservation)}
        >
          {isRowPending && pending?.action === "RETURNED" ? activeLabel("RETURNED") : "Return Item"}
        </Button>
      ) : null}

      {mode === "user" && reservation.status === "APPROVED" ? (
        <a
          href={`/api/reservations/${reservation.reservationId}/receipt`}
          className={linkButtonClasses}
        >
          Download
        </a>
      ) : null}

      {mode === "user" && reservation.status === "DENIED" ? (
        <Link
          href={`/user/reservations/new?type=${reservation.itemType}&id=${
            reservation.facilityId || reservation.equipmentId
          }&start=${encodeURIComponent(String(reservation.startDateTime).slice(0, 16))}&end=${encodeURIComponent(
            String(reservation.endDateTime).slice(0, 16)
          )}&purpose=${encodeURIComponent(reservation.purpose)}&expectedAttendees=${
            reservation.expectedAttendees || ""
          }&quantity=${reservation.equipmentQuantity || ""}`}
          className={linkButtonClasses}
        >
          Resubmit
        </Link>
      ) : null}
    </div>
  );
}

export function ReservationsTable({ mode }: { mode: Mode }) {
  const [items, setItems] = useState<ReservationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("ALL");
  const [view, setView] = useState<ReservationRow | null>(null);
  const [decision, setDecision] = useState<DecisionState | null>(null);
  const [returning, setReturning] = useState<ReservationRow | null>(null);
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState<PendingState | null>(null);

  async function readJson<T>(res: Response): Promise<T | null> {
    const text = await res.text();

    if (!text) {
      return null;
    }

    try {
      return JSON.parse(text) as T;
    } catch {
      return null;
    }
  }

  async function load() {
    setLoading(true);

    try {
      const res = await fetch(`/api/reservations${mode === "admin" ? "?scope=all" : ""}`);
      const data = await readJson<ReservationRow[]>(res);

      if (!res.ok) {
        const message =
          data && typeof data === "object" && "error" in data && typeof data.error === "string"
            ? data.error
            : "Failed to load reservations";

        throw new Error(message);
      }

      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load reservations", error);
      setItems([]);
      toast.error(error instanceof Error ? error.message : "Failed to load reservations");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [mode]);

  function closeDecisionModal() {
    if (pending?.reservationId === decision?.reservation.reservationId) {
      return;
    }

    setDecision(null);
    setNotes("");
  }

  function closeReturnModal() {
    if (pending?.reservationId === returning?.reservationId) {
      return;
    }

    setReturning(null);
  }

  async function submitAdminAction(action: AdminAction, reservation: ReservationRow, adminNotes?: string) {
    if (pending?.reservationId === reservation.reservationId) {
      return;
    }

    setPending({ action, reservationId: reservation.reservationId });

    try {
      const res = await fetch(`/api/reservations/${reservation.reservationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: action,
          adminNotes: adminNotes || undefined,
        }),
      });
      const data = await readJson<ReservationRow & { error?: string; details?: Record<string, string[]> }>(res);

      if (!res.ok) {
        const message =
          data?.details?.adminNotes?.[0] ||
          data?.error ||
          "Action failed";

        throw new Error(message);
      }

      setDecision(null);
      setReturning(null);
      setNotes("");

      if (data) {
        setView((current) =>
          current?.reservationId === reservation.reservationId ? data : current
        );
      }

      toast.success(
        action === "RETURNED"
          ? "Equipment marked as returned"
          : `Reservation ${action.toLowerCase()}`
      );

      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed");
    } finally {
      setPending(null);
    }
  }

  async function handleDecisionSubmit() {
    if (!decision) {
      return;
    }

    const trimmedNotes = notes.trim();
    if (decision.action === "DENIED" && !trimmedNotes) {
      toast.error("A denial reason is required");
      return;
    }

    await submitAdminAction(decision.action, decision.reservation, trimmedNotes);
  }

  async function handleReturnSubmit() {
    if (!returning) {
      return;
    }

    await submitAdminAction("RETURNED", returning);
  }

  const tabs = mode === "admin" ? ADMIN_TABS : USER_TABS;
  const filtered = items.filter((reservation) => {
    const text = `${reservation.reservationId} ${reservation.residentName} ${reservation.itemName}`.toLowerCase();
    const matchesSearch = text.includes(search.toLowerCase());
    const matchesTab = tab === "ALL" || getDisplayStatus(reservation, mode) === tab;
    return matchesSearch && matchesTab;
  });

  const trimmedNotes = notes.trim();
  const decisionIsPending =
    pending?.reservationId === decision?.reservation.reservationId &&
    pending?.action === decision?.action;
  const returnIsPending =
    pending?.reservationId === returning?.reservationId && pending?.action === "RETURNED";

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-col gap-3">
          <Input
            placeholder="Search reservations"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {tabs.map((status) => (
              <Button
                key={status}
                className="shrink-0 whitespace-nowrap"
                variant={tab === status ? "primary" : "secondary"}
                onClick={() => setTab(status)}
              >
                {formatStatus(status)}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {loading ? (
        <Card>
          <p className="text-sm text-text-secondary">Loading reservations...</p>
        </Card>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No reservations found"
          description="Try adjusting the search text or selected status filter."
        />
      ) : (
        <>
          {mode === "admin" ? (
            <div className="space-y-3 md:hidden">
              {filtered.map((row) => {
                const displayStatus = getDisplayStatus(row, mode);

                return (
                  <Card key={row.reservationId} className="p-4">
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
                            Reservation #{row.reservationId}
                          </p>
                          <p className="mt-1 text-lg font-semibold text-text-primary">
                            {row.itemName}
                          </p>
                        </div>
                        <Badge tone={statusTone(displayStatus)}>
                          {formatStatus(displayStatus)}
                        </Badge>
                      </div>

                      <div className="grid gap-3 text-sm text-text-secondary">
                        <p>
                          <strong className="text-text-primary">Resident:</strong>{" "}
                          {row.residentName}
                        </p>
                        <p>
                          <strong className="text-text-primary">Schedule:</strong>{" "}
                          {fmtDateTime(row.startDateTime)} - {fmtDateTime(row.endDateTime)}
                        </p>
                        <p>
                          <strong className="text-text-primary">Type:</strong>{" "}
                          {formatStatus(row.itemType)}
                        </p>
                      </div>

                      <ReservationActions
                        mode={mode}
                        reservation={row}
                        pending={pending}
                        onView={setView}
                        onApprove={(reservation) => {
                          setDecision({ action: "APPROVED", reservation });
                          setNotes("");
                        }}
                        onDeny={(reservation) => {
                          setDecision({ action: "DENIED", reservation });
                          setNotes("");
                        }}
                        onReturn={setReturning}
                      />
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : null}

          <Card className={mode === "admin" ? "hidden overflow-x-auto md:block" : "overflow-x-auto"}>
            <table className="min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-border text-sm text-text-secondary">
                  <th className="py-3 pr-4">ID</th>
                  <th className="py-3 pr-4">Resident Name</th>
                  <th className="py-3 pr-4">Facility/Equipment</th>
                  <th className="py-3 pr-4">Date & Time</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const displayStatus = getDisplayStatus(row, mode);

                  return (
                    <tr key={row.reservationId} className="border-b border-border align-top">
                      <td className="py-3 pr-4">{row.reservationId}</td>
                      <td className="py-3 pr-4">{row.residentName}</td>
                      <td className="py-3 pr-4">{row.itemName}</td>
                      <td className="py-3 pr-4">
                        {fmtDateTime(row.startDateTime)} - {fmtDateTime(row.endDateTime)}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge tone={statusTone(displayStatus)}>
                          {formatStatus(displayStatus)}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4">
                        <ReservationActions
                          mode={mode}
                          reservation={row}
                          pending={pending}
                          onView={setView}
                          onApprove={(reservation) => {
                            setDecision({ action: "APPROVED", reservation });
                            setNotes("");
                          }}
                          onDeny={(reservation) => {
                            setDecision({ action: "DENIED", reservation });
                            setNotes("");
                          }}
                          onReturn={setReturning}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </>
      )}

      <Modal open={!!view} title="Reservation Details" onClose={() => setView(null)}>
        {view ? (
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <p className="break-words">
              <strong>ID:</strong> {view.reservationId}
            </p>
            <p className="break-words">
              <strong>Status:</strong> {formatStatus(getDisplayStatus(view, mode))}
            </p>
            <p className="break-words">
              <strong>Name:</strong> {view.residentName}
            </p>
            <p className="break-words">
              <strong>Email:</strong> {view.residentEmail}
            </p>
            <p className="break-words">
              <strong>Contact:</strong> {view.residentContactNumber}
            </p>
            <p className="break-words">
              <strong>Item:</strong> {view.itemName}
            </p>
            <p className="break-words">
              <strong>Type:</strong> {formatStatus(view.itemType)}
            </p>
            <p className="break-words sm:col-span-2">
              <strong>Schedule:</strong> {fmtDateTime(view.startDateTime)} -{" "}
              {fmtDateTime(view.endDateTime)}
            </p>
            <p className="break-words sm:col-span-2">
              <strong>Purpose:</strong> {view.purpose}
            </p>
            <p className="break-words">
              <strong>Price:</strong> {money(Number(view.itemPrice || 0))}
            </p>
            <p className="break-words">
              <strong>Reviewed By:</strong> {view.adminName ?? "Pending review"}
            </p>
            {view.itemType === "EQUIPMENT" ? (
              <>
                <p className="break-words">
                  <strong>Requested Quantity:</strong> {view.equipmentQuantity ?? "N/A"}
                </p>
                <p className="break-words">
                  <strong>Quantity Available:</strong> {view.itemQuantity ?? "Not set"}
                </p>
                <p className="break-words">
                  <strong>Returned At:</strong>{" "}
                  {view.returnedAt ? fmtDateTime(view.returnedAt) : "Not returned"}
                </p>
              </>
            ) : (
              <p className="break-words">
                <strong>Expected Attendees:</strong> {view.expectedAttendees ?? "N/A"}
              </p>
            )}
            {view.adminNotes ? (
              <p className="break-words sm:col-span-2">
                <strong>Denial Reason:</strong> {view.adminNotes}
              </p>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <Modal
        open={!!returning}
        title="Return Item"
        onClose={closeReturnModal}
        footer={
          <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row">
            <Button
              variant="ghost"
              className="w-full sm:w-auto"
              disabled={returnIsPending}
              onClick={closeReturnModal}
            >
              Cancel
            </Button>
            <Button
              className="w-full sm:w-auto"
              disabled={returnIsPending}
              onClick={() => void handleReturnSubmit()}
            >
              {returnIsPending ? activeLabel("RETURNED") : actionLabel("RETURNED")}
            </Button>
          </div>
        }
      >
        <div className="space-y-2 text-sm text-text-secondary">
          <p>Are you sure you want to mark this item as returned?</p>
          <p>
            <strong>Reservation ID:</strong> {returning?.reservationId}
          </p>
          <p>
            <strong>Item:</strong> {returning?.itemName}
          </p>
          <p>
            <strong>Resident:</strong> {returning?.residentName}
          </p>
        </div>
      </Modal>

      <Modal
        open={!!decision}
        title={decision?.action === "DENIED" ? "Deny Reservation" : "Approve Reservation"}
        onClose={closeDecisionModal}
        footer={
          <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row">
            <Button
              variant="ghost"
              className="w-full sm:w-auto"
              disabled={decisionIsPending}
              onClick={closeDecisionModal}
            >
              Cancel
            </Button>
            <Button
              variant={decision?.action === "DENIED" ? "danger" : "primary"}
              className="w-full sm:w-auto"
              disabled={decisionIsPending || (decision?.action === "DENIED" && !trimmedNotes)}
              onClick={() => void handleDecisionSubmit()}
            >
              {decision?.action
                ? decisionIsPending
                  ? activeLabel(decision.action)
                  : actionLabel(decision.action)
                : "Save"}
            </Button>
          </div>
        }
      >
        {decision?.action === "DENIED" ? (
          <div className="space-y-4">
            <p>Please provide a clear reason that will be included in the resident email.</p>
            <Textarea
              rows={4}
              placeholder="Enter the reason for denying this reservation"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            {!trimmedNotes ? (
              <p className="text-sm text-red-600">
                A denial reason is required before this request can be denied.
              </p>
            ) : null}
          </div>
        ) : (
          <div className="space-y-2 text-sm text-text-secondary">
            <p>
              Approving this request will notify the resident by email and include the
              full reservation details.
            </p>
            <p>
              <strong>Reservation ID:</strong> {decision?.reservation.reservationId}
            </p>
            <p>
              <strong>Item:</strong> {decision?.reservation.itemName}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
