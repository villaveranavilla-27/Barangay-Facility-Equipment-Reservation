"use client";

import { useEffect, useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Alert02Icon,
  CheckmarkCircle02Icon,
  Delete02Icon,
  Edit02Icon,
  PackageIcon,
} from "@hugeicons/core-free-icons";
import toast from "react-hot-toast";
import {
  Button,
  Input,
  Modal,
  Select,
  Textarea,
} from "@/components/common";
import { CatalogItemIcon } from "@/components/catalog-ui";
import { fetchJson, getJsonErrorMessage } from "@/lib/fetch-json";
import { money } from "@/lib/utils";

type Kind = "facility" | "equipment";

type Item = {
  facilityId?: number;
  equipmentId?: number;
  itemName: string;
  description?: string | null;
  status?: string | null;
  pricePerDay?: number | null;
  price?: number | string | null;
  quantity?: number | null;
};

type FormState = {
  itemName: string;
  description: string;
  status: string;
  pricePerDay: string;
  price: string;
  quantity: string;
};

type AdminCatalogManagerProps = {
  kind: Kind;
  searchQuery?: string;
};

function createEmptyForm(): FormState {
  return {
    itemName: "",
    description: "",
    status: "AVAILABLE",
    pricePerDay: "",
    price: "",
    quantity: "",
  };
}

function getItemId(item: Item) {
  return item.facilityId ?? item.equipmentId ?? 0;
}

function getFacilityStatusMeta(status?: string | null) {
  if (status === "UNDER_MAINTENANCE") {
    return {
      label: "Under maintenance",
      icon: Alert02Icon,
      iconClassName: "text-amber-500",
    };
  }

  return {
    label: "Available",
    icon: CheckmarkCircle02Icon,
    iconClassName: "text-green-600",
  };
}

function getEquipmentAvailabilityMeta(quantity?: number | null) {
  if (quantity != null && quantity <= 0) {
    return {
      label: "Out of stock",
      icon: Alert02Icon,
      iconClassName: "text-red-500",
    };
  }

  return {
    label: `${quantity ?? 0} available`,
    icon: PackageIcon,
    iconClassName: "text-slate-500",
  };
}

