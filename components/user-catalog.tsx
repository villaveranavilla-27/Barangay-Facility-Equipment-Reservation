"use client";

import { useMemo, useState } from "react";
import { Button, Badge, Card } from "@/components/common";
import { money } from "@/lib/utils";

type Item = {
  id: number;
  itemName: string;
  description?: string | null;
  pricePerDay?: number | null;
  status?: string | null;
  price?: number | string | null;
  quantity?: number | null;
  type: "FACILITY" | "EQUIPMENT";
};

export function UserCatalog({ items }: { items: Item[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () =>
      items.filter((item) =>
        `${item.itemName} ${item.description ?? ""}`.toLowerCase().includes(search.toLowerCase())
      ),
    [items, search]
  );

  return (
    <div className="space-y-4">
      <input
        placeholder="Search by name or description"
        className="w-full rounded-lg border border-border bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-brand-500"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {filtered.map((item) => {
          const equipmentPrice = item.price == null ? null : Number(item.price);

          return (
            <Card key={`${item.type}-${item.id}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Badge tone={item.type === "FACILITY" ? "green" : "blue"}>{item.type}</Badge>
                  <h3 className="mt-3 text-xl font-semibold">{item.itemName}</h3>
                  <p className="mt-2 text-sm text-text-secondary">{item.description || "No description"}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                {item.type === "FACILITY" ? (
                  <>
                    <div className="rounded-full bg-brand-50 px-3 py-1 text-brand-600">
                      {money(item.pricePerDay || 0)}
                    </div>
                    <div className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                      {item.status ?? "AVAILABLE"}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="rounded-full bg-brand-50 px-3 py-1 text-brand-600">
                      {equipmentPrice == null ? "No price set" : money(equipmentPrice)}
                    </div>
                    <div className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                      Qty: {item.quantity ?? "Not set"}
                    </div>
                  </>
                )}
              </div>
              <div className="mt-5">
                <Button href={`/user/reservations/new?type=${item.type}&id=${item.id}`}>Book Now</Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
