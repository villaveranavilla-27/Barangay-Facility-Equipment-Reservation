"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Button, Input, Modal } from "@/components/common";
import { cn } from "@/lib/utils";

type CandidateUser = {
  userId: number;
  name: string;
  username: string;
  email: string;
  role: "USER" | "ADMIN";
  isActive: boolean;
};

type AddAdminModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

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

export default function AddAdminModal({
  open,
  onClose,
  onSuccess,
}: AddAdminModalProps) {
  const [users, setUsers] = useState<CandidateUser[]>([]);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<CandidateUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!open) {
      setUsers([]);
      setSearch("");
      setSelectedUser(null);
      setLoading(false);
      setFetching(false);
      return;
    }

    let cancelled = false;

    async function fetchUsers() {
      setFetching(true);

      try {
        const res = await fetch(`/api/users?search=${encodeURIComponent(search)}`, {
          cache: "no-store",
        });
        const data = await readJson<CandidateUser[]>(res);

        if (!res.ok) {
          throw new Error("Unable to load users.");
        }

        const availableUsers = (Array.isArray(data) ? data : []).filter(
          (user) => user.role !== "ADMIN" && user.isActive
        );

        if (cancelled) {
          return;
        }

        setUsers(availableUsers);
        setSelectedUser((current) =>
          current && availableUsers.some((user) => user.userId === current.userId)
            ? current
            : null
        );
      } catch (error) {
        if (cancelled) {
          return;
        }

        toast.error(error instanceof Error ? error.message : "Unable to load users.");
        setUsers([]);
        setSelectedUser(null);
      } finally {
        if (!cancelled) {
          setFetching(false);
        }
      }
    }

    void fetchUsers();

    return () => {
      cancelled = true;
    };
  }, [open, search]);

  async function handleSubmit() {
    if (!selectedUser || loading) {
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUser.userId }),
      });
      const data = await readJson<{ error?: string }>(res);

      if (!res.ok) {
        throw new Error(data?.error || "Unable to add admin.");
      }

      toast.success("Admin access granted.");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to add admin.");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    if (loading) {
      return;
    }

    onClose();
  }

  return (
    <Modal
      open={open}
      title="Add New Admin"
      onClose={handleClose}
      footer={
        <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row">
          <Button
            variant="ghost"
            className="w-full sm:w-auto"
            disabled={loading}
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            className="w-full sm:w-auto"
            disabled={loading || !selectedUser}
            onClick={() => void handleSubmit()}
          >
            {loading ? "Adding..." : "Add as Admin"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-text-secondary">
            Search for an active user account and promote it to admin access.
          </p>
          <Input
            placeholder="Search name, username, or email"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="max-h-80 space-y-2 overflow-y-auto">
          {fetching ? (
            <p className="text-sm text-text-secondary">Loading users...</p>
          ) : users.length > 0 ? (
            users.map((user) => {
              const isSelected = selectedUser?.userId === user.userId;

              return (
                <button
                  key={user.userId}
                  type="button"
                  className={cn(
                    "w-full rounded-xl border px-4 py-3 text-left transition",
                    isSelected
                      ? "border-[#165719] bg-[#e9f3ea]"
                      : "border-border bg-white hover:border-[#165719]/40 hover:bg-[#f6faf7]"
                  )}
                  onClick={() => setSelectedUser(user)}
                >
                  <div className="font-medium text-text-primary">{user.name}</div>
                  <div className="text-sm text-text-secondary">{user.email}</div>
                  <div className="text-sm text-text-secondary">@{user.username}</div>
                </button>
              );
            })
          ) : (
            <p className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-text-secondary">
              No eligible users found for this search.
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}
