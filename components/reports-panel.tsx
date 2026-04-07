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
      <Card>
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          <Button onClick={load}>Load Summary</Button>
        </div>
        <div className="mt-4">
          <Button href={`/api/reports/reservations/pdf?from=${from}&to=${to}`}>Export PDF</Button>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <div className="text-sm text-text-secondary">Revenue & Fees Collected</div>
          <div className="mt-2 text-3xl font-semibold">{money(report?.revenue || 0)}</div>
          <div className="mt-1 text-sm text-text-secondary">Calculated from approved reservations</div>
        </Card>
        <Card>
          <div className="text-sm text-text-secondary">Top Resident Activity</div>
          <div className="mt-2 space-y-2">
            {(report?.topUsers || []).slice(0, 3).map((u: any) => (
              <div key={u.name} className="flex items-center justify-between">
                <span>{u.name}</span>
                <Badge tone="green">{u.count}</Badge>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <div className="text-sm text-text-secondary">Equipment Condition Log</div>
          <div className="mt-2 text-sm text-text-secondary">Manual placeholder entries for damages/loss.</div>
        </Card>
      </div>

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

      <Card>
        <div className="text-lg font-semibold">Equipment Condition Log</div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <Input placeholder="Equipment" value={logForm.equipment} onChange={(e) => setLogForm({ ...logForm, equipment: e.target.value })} />
          <Input type="date" value={logForm.date} onChange={(e) => setLogForm({ ...logForm, date: e.target.value })} />
          <Input placeholder="Status" value={logForm.status} onChange={(e) => setLogForm({ ...logForm, status: e.target.value })} />
          <Button onClick={() => setConditionLogs([...conditionLogs, logForm])}>Add Entry</Button>
        </div>
        <div className="mt-4 space-y-2">
          {conditionLogs.map((log, i) => (
            <div key={i} className="rounded-xl border border-border p-3 text-sm">
              {log.date} · {log.equipment} · {log.status} · {log.note}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
