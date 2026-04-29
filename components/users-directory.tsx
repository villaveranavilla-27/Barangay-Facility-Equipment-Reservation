"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Badge,
  Button,
  Card,
  Input,
  Modal,
} from "@/components/common";

type UserRecord = {
  userId: number;
  name: string;
  username: string;
  email: string;
  contactNumber: string;
  isActive: boolean;
  deactivatedAt?: string | null;
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
  const [removingAdmin, setRemovingAdmin] = useState<AdminRecord | null>(null);
  const [adminPendingUserId, setAdminPendingUserId] = useState<number | null>(null);
  const [removalPendingId, setRemovalPendingId] = useState<number | null>(null);
  const [statusPendingUserId, setStatusPendingUserId] = useState<number | null>(null);
  const [query, setQuery] = useState("");

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
  const activeAdminsByUsername = new Map(
    admins
      .filter((admin) => admin.isActive)
      .map((admin) => [admin.username.toLowerCase(), admin] as const)
  );
  const currentAdminUsername =
    admins.find((admin) => admin.adminId === currentAdminId)?.username ?? null;

  async function assignAdmin(user: UserRecord) {
    if (adminPendingUserId === user.userId) {
      return;
    }

    if (!canManageAdmins) {
      toast.error("Only core admins can manage administrator access.");
      return;
    }

    const existingUser = users.find((entry) => entry.userId === user.userId);

    if (!existingUser) {
      toast.error("User account not found.");
      return;
    }

    if (!existingUser.isActive) {
      toast.error("Only active user accounts can be granted admin access.");
      return;
    }

    if (activeAdminsByUsername.has(existingUser.username.toLowerCase())) {
      toast.error("This user account already has active admin access.");
      return;
    }

    setAdminPendingUserId(existingUser.userId);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: existingUser.userId,
        }),
      });
      const data = await readJson<{
        error?: string;
        message?: string;
        admin?: Omit<AdminRecord, "canBeRemoved" | "removalBlockedReason">;
      }>(res);

      if (!res.ok) {
        throw new Error(data?.error || "Unable to grant admin access");
      }

      toast.success(data?.message || "Admin access granted");

      if (data?.admin) {
        const grantedAdmin = data.admin;

        setAdmins((current) => {
          const next = current.filter(
            (admin) =>
              admin.adminId !== grantedAdmin.adminId &&
              admin.username.toLowerCase() !== grantedAdmin.username.toLowerCase()
          );

          return [
            {
              ...grantedAdmin,
              canBeRemoved: grantedAdmin.adminId !== currentAdminId,
              removalBlockedReason:
                grantedAdmin.adminId === currentAdminId
                  ? "You are currently signed in with this admin account."
                  : null,
            },
            ...next,
          ].sort((left, right) => right.adminId - left.adminId);
        });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to grant admin access");
    } finally {
      setAdminPendingUserId(null);
    }
  }

  async function toggleUserStatus(user: UserRecord) {
    if (statusPendingUserId === user.userId) {
      return;
    }

    setStatusPendingUserId(user.userId);

    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.userId,
          isActive: !user.isActive,
        }),
      });
      const data = await readJson<{ error?: string; message?: string }>(res);

      if (!res.ok) {
        throw new Error(
          data?.error ||
            `Unable to ${user.isActive ? "deactivate" : "activate"} user account`
        );
      }

      toast.success(
        data?.message ||
          `User account ${user.isActive ? "deactivated" : "activated"} successfully`
      );
      await load();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : `Unable to ${user.isActive ? "deactivate" : "activate"} user account`
      );
    } finally {
      setStatusPendingUserId(null);
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
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4">Role</th>
                <th className="py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const linkedAdmin =
                  activeAdminsByUsername.get(user.username.toLowerCase()) ?? null;
                const isCurrentAdminLinkedUser =
                  user.isActive && currentAdminUsername === user.username;

                return (
                  <tr key={user.userId} className="border-b border-border">
                    <td className="py-3 pr-4">{user.name}</td>
                    <td className="py-3 pr-4">{user.username}</td>
                    <td className="py-3 pr-4">{user.email}</td>
                    <td className="py-3 pr-4">{user.contactNumber}</td>
                    <td className="py-3 pr-4">
                      <Badge tone={user.isActive ? "green" : "red"}>
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge tone={linkedAdmin ? "blue" : "neutral"}>
                        {linkedAdmin
                          ? linkedAdmin.role === "CORE_ADMIN"
                            ? "Core Admin"
                            : "Admin"
                          : "User"}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant={user.isActive ? "danger" : "secondary"}
                          className="px-3 py-1.5 text-sm"
                          disabled={
                            statusPendingUserId === user.userId || isCurrentAdminLinkedUser
                          }
                          onClick={() => void toggleUserStatus(user)}
                        >
                          {statusPendingUserId === user.userId
                            ? user.isActive
                              ? "Deactivating..."
                              : "Activating..."
                            : user.isActive
                              ? "Deactivate"
                              : "Activate"}
                        </Button>
                        {canManageAdmins ? (
                          <Button
                            variant="secondary"
                            className="px-3 py-1.5 text-sm"
                            disabled={
                              adminPendingUserId === user.userId ||
                              !user.isActive ||
                              Boolean(linkedAdmin)
                            }
                            onClick={() => void assignAdmin(user)}
                          >
                            {adminPendingUserId === user.userId
                              ? "Assigning..."
                              : linkedAdmin
                                ? "Already Admin"
                                : "Make Admin"}
                          </Button>
                        ) : null}
                        {isCurrentAdminLinkedUser ? (
                          <span className="text-xs text-text-secondary">
                            Current admin-linked user
                          </span>
                        ) : null}
                        {!user.isActive && user.deactivatedAt ? (
                          <span className="text-xs text-text-secondary">
                            Since {formatDateTime(user.deactivatedAt)}
                          </span>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
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
