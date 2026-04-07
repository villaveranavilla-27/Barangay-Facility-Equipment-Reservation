"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Button, Card, Input, Modal, Select, Textarea, Badge } from "@/components/common";
import { Pencil, Trash2, Plus } from "lucide-react";
import { money } from "@/lib/utils";

type Kind = "facility" | "equipment";

type Item = {
  facilityId?: number;
  equipmentId?: number;
  itemName: string;
  description?: string | null;
  status?: string | null;
  pricePerDay?: number | null;
  quantity?: number | null;
  price?: number | null;
  category?: string | null;
};

export function AdminCatalogManager({ kind }: { kind: Kind }) {
  const [items, setItems] = useState<Item[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState<any>({
    itemName: "",
    description: "",
    status: "AVAILABLE",
    pricePerDay: "",
    quantity: "",
    price: "",
    category: ""
  });

  async function load() {
    const res = await fetch(kind === "facility" ? "/api/facilities" : "/api/equipment");
    const data = await res.json();
    setItems(data);
  }

  useEffect(() => {
    load();
  }, [kind]);

  useEffect(() => {
    if (editing) {
      setForm({
        itemName: editing.itemName || "",
        description: editing.description || "",
        status: editing.status || "AVAILABLE",
        pricePerDay: editing.pricePerDay ?? "",
        quantity: editing.quantity ?? "",
        price: editing.price ?? "",
        category: editing.category || ""
      });
      setOpen(true);
    }
  }, [editing]);

  const filtered = items.filter((item) =>
    `${item.itemName} ${item.description ?? ""}`.toLowerCase().includes(search.toLowerCase())
  );

  async function save() {
    const endpoint = kind === "facility" ? "/api/facilities" : "/api/equipment";
    const method = editing ? "PATCH" : "POST";
    const id = editing ? (editing.facilityId || editing.equipmentId) : null;
    const payload =
      kind === "facility"
        ? {
            itemName: form.itemName,
            description: form.description,
            status: form.status,
            pricePerDay: Number(form.pricePerDay || 0)
          }
        : {
            itemName: form.itemName,
            description: form.description,
            category: form.category,
            quantity: Number(form.quantity || 0),
            price: Number(form.price || 0)
          };

    const res = await fetch(id ? `${endpoint}/${id}` : endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      toast.error("Unable to save item");
      return;
    }

    toast.success(editing ? "Updated" : "Created");
    setOpen(false);
    setEditing(null);
    setForm({ itemName: "", description: "", status: "AVAILABLE", pricePerDay: "", quantity: "", price: "", category: "" });
    await load();
  }

  async function remove() {
    if (!deleteId) return;
    const res = await fetch(`${kind === "facility" ? "/api/facilities" : "/api/equipment"}/${deleteId}`, {
      method: "DELETE"
    });
    if (res.ok) {
      toast.success("Deleted");
      setDeleteId(null);
      await load();
    } else {
      toast.error("Delete failed");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          placeholder="Search by name or description"
          className="w-full rounded-lg border border-border bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Add {kind === "facility" ? "Facility" : "Equipment"}
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {filtered.map((item) => {
          const id = item.facilityId || item.equipmentId || 0;
          return (
            <Card key={id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Badge tone={kind === "facility" ? "green" : "blue"}>{kind.toUpperCase()}</Badge>
                  <h3 className="mt-3 text-xl font-semibold">{item.itemName}</h3>
                  <p className="mt-2 text-sm text-text-secondary">{item.description || "No description"}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditing(item)} className="rounded-lg p-2 hover:bg-brand-50">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => setDeleteId(id)} className="rounded-lg p-2 hover:bg-red-50">
                    <Trash2 className="h-4 w-4 text-danger" />
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                <div className="rounded-full bg-brand-50 px-3 py-1 text-brand-600">
                  {kind === "facility" ? money(item.pricePerDay || 0) : money(item.price || 0)}
                </div>
                {kind === "facility" ? (
                  <div className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">{item.status}</div>
                ) : (
                  <div className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">Qty: {item.quantity ?? 0}</div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Modal
        open={open}
        title={`${editing ? "Edit" : "Add"} ${kind === "facility" ? "Facility" : "Equipment"}`}
        onClose={() => { setOpen(false); setEditing(null); }}
        footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save}>Save</Button></>}
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Name</label>
            <Input value={form.itemName} onChange={(e) => setForm({ ...form, itemName: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Description</label>
            <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          {kind === "facility" ? (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium">Status</label>
                <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="UNDER_MAINTENANCE">UNDER_MAINTENANCE</option>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Price per day</label>
                <Input type="number" value={form.pricePerDay} onChange={(e) => setForm({ ...form, pricePerDay: e.target.value })} />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium">Category</label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Quantity</label>
                <Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Price</label>
                <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </div>
            </>
          )}
        </div>
      </Modal>

      <Modal
        open={deleteId !== null}
        title="Confirm Delete"
        onClose={() => setDeleteId(null)}
        footer={<><Button variant="ghost" onClick={() => setDeleteId(null)}>Cancel</Button><Button variant="danger" onClick={remove}>Delete</Button></>}
      >
        <p>Are you sure you want to delete this record?</p>
      </Modal>
    </div>
  );
}
