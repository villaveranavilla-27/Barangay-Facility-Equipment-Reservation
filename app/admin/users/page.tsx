"use client";

import { UsersDirectory } from "@/components/users-directory";

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold sm:text-3xl">Users Directory</h1>
        <p className="mt-1 text-text-secondary">
          Review client accounts, activate or deactivate users, and manage administrator access.
        </p>
      </div>
      <UsersDirectory />
    </div>
  );
}
