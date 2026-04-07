"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Badge, Button, Card, Modal, Input, Textarea } from "@/components/common";

export function UsersDirectory() {
  const [users, setUsers] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    contactInfo: "",
    gender: "Male",
    birthdate: "",
    address: ""
  });
  const [statusMap, setStatusMap] = useState<Record<number, boolean>>({});

  async function load() {
    const [u, a] = await Promise.all([
      fetch("/api/users").then((res) => res.json()),
      fetch("/api/users?kind=admins").then((res) => res.json())
    ]);
    setUsers(u);
    setAdmins(a);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = users.filter((u) => `${u.fullName} ${u.email}`.toLowerCase().includes(query.toLowerCase()));

  async function createAdmin() {
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    if (res.ok) {
      toast.success("Admin created");
      setOpen(false);
      setForm({ name: "", username: "", email: "", password: "", contactInfo: "", gender: "Male", birthdate: "", address: "" });
      load();
    } else toast.error("Unable to create admin");
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Input placeholder="Search users" value={query} onChange={(e) => setQuery(e.target.value)} />
          <Button onClick={() => setOpen(true)}>Add Admin</Button>
        </div>
      </Card>

      <Card className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead>
            <tr className="border-b border-border text-sm text-text-secondary">
              <th className="py-3 pr-4">Full Name</th>
              <th className="py-3 pr-4">Email</th>
              <th className="py-3 pr-4">Contact</th>
              <th className="py-3 pr-4">Role</th>
              <th className="py-3 pr-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => {
              const active = statusMap[u.userId] ?? true;
              return (
                <tr key={u.userId} className="border-b border-border">
                  <td className="py-3 pr-4">{u.fullName}</td>
                  <td className="py-3 pr-4">{u.email}</td>
                  <td className="py-3 pr-4">{u.contactInfo}</td>
                  <td className="py-3 pr-4">USER</td>
                  <td className="py-3 pr-4">
                    <Badge tone={active ? "green" : "red"}>{active ? "Active" : "Inactive"}</Badge>
                    <Button
                      variant="secondary"
                      className="ml-3"
                      onClick={() => setStatusMap({ ...statusMap, [u.userId]: !active })}
                    >
                      {active ? "Deactivate" : "Activate"}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <Card>
        <div className="text-lg font-semibold">Admin Accounts</div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {admins.map((a) => (
            <div key={a.adminId} className="rounded-xl border border-border p-4">
              <div className="font-medium">{a.name}</div>
              <div className="text-sm text-text-secondary">{a.email}</div>
            </div>
          ))}
        </div>
      </Card>

      <Modal
        open={open}
        title="Add Admin"
        onClose={() => setOpen(false)}
        footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={createAdmin}>Create</Button></>}
      >
        <div className="space-y-4">
          <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          <Input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <Input placeholder="Contact Number" value={form.contactInfo} onChange={(e) => setForm({ ...form, contactInfo: e.target.value })} />
          <Input placeholder="Gender" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} />
          <Input type="date" value={form.birthdate} onChange={(e) => setForm({ ...form, birthdate: e.target.value })} />
          <Textarea placeholder="Address" rows={3} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>
      </Modal>
    </div>
  );
}
