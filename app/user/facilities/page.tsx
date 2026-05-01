"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CatalogItemIcon,
  CatalogSearchField,
  CatalogTabButton,
} from "@/components/catalog-ui";

type ActiveTab = "FACILITY" | "EQUIPMENT";

export default function UserFacilitiesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<ActiveTab>("FACILITY");

  useEffect(() => {
    Promise.all([
      fetch("/api/facilities").then((r) => r.json()),
      fetch("/api/equipment").then((r) => r.json()),
    ]).then(([facilities, equipment]) => {
      setItems([
        ...facilities.map((f: any) => ({
          ...f,
          id: f.facilityId,
          facilityId: f.facilityId,
          type: "FACILITY",
        })),
        ...equipment.map((e: any) => ({
          ...e,
          id: e.equipmentId,
          equipmentId: e.equipmentId,
          type: "EQUIPMENT",
        })),
      ]);
    });
  }, []);

  const filteredItems = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return items.filter((item) => {
      const name = item.itemName?.toLowerCase() || "";
      const desc = item.description?.toLowerCase() || "";
      return name.includes(q) || desc.includes(q);
    });
  }, [items, searchTerm]);

  const equipment = filteredItems.filter((i) => i.type === "EQUIPMENT");
  const facilities = filteredItems.filter((i) => i.type === "FACILITY");

  const activeItems = activeTab === "FACILITY" ? facilities : equipment;

  return (
    <main className="min-h-screen bg-[#f3f4f6] px-4 py-6 sm:px-6 md:px-10">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* SEARCH BAR */}
        <CatalogSearchField
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* TABS */}
        <div className="flex w-full flex-col rounded-[22px] border border-gray-200 bg-white p-1 shadow-sm sm:inline-flex sm:w-auto sm:flex-row">
          <CatalogTabButton
            label="Facilities"
            active={activeTab === "FACILITY"}
            onClick={() => setActiveTab("FACILITY")}
          />

          <CatalogTabButton
            label="Equipment"
            active={activeTab === "EQUIPMENT"}
            onClick={() => setActiveTab("EQUIPMENT")}
          />
        </div>

        {/* ACTIVE TAB CONTENT */}
        <div className="rounded-[24px] border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-4 py-5 sm:px-6">
            <h2 className="text-2xl font-semibold text-slate-900">
              {activeTab === "FACILITY"
                ? "Facilities Directory"
                : "Equipment Directory"}
            </h2>
          </div>

          <div className="divide-y divide-gray-200 px-4 sm:px-6">
            {activeItems.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-500">
                No {activeTab === "FACILITY" ? "facilities" : "equipment"} found.
              </div>
            ) : (
              activeItems.map((item) => {
                const reserveHref =
                  item.type === "FACILITY"
                    ? `/user/reservations/new?type=facility&id=${item.id}&facilityId=${item.facilityId}&name=${encodeURIComponent(item.itemName)}`
                    : `/user/reservations/new?type=equipment&id=${item.id}&equipmentId=${item.equipmentId}&name=${encodeURIComponent(item.itemName)}`;

                return (
                  <div
                    key={item.id}
                    className="flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <CatalogItemIcon
                        itemName={item.itemName}
                        type={item.type}
                      />

                      <div className="min-w-0">
                        <p className="truncate font-semibold text-green-700">
                          {item.itemName}
                        </p>
                        <p className="truncate text-sm text-gray-500">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-6">
                      <div className="shrink-0 text-left md:text-right">
                        <p className="font-semibold text-green-700">
                          {item.type === "FACILITY"
                            ? item.pricePerDay ?? "No price"
                            : item.price ?? "No price"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {item.type === "FACILITY"
                            ? item.status
                            : `${item.quantity ?? 0} available`}
                        </p>
                      </div>

                      <Link
                        href={reserveHref}
                        className="inline-flex h-11 w-full items-center justify-center rounded-full bg-green-700 px-5 text-sm font-semibold text-white transition hover:bg-green-800 sm:w-auto"
                      >
                        Reserve Now
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
