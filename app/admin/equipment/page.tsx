"use client";

import { AdminCatalogManager } from "@/components/admin-catalog-manager";

export default function AdminEquipmentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Equipment</h1>
        <p className="mt-1 text-text-secondary">Create, update, or remove equipment.</p>
      </div>
      <AdminCatalogManager kind="equipment" />
    </div>
  );
}
