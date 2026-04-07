"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Armchair,
  Mic,
  Radio,
  Speaker,
  Monitor,
  Table2,
  Tent,
  Building2,
} from "lucide-react";
import { Card, Button } from "@/components/common";
import { money } from "@/lib/utils";

function getItemIcon(itemName: string) {
  const name = String(itemName ?? "").toLowerCase();

  if (name.includes("chair")) return <Armchair className="h-6 w-6" />;
  if (name.includes("microphone")) return <Mic className="h-6 w-6" />;
  if (name.includes("sound system")) return <Radio className="h-6 w-6" />;
  if (name.includes("speaker")) return <Speaker className="h-6 w-6" />;
  if (name.includes("projector")) return <Monitor className="h-6 w-6" />;
  if (name.includes("table")) return <Table2 className="h-6 w-6" />;
  if (name.includes("tent")) return <Tent className="h-6 w-6" />;
  if (name.includes("facility")) return <Building2 className="h-6 w-6" />;

  return <Building2 className="h-6 w-6" />;
}

export default function UserFacilitiesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/facilities").then((r) => r.json()),
      fetch("/api/equipment").then((r) => r.json()),
    ]).then(([facilities, equipment]) => {
      setItems([
        ...facilities.map((f: any) => ({
          ...f,
          id: f.facilityId,
          type: "FACILITY",
        })),
        ...equipment.map((e: any) => ({
          ...e,
          id: e.equipmentId,
          type: "EQUIPMENT",
        })),
      ]);
    });
  }, []);

  const filteredItems = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    if (!q) return items;

    return items.filter((item) => {
      const name = String(item.itemName ?? "").toLowerCase();
      const desc = String(item.description ?? "").toLowerCase();
      const type = String(item.type ?? "").toLowerCase();

      return (
        name.includes(q) ||
        desc.includes(q) ||
        type.includes(q)
      );
    });
  }, [items, searchTerm]);

  const groupedItems = {
    FACILITY: filteredItems.filter((item) => item.type === "FACILITY"),
    EQUIPMENT: filteredItems.filter((item) => item.type === "EQUIPMENT"),
  };

  return (
    <main className="min-h-screen bg-white px-3 py-4 md:flex md:items-center md:justify-center md:bg-[#f6f6f6]">
      <div className="mx-auto w-full max-w-[430px] rounded-[28px] bg-[#ececec] px-4 py-4 shadow-[0_8px_30px_rgba(0,0,0,0.08)] md:max-w-[520px] md:px-5 md:py-5">
        {/* Top bar */}
        <div className="mb-3 flex items-start gap-3">
          <button
            type="button"
            className="mt-1 rounded-full p-1 text-[#2f2f2f]"
            aria-label="Go back"
          >
            <ArrowLeft className="h-8 w-8" />
          </button>

          <div className="min-w-0">
            <h1 className="text-[18px] font-bold leading-tight text-[#3b7f35] md:text-[22px]">
              Facility &amp; Equipment
            </h1>
            <p className="mt-0.5 text-[12px] leading-tight text-[#4f9a4b] md:text-sm">
              Brows available items and their rates
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-5">
          <div className="flex items-center gap-2 rounded-full border-2 border-[#3b7f35] bg-white px-4 py-3 shadow-[0_3px_10px_rgba(0,0,0,0.10)]">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Facility and Equipment"
              className="w-full bg-transparent text-[14px] outline-none placeholder:text-[#b9b9b9]"
            />
            <Search className="h-5 w-5 shrink-0 text-black" />
          </div>
        </div>

        <div className="space-y-5">
          {/* Equipment Section */}
          <section>
            <div className="mb-3 inline-flex min-w-[170px] items-center justify-center rounded-[4px] bg-[#d9d9d9] px-5 py-1.5 shadow-[0_2px_4px_rgba(0,0,0,0.18)]">
              <h2 className="text-[18px] font-medium text-[#3b7f35]">
                Equipment
              </h2>
            </div>

            <div className="space-y-3">
              {groupedItems.EQUIPMENT.length > 0 ? (
                groupedItems.EQUIPMENT.map((item) => (
                  <Card
                    key={`EQUIPMENT-${item.id}`}
                    className="border border-[#4d8f43] bg-white px-3 py-2 shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border-2 border-[#44c000] bg-[#eaffea] text-[#44c000]">
                        {getItemIcon(item.itemName)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="truncate text-[18px] leading-tight text-[#3b7f35]">
                              {item.itemName}
                            </h3>
                            <p className="mt-0.5 line-clamp-1 text-[12px] text-[#4f9a4b]">
                              {item.description}
                            </p>
                          </div>

                          <div className="shrink-0 text-right">
                            <div className="text-[16px] leading-tight text-[#3b7f35]">
                              {money(item.price)}
                            </div>
                            <div className="mt-1 text-[12px] text-[#44c000]">
                              Qty: {item.quantity}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3">
                          <Button href={`/user/reservations/new?type=EQUIPMENT&id=${item.id}`}>
                            Book Now
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <p className="px-2 py-3 text-sm text-[#5b5b5b]">
                  No equipment found.
                </p>
              )}
            </div>
          </section>

          {/* Facility Section */}
          <section>
            <div className="mb-3 inline-flex min-w-[170px] items-center justify-center rounded-[4px] bg-[#d9d9d9] px-5 py-1.5 shadow-[0_2px_4px_rgba(0,0,0,0.18)]">
              <h2 className="text-[18px] font-medium text-[#3b7f35]">
                Facility
              </h2>
            </div>

            <div className="space-y-3">
              {groupedItems.FACILITY.length > 0 ? (
                groupedItems.FACILITY.map((item) => (
                  <Card
                    key={`FACILITY-${item.id}`}
                    className="border border-[#4d8f43] bg-white px-3 py-2 shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border-2 border-[#44c000] bg-[#eaffea] text-[#44c000]">
                        {getItemIcon(item.itemName)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="truncate text-[18px] leading-tight text-[#3b7f35]">
                              {item.itemName}
                            </h3>
                            <p className="mt-0.5 line-clamp-1 text-[12px] text-[#4f9a4b]">
                              {item.description}
                            </p>
                          </div>

                          <div className="shrink-0 text-right">
                            <div className="text-[16px] leading-tight text-[#3b7f35]">
                              {money(item.pricePerDay)}
                            </div>
                            <div className="mt-1 text-[12px] text-[#44c000]">
                              {item.status}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3">
                          <Button href={`/user/reservations/new?type=FACILITY&id=${item.id}`}>
                            Book Now
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <p className="px-2 py-3 text-sm text-[#5b5b5b]">
                  No facility found.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}