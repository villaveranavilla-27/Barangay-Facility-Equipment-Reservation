"use client";

import { useState } from "react";
import { HousePlusIcon, PackageIcon } from "@hugeicons/core-free-icons";
import { AdminCatalogManager } from "@/components/admin-catalog-manager";
import {
  CatalogSearchField,
  CatalogTabButton,
} from "@/components/catalog-ui";

type CatalogTab = "facility" | "equipment";

export default function AdminFacilitiesPage() {
  const [activeTab, setActiveTab] = useState<CatalogTab>("facility");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="space-y-6">
      <div className="app-page__header">
        <h1 className="app-page__title">Facility &amp; Equipment</h1>
        <p className="app-page__description">
          Manage your barangay facilities and equipment using the same catalog
          experience residents see.
        </p>
      </div>

      <CatalogSearchField
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      <div className="flex w-full flex-col rounded-[22px] border border-gray-200 bg-white p-1 shadow-sm sm:inline-flex sm:w-auto sm:flex-row">
        <CatalogTabButton
          label="Facilities"
          icon={HousePlusIcon}
          active={activeTab === "facility"}
          onClick={() => setActiveTab("facility")}
          minWidthClassName="min-w-[240px]"
        />

        <CatalogTabButton
          label="Equipment"
          icon={PackageIcon}
          active={activeTab === "equipment"}
          onClick={() => setActiveTab("equipment")}
          minWidthClassName="min-w-[240px]"
        />
      </div>

      <div>
        {activeTab === "facility" ? (
          <AdminCatalogManager kind="facility" searchQuery={searchQuery} />
        ) : (
          <AdminCatalogManager kind="equipment" searchQuery={searchQuery} />
        )}
      </div>
    </div>
  );
}
