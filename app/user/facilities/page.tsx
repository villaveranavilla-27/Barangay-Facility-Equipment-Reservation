"use client";

import { useEffect, useMemo, useState } from "react";
import { HugeiconsIcon } from '@hugeicons/react'; // Import the renderer
// Import the icons from the free icons package
import { 
  SearchIcon, 
  Chair01Icon, 
  Mic01Icon, 
  Speaker01Icon, 
  Projector01Icon, 
  TentIcon, 
  Table02Icon, 
} from '@hugeicons/core-free-icons';

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
    const q = searchTerm.toLowerCase();
    return items.filter((item) => {
      const name = item.itemName?.toLowerCase() || "";
      const desc = item.description?.toLowerCase() || "";
      return name.includes(q) || desc.includes(q);
    });
  }, [items, searchTerm]);

  const equipment = filteredItems.filter((i) => i.type === "EQUIPMENT");
  const facilities = filteredItems.filter((i) => i.type === "FACILITY");

  const renderIcon = (itemName: string, type: string) => {
    const name = itemName.toLowerCase();
    // Determine which icon object to use
    let iconToRender = null;

    if (name.includes("chair")) {
      iconToRender = Chair01Icon;
    } else if (name.includes("microphone") || name.includes("mic")) {
      iconToRender = Mic01Icon;
    } else if (name.includes("speaker") || name.includes("sound")) {
      iconToRender = Speaker01Icon;
    } else if (name.includes("projector")) {
      iconToRender = Projector01Icon;
    } else if (name.includes("table")) {
      iconToRender = Table02Icon;
    } else if (name.includes("tent")) {
      iconToRender = TentIcon;
    } 
    

    if (iconToRender) {
      // Use the HugeiconsIcon component to render the icon
      return <HugeiconsIcon icon={iconToRender} size={32} className="text-green-700" />;
    }

    // Fallback if no match is found
    return <div className="h-8 w-8 rounded-sm bg-green-700" />;
  };

  return (
    <main className="min-h-screen bg-[#f3f4f6] px-10 py-6">
      <div className="mx-auto max-w-5xl">
        {/* SEARCH */}
        <div className="mb-6 flex justify-center">
          <div className="flex w-[400px] items-center rounded-full border-2 border-green-700 bg-white px-4 py-2 shadow">
            <input
              type="text"
              placeholder="Search Facility and Equipment"
              className="w-full bg-transparent text-sm outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <HugeiconsIcon icon={SearchIcon} size={20} className="text-green-700" /> {/* Updated search icon */}
          </div>
        </div>

        {/* FACILITY */}
        <div className="mb-6">
          <div className="w-fit rounded border border-green-700 px-4 py-1 font-semibold text-green-700">
            Facility
          </div>

          {facilities.map((item) => (
            <div key={item.id} className="flex items-center justify-between border-b py-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center">
                  {renderIcon(item.itemName, item.type)}
                </div>

                <div>
                  <p className="font-semibold text-green-700">{item.itemName}</p>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </div>
              </div>

              <div className="text-right">
                <p className="font-semibold text-green-700">
                  {item.pricePerDay ?? "No price"}
                </p>
                <p className="text-sm text-gray-500">{item.status}</p>
              </div>
            </div>
          ))}
        </div>

        {/* EQUIPMENT */}
        <div>
          <div className="w-fit rounded border border-green-700 px-4 py-1 font-semibold text-green-700">
            Equipment
          </div>

          {equipment.map((item) => (
            <div key={item.id} className="flex items-center justify-between border-b py-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center">
                  {renderIcon(item.itemName, item.type)}
                </div>

                <div>
                  <p className="font-semibold text-green-700">{item.itemName}</p>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </div>
              </div>

              <div className="text-right">
                <p className="font-semibold text-green-700">
                  {item.price ?? "No price"}
                </p>
                <p className="text-sm text-gray-500">
                  {item.quantity ?? 0} available
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}