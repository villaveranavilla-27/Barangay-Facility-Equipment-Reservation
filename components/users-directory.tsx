"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Badge,
  Button,
  Card,
  Input,
  Modal,
  Select,
  Textarea,
} from "@/components/common";

type UserRecord = {
  userId: number;
  name: string;
  username: string;
  email: string;
  contactNumber: string;
};

type AdminRecord = {
  adminId: number;
  name: string;
  username: string;
  email: string;
  contactNumber: string;
  role: "CORE_ADMIN" | "ADMIN";
  isActive: boolean;
  createdAt: string;
  deactivatedAt?: string | null;
  canBeRemoved: boolean;
  removalBlockedReason?: string | null;
};

type AdminListResponse = {
  currentAdminId: number;
  currentAdminRole: "CORE_ADMIN" | "ADMIN" | null;
  canManageAdmins: boolean;
  admins: AdminRecord[];
};

const emptyForm = {
  name: "",
  username: "",
  email: "",
  password: "",
  contactNumber: "",
  gender: "Male",
  birthdate: "",
  address: "",
  adminRole: "ADMIN" as "CORE_ADMIN" | "ADMIN",
};

function formatDateTime(value?: string | null) {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function UsersDirectory() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [admins, setAdmins] = useState<AdminRecord[]>([]);
  const [canManageAdmins, setCanManageAdmins] = useState(false);
  const [currentAdminId, setCurrentAdminId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [removingAdmin, setRemovingAdmin] = useState<AdminRecord | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [removalPendingId, setRemovalPendingId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState(emptyForm);

  async function readJson<T>(res: Response): Promise<T | null> {
    const text = await res.text();

    if (!text) {
      return null;
    }

    try {
      return JSON.parse(text) as T;
    } catch {
      return null;
    }
  }

  async function load() {
    setLoading(true);

    try {
      const [usersRes, adminsRes] = await Promise.all([
        fetch("/api/users", { cache: "no-store" }),
        fetch("/api/users?kind=admins", { cache: "no-store" }),
      ]);

      const usersData = await readJson<UserRecord[]>(usersRes);
      const adminsData = await readJson<AdminListResponse>(adminsRes);

      if (!usersRes.ok) {
        throw new Error("Unable to load users.");
      }

      if (!adminsRes.ok) {
        throw new Error("Unable to load admin access.");
      }

      setUsers(Array.isArray(usersData) ? usersData : []);
      setAdmins(adminsData?.admins ?? []);
      setCanManageAdmins(Boolean(adminsData?.canManageAdmins));
      setCurrentAdminId(adminsData?.currentAdminId ?? null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load access data.");
      setUsers([]);
      setAdmins([]);
      setCanManageAdmins(false);
      setCurrentAdminId(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filteredUsers = users.filter((user) =>
    `${user.name} ${user.email} ${user.username}`.toLowerCase().includes(query.toLowerCase())
  );

  async function createAdmin() {
    if (isCreating) {
      return;
    }

    setIsCreating(true);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await readJson<{ error?: string; message?: string }>(res);

      if (!res.ok) {
        throw new Error(data?.error || "Unable to create admin");
      }

      toast.success(data?.message || "Admin account created");
      setCreateModalOpen(false);
      setForm(emptyForm);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create admin");
    } finally {
      setIsCreating(false);
    }
  }

  async function removeAdmin() {
    if (!removingAdmin || removalPendingId === removingAdmin.adminId) {
      return;
    }

    setRemovalPendingId(removingAdmin.adminId);

    try {
      const res = await fetch("/api/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId: removingAdmin.adminId }),
      });
      const data = await readJson<{ error?: string; message?: string }>(res);

      if (!res.ok) {
        throw new Error(data?.error || "Unable to remove admin access");
      }

      toast.success(data?.message || "Admin access removed");
      setRemovingAdmin(null);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to remove admin access");
    } finally {
      setRemovalPendingId(null);
    }
  }

  function closeCreateModal() {
    if (isCreating) {
      return;
    }

    setCreateModalOpen(false);
    setForm(emptyForm);
  }

  function closeRemoveModal() {
    if (removalPendingId === removingAdmin?.adminId) {
      return;
    }

    setRemovingAdmin(null);
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Input
            placeholder="Search users"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          {canManageAdmins ? (
            <Button onClick={() => setCreateModalOpen(true)}>Add Admin</Button>
          ) : (
            <p className="text-sm text-text-secondary">
              Only core admins can add or remove administrator access.
            </p>
          )}
        </div>
      </Card>

      <Card className="overflow-x-auto">
        {loading ? (
          <p className="text-sm text-text-secondary">Loading users...</p>
        ) : (
          <table className="min-w-full text-left">
            <thead>
              <tr className="border-b border-border text-sm text-text-secondary">
                <th className="py-3 pr-4">Full Name</th>
                <th className="py-3 pr-4">Username</th>
                <th className="py-3 pr-4">Email</th>
                <th className="py-3 pr-4">Contact</th>
                <th className="py-3 pr-4">Role</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.userId} className="border-b border-border">
                  <td className="py-3 pr-4">{user.name}</td>
                  <td className="py-3 pr-4">{user.username}</td>
                  <td className="py-3 pr-4">{user.email}</td>
                  <td className="py-3 pr-4">{user.contactNumber}</td>
                  <td className="py-3 pr-4">
                    <Badge tone="neutral">User</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">Admin Accounts</div>
            <p className="mt-1 text-sm text-text-secondary">
              Active and revoked admin accounts are listed here for access review.
            </p>
          </div>

          {currentAdminId != null ? (
            <Badge tone="blue">Current Admin #{currentAdminId}</Badge>
          ) : null}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {admins.map((admin) => (
            <div key={admin.adminId} className="rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{admin.name}</div>
                  <div className="text-sm text-text-secondary">{admin.email}</div>
                  <div className="text-sm text-text-secondary">@{admin.username}</div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge tone={admin.role === "CORE_ADMIN" ? "blue" : "neutral"}>
                    {admin.role === "CORE_ADMIN" ? "Core Admin" : "Admin"}
                  </Badge>
                  <Badge tone={admin.isActive ? "green" : "red"}>
                    {admin.isActive ? "Active" : "Access Removed"}
                  </Badge>
                </div>
              </div>

              <div className="mt-3 space-y-1 text-sm text-text-secondary">
                <p>Contact: {admin.contactNumber}</p>
                <p>Created: {formatDateTime(admin.createdAt)}</p>
                {!admin.isActive ? (
                  <p>Access removed: {formatDateTime(admin.deactivatedAt)}</p>
                ) : null}
              </div>

              {canManageAdmins ? (
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {admin.canBeRemoved ? (
                    <Button
                      variant="danger"
                      disabled={removalPendingId === admin.adminId}
                      onClick={() => setRemovingAdmin(admin)}
                    >
                      {removalPendingId === admin.adminId ? "Removing..." : "Remove Admin"}
                    </Button>
                  ) : (
                    <p className="text-sm text-text-secondary">
                      {admin.removalBlockedReason ??
                        (admin.adminId === currentAdminId
                          ? "You are currently signed in with this admin account."
                          : "This admin cannot be removed.")}
                    </p>
                  )}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </Card>

      <Modal
        open={createModalOpen}
        title="Add Admin"
        onClose={closeCreateModal}
        footer={
          <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row">
            <Button
              variant="ghost"
              className="w-full sm:w-auto"
              disabled={isCreating}
              onClick={closeCreateModal}
            >
              Cancel
            </Button>
            <Button
              className="w-full sm:w-auto"
              disabled={isCreating}
              onClick={() => void createAdmin()}
            >
              {isCreating ? "Saving..." : "Create Admin"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Admin accounts are managed separately from resident accounts.
          </p>
          <Input
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            placeholder="Username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
          <Input
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            placeholder="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <Input
            placeholder="Contact Number"
            value={form.contactNumber}
            onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
          />
          <Input
            placeholder="Gender"
            value={form.gender}
            onChange={(e) => setForm({ ...form, gender: e.target.value })}
          />
          <Input
            type="date"
            value={form.birthdate}
            onChange={(e) => setForm({ ...form, birthdate: e.target.value })}
          />
          <Select
            value={form.adminRole}
            onChange={(e) =>
              setForm({
                ...form,
                adminRole: e.target.value as "CORE_ADMIN" | "ADMIN",
              })
            }
          >
            <option value="ADMIN">Regular Admin</option>
            <option value="CORE_ADMIN">Core Admin</option>
          </Select>
          <Textarea
            placeholder="Address"
            rows={3}
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </div>
      </Modal>

      <Modal
        open={!!removingAdmin}
        title="Remove Admin Access"
        onClose={closeRemoveModal}
        footer={
          <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row">
            <Button
              variant="ghost"
              className="w-full sm:w-auto"
              disabled={removalPendingId === removingAdmin?.adminId}
              onClick={closeRemoveModal}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              className="w-full sm:w-auto"
              disabled={removalPendingId === removingAdmin?.adminId}
              onClick={() => void removeAdmin()}
            >
              {removalPendingId === removingAdmin?.adminId ? "Removing..." : "Remove Admin"}
            </Button>
          </div>
        }
      >
        <div className="space-y-2 text-sm text-text-secondary">
          <p>
            Removing admin access will immediately block this account from signing in to
            the admin portal.
          </p>
          <p>
            <strong>Name:</strong> {removingAdmin?.name}
          </p>
          <p>
            <strong>Email:</strong> {removingAdmin?.email}
          </p>
          <p>
            <strong>Role:</strong>{" "}
            {removingAdmin?.role === "CORE_ADMIN" ? "Core Admin" : "Admin"}
          </p>
        </div>
      </Modal>
    </div>
  );
}
