"use client";

import { useState } from "react";
import { Card, Button, Input, Badge } from "@/components/common";
import { money, fmtDate } from "@/lib/utils";

export function ReportsPanel() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [report, setReport] = useState<any>(null);
  const [conditionLogs, setConditionLogs] = useState<Array<{ equipment: string; date: string; note: string; status: string }>>([]);
  const [logForm, setLogForm] = useState({ equipment: "", date: "", note: "", status: "Open" });

  async function load() {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const res = await fetch(`/api/reports/reservations?${params.toString()}`);
    setReport(await res.json());
  }

  return (
    <div className="space-y-6">
      
  

      <Card className="overflow-x-auto">
        <div className="mb-3 text-lg font-semibold">Reservations Summary</div>
        <table className="min-w-full text-left">
          <thead>
            <tr className="border-b border-border text-sm text-text-secondary">
              <th className="py-3 pr-4">ID</th>
              <th className="py-3 pr-4">Name</th>
              <th className="py-3 pr-4">Item</th>
              <th className="py-3 pr-4">Status</th>
              <th className="py-3 pr-4">Date</th>
            </tr>
          </thead>
          <tbody>
            {(report?.rows || []).map((row: any) => (
              <tr key={row.id} className="border-b border-border">
                <td className="py-3 pr-4">{row.id}</td>
                <td className="py-3 pr-4">{row.name}</td>
                <td className="py-3 pr-4">{row.item}</td>
                <td className="py-3 pr-4">{row.status}</td>
                <td className="py-3 pr-4">{row.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      
    </div>
  );
}
