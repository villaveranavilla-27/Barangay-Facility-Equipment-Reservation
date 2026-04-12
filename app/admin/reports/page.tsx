"use client";

import { ReportsPanel } from "@/components/reports-panel";

export default function AdminReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">View Generated Report</h1>
        <p className="mt-1 text-text-secondary">Export reservation summaries and review analytics.</p>
      </div>
      <ReportsPanel />
    </div>
  );
}
