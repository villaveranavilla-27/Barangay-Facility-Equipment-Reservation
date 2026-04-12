"use client";

import { useEffect, useState } from "react";
import { Badge, Button, Card, Modal, Input, Textarea } from "@/components/common";
import toast from "react-hot-toast";
import { fmtDateTime, money } from "@/lib/utils";
import Link from "next/link";

function statusTone(status: string): "yellow" | "green" | "red" | "neutral" {
  if (status === "PENDING") return "yellow";
  if (status === "APPROVED") return "green";
  if (status === "DENIED" || status === "CANCELLED") return "red";
  return "neutral";
}

export function ReservationsTable({ mode }: { mode: "user" | "admin" }) {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("ALL");
  const [view, setView] = useState<any | null>(null);
  const [decision, setDecision] = useState<any | null>(null);
  const [notes, setNotes] = useState("");

  async function load() {
    const res = await fetch(`/api/reservations${mode === "admin" ? "?scope=all" : ""}`);
    const data = await res.json();
    setItems(data);
  }

  useEffect(() => {
    load();
  }, [mode]);

  const filtered = items.filter((reservation) => {
    const text = `${reservation.reservationId} ${reservation.residentName} ${reservation.itemName}`.toLowerCase();
    const matchesSearch = text.includes(search.toLowerCase());
    const matchesTab = tab === "ALL" || reservation.status === tab;
    return matchesSearch && matchesTab;
  });

  async function decide(status: "APPROVED" | "DENIED") {
    const res = await fetch(`/api/reservations/${decision.reservationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, adminNotes: notes }),
    });
    if (res.ok) {
      toast.success(`Reservation ${status.toLowerCase()}`);
      setDecision(null);
      setNotes("");
      await load();
    } else {
      toast.error("Action failed");
    }
  }

  const buttonClasses = "inline-flex items-center justify-center rounded- px-3 py-2 text-sm font-medium transition-colors bg-secondary text-secondary-foreground hover:bg-secondary/80";

  return (
    <div className="space-y-4">
      <Card>
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <Input placeholder="Search Here" value={search} onChange={(e) => setSearch(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            {["ALL", "PENDING", "APPROVED", "DENIED", "CANCELLED"].map((status) => (
              <Button key={status} variant={tab === status ? "primary" : "secondary"} onClick={() => setTab(status)}>
                {status}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="overflow-x-auto">
        <table className="min-w-full text-left">
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
            {filtered.map((row) => (
              <tr key={row.reservationId} className="border-b border-border">
                <td className="py-3 pr-4">{row.reservationId}</td>
                <td className="py-3 pr-4">{row.residentName}</td>
                <td className="py-3 pr-4">{row.itemName}</td>
                <td className="py-3 pr-4">
                  {fmtDateTime(row.startDateTime)} - {fmtDateTime(row.endDateTime)}
                </td>
                <td className="py-3 pr-4">
                  <Badge tone={statusTone(row.status)}>{row.status}</Badge>
                </td>
                <td className="py-3 pr-4">
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" onClick={() => setView(row)}>
                      View
                    </Button>

                    {mode === "admin" && row.status === "PENDING" && (
                      <>
                        <Button onClick={() => setDecision(row)}>Approve</Button>
                        <Button variant="danger" onClick={() => setDecision({ ...row, reject: true })}>
                          Deny
                        </Button>
                      </>
                    )}

                    {mode === "user" && row.status === "APPROVED" && (
                      <a href={`/api/reservations/${row.reservationId}/receipt`} className={buttonClasses}>
                        Download
                      </a>
                    )}

                    {mode === "user" && row.status === "DENIED" && (
                      <Link
                        href={`/user/reservations/new?type=${row.itemType}&id=${row.facilityId || row.equipmentId}&start=${encodeURIComponent(String(row.startDateTime).slice(0, 16))}&end=${encodeURIComponent(String(row.endDateTime).slice(0, 16))}&purpose=${encodeURIComponent(row.purpose)}&expectedAttendees=${row.expectedAttendees || ""}`}
                        className={buttonClasses}
                      >
                        Resubmit
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Modal open={!!view} title="Reservation Details" onClose={() => setView(null)}>
        {view && (
          <div className="space-y-2 text-sm">
            <p><strong>ID:</strong> {view.reservationId}</p>
            <p><strong>Name:</strong> {view.residentName}</p>
            <p><strong>Item:</strong> {view.itemName}</p>
            <p><strong>Type:</strong> {view.itemType}</p>
            <p><strong>Purpose:</strong> {view.purpose}</p>
            <p><strong>Status:</strong> {view.status}</p>
            <p><strong>Schedule:</strong> {fmtDateTime(view.startDateTime)} - {fmtDateTime(view.endDateTime)}</p>
            <p><strong>Price:</strong> {money(Number(view.itemPrice || 0))}</p>
            {view.itemType === "EQUIPMENT" ? (
              <p><strong>Quantity Available:</strong> {view.itemQuantity ?? "Not set"}</p>
            ) : null}
            <p><strong>Expected Attendees:</strong> {view.expectedAttendees ?? "N/A"}</p>
          </div>
        )}
      </Modal>

      <Modal
        open={!!decision}
        title={decision?.reject ? "Deny Reservation" : "Approve Reservation"}
        onClose={() => {
          setDecision(null);
          setNotes("");
        }}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setDecision(null);
                setNotes("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={() => decide(decision?.reject ? "DENIED" : "APPROVED")}>
              {decision?.reject ? "Deny" : "Approve"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p>Optional admin notes:</p>
          <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </Modal>
    </div>
  );
}
