"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Button, Card, Input, Select, Textarea } from "@/components/common";

const genderOptions = ["Male", "Female", "Other", "Prefer not to say"] as const;

function sanitizeContactNumber(value: string) {
  return value.replace(/\D/g, "").slice(0, 15);
}

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
          <Input
            value={form.name || ""}
            minLength={2}
            maxLength={191}
            autoComplete="name"
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <Input
              type="email"
              maxLength={191}
              autoComplete="email"
              value={form.email || ""}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Contact Number</label>
            <Input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]{7,15}"
              minLength={7}
              maxLength={15}
              autoComplete="tel"
              value={form.contactNumber || ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  contactNumber: sanitizeContactNumber(e.target.value),
                })
              }
            />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Gender</label>
            <Select
              value={form.gender || "Male"}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
            >
              {genderOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Birthdate</label>
            <Input
              type="date"
              max={new Date().toISOString().slice(0, 10)}
              value={(form.birthdate || "").slice(0, 10)}
              onChange={(e) => setForm({ ...form, birthdate: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Address</label>
          <Textarea
            rows={3}
            maxLength={191}
            value={form.address || ""}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">New Password (optional)</label>
          <Input
            type="password"
            minLength={4}
            maxLength={191}
            autoComplete="new-password"
            value={form.password || ""}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>
        <Button type="submit">Save Changes</Button>
      </form>
    </Card>
  );
}
