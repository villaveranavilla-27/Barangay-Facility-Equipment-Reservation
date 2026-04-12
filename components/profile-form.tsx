"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Button, Card, Input, Textarea } from "@/components/common";

export function ProfileForm() {
  const [form, setForm] = useState<any>(null);

  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then(setForm);
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    if (res.ok) toast.success("Profile updated");
    else toast.error("Update failed");
  }

  if (!form) return <Card>Loading...</Card>;

  return (
    <Card className="max-w-[1300px]">
      <form className="space-y-4" onSubmit={save}>
        <div>
          <label className="mb-1 block text-sm font-medium">Full Name</label>
          <Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <Input type="email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Contact Number</label>
            <Input value={form.contactNumber || ""} onChange={(e) => setForm({ ...form, contactNumber: e.target.value })} />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Gender</label>
            <Input value={form.gender || ""} onChange={(e) => setForm({ ...form, gender: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Birthdate</label>
            <Input type="date" value={(form.birthdate || "").slice(0, 10)} onChange={(e) => setForm({ ...form, birthdate: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Address</label>
          <Textarea rows={3} value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">New Password (optional)</label>
          <Input type="password" value={form.password || ""} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <Button type="submit">Save Changes</Button>
      </form>
    </Card>
  );
}