export function AdminCatalogManager({
  kind,
  searchQuery = "",
}: AdminCatalogManagerProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [form, setForm] = useState<FormState>(createEmptyForm);

  const endpoint = kind === "facility" ? "/api/facilities" : "/api/equipment";
  const kindLabel = kind === "facility" ? "Facility" : "Equipment";
  const pluralLabel = kind === "facility" ? "facilities" : "equipment";
  const directoryTitle =
    kind === "facility" ? "Facilities Directory" : "Equipment Directory";
  const directorySubtitle =
    kind === "facility"
      ? "Create, update, and maintain the spaces residents can reserve."
      : "Manage inventory details, availability, and pricing for reservable equipment.";

  async function load() {
    setLoading(true);
    setError("");

    try {
      const { response, data } = await fetchJson<Item[] | { error?: string }>(
        endpoint,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          getJsonErrorMessage(data, `Unable to load ${pluralLabel}`)
        );
      }

      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : `Unable to load ${pluralLabel}`;

      console.error(`Failed to load ${pluralLabel}`, error);
      setItems([]);
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [kind]);

  const filtered = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return items;
    }

    return items.filter((item) =>
      `${item.itemName} ${item.description ?? ""}`
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [items, searchQuery]);

  function openCreateModal() {
    setEditing(null);
    setForm(createEmptyForm());
    setOpen(true);
  }

  function openEditModal(item: Item) {
    setEditing(item);
    setForm({
      itemName: item.itemName || "",
      description: item.description || "",
      status: item.status || "AVAILABLE",
      pricePerDay: item.pricePerDay?.toString() ?? "",
      price: item.price?.toString() ?? "",
      quantity: item.quantity?.toString() ?? "",
    });
    setOpen(true);
  }

  function closeEditor() {
    if (saving) {
      return;
    }

    setOpen(false);
    setEditing(null);
    setForm(createEmptyForm());
  }

  async function save() {
    if (saving) {
      return;
    }

    const id = editing ? getItemId(editing) : null;
    const payload =
      kind === "facility"
        ? {
            itemName: form.itemName,
            description: form.description,
            status: form.status,
            pricePerDay: Number(form.pricePerDay || 0),
          }
        : {
            itemName: form.itemName,
            description: form.description,
            price: form.price === "" ? null : Number(form.price),
            quantity: form.quantity === "" ? null : Number(form.quantity),
          };

    setSaving(true);

    try {
      const { response, data } = await fetchJson<{ error?: string }>(
        id ? `${endpoint}/${id}` : endpoint,
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(getJsonErrorMessage(data, `Unable to save ${kindLabel.toLowerCase()}`));
      }

      toast.success(editing ? `${kindLabel} updated` : `${kindLabel} created`);
      closeEditor();
      await load();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : `Unable to save ${kindLabel.toLowerCase()}`
      );
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (deleteId === null || removing) {
      return;
    }

    setRemoving(true);

    try {
      const { response, data } = await fetchJson<{ error?: string }>(
        `${endpoint}/${deleteId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(
          getJsonErrorMessage(data, `Unable to delete ${kindLabel.toLowerCase()}`)
        );
      }

      toast.success(`${kindLabel} deleted`);
      setDeleteId(null);
      await load();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : `Unable to delete ${kindLabel.toLowerCase()}`
      );
    } finally {
      setRemoving(false);
    }
  }

  return (
    <>
      <div className="rounded-[24px] border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">
                {directoryTitle}
              </h2>
              <p className="mt-1 text-sm text-gray-500">{directorySubtitle}</p>
            </div>

            <Button
              type="button"
              className="h-11 rounded-full bg-green-700 px-5 text-sm font-semibold text-white hover:bg-green-800"
              onClick={openCreateModal}
            >
              <HugeiconsIcon icon={Add01Icon} size={18} className="mr-2" />
              Add {kindLabel}
            </Button>
          </div>
        </div>

        <div className="divide-y divide-gray-200 px-6">
          {loading ? (
            <div className="py-10 text-center text-sm text-gray-500">
              Loading {kind === "facility" ? "facilities" : "equipment"}...
            </div>
          ) : error ? (
            <div className="py-10 text-center text-sm font-medium text-red-600">
              {error}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-500">
              No {kind === "facility" ? "facilities" : "equipment"} found.
            </div>
          ) : (
            filtered.map((item) => {
              const id = getItemId(item);
              const facilityStatus = getFacilityStatusMeta(item.status);
              const equipmentAvailability = getEquipmentAvailabilityMeta(item.quantity);
              const equipmentPrice =
                item.price == null ? null : Number(item.price);

              return (
                <div
                  key={id}
                  className="flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <CatalogItemIcon itemName={item.itemName} type={kind} />

                    <div className="min-w-0">
                      <p className="truncate font-semibold text-green-700">
                        {item.itemName}
                      </p>
                      <p className="truncate text-sm text-gray-500">
                        {item.description || "No description provided."}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-6">
                    <div className="shrink-0 text-left md:text-right">
                      <p className="font-semibold text-green-700">
                        {kind === "facility"
                          ? item.pricePerDay == null
                            ? "No price set"
                            : money(item.pricePerDay)
                          : equipmentPrice == null
                            ? "No price set"
                            : money(equipmentPrice)}
                      </p>
                      <div className="mt-1 inline-flex items-center gap-2 text-sm text-gray-500 md:justify-end">
                        <HugeiconsIcon
                          icon={
                            kind === "facility"
                              ? facilityStatus.icon
                              : equipmentAvailability.icon
                          }
                          size={16}
                          className={
                            kind === "facility"
                              ? facilityStatus.iconClassName
                              : equipmentAvailability.iconClassName
                          }
                        />
                        <span>
                          {kind === "facility"
                            ? facilityStatus.label
                            : equipmentAvailability.label}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-11 rounded-full px-4"
                        onClick={() => openEditModal(item)}
                      >
                        <HugeiconsIcon icon={Edit02Icon} size={16} className="mr-2" />
                        Edit
                      </Button>

                      <Button
                        type="button"
                        variant="danger"
                        className="h-11 rounded-full px-4"
                        onClick={() => setDeleteId(id)}
                      >
                        <HugeiconsIcon icon={Delete02Icon} size={16} className="mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <Modal
        open={open}
        title={`${editing ? "Edit" : "Add"} ${kindLabel}`}
        onClose={closeEditor}
        footer={
          <>
            <Button type="button" variant="ghost" onClick={closeEditor} disabled={saving}>
              Cancel
            </Button>
            <Button type="button" onClick={save} disabled={saving}>
              <HugeiconsIcon
                icon={editing ? Edit02Icon : Add01Icon}
                size={16}
                className="mr-2"
              />
              {saving ? "Saving..." : editing ? `Save ${kindLabel}` : `Add ${kindLabel}`}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[#344054]">
              Name
            </label>
            <Input
              value={form.itemName}
              onChange={(e) =>
                setForm((current) => ({ ...current, itemName: e.target.value }))
              }
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[#344054]">
              Description
            </label>
            <Textarea
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm((current) => ({ ...current, description: e.target.value }))
              }
            />
          </div>

          {kind === "facility" ? (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-[#344054]">
                  Status
                </label>
                <Select
                  value={form.status}
                  onChange={(e) =>
                    setForm((current) => ({ ...current, status: e.target.value }))
                  }
                >
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="UNDER_MAINTENANCE">UNDER_MAINTENANCE</option>
                </Select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[#344054]">
                  Price per day
                </label>
                <Input
                  type="number"
                  min="0"
                  value={form.pricePerDay}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      pricePerDay: e.target.value,
                    }))
                  }
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-[#344054]">
                  Price
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) =>
                    setForm((current) => ({ ...current, price: e.target.value }))
                  }
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[#344054]">
                  Quantity
                </label>
                <Input
                  type="number"
                  min="0"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm((current) => ({ ...current, quantity: e.target.value }))
                  }
                />
              </div>
            </>
          )}
        </div>
      </Modal>

      <Modal
        open={deleteId !== null}
        title={`Delete ${kindLabel}`}
        onClose={() => {
          if (!removing) {
            setDeleteId(null);
          }
        }}
        footer={
          <>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDeleteId(null)}
              disabled={removing}
            >
              Cancel
            </Button>
            <Button type="button" variant="danger" onClick={remove} disabled={removing}>
              <HugeiconsIcon icon={Delete02Icon} size={16} className="mr-2" />
              {removing ? "Deleting..." : `Delete ${kindLabel}`}
            </Button>
          </>
        }
      >
        <p className="text-sm text-[#475467]">
          Are you sure you want to delete this {kindLabel.toLowerCase()}? This
          action cannot be undone.
        </p>
      </Modal>
    </>
  );
}
