"use client";

import { UsersDirectory } from "@/components/users-directory";

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Users Directory</h1>
        <p className="mt-1 text-text-secondary">
          Review resident accounts and manage administrator access.
        </p>
      </div>
      <UsersDirectory />
    </div>
  );
}
