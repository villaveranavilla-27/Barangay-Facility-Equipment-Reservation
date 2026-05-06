"use client";

import { UsersDirectory } from "@/components/users-directory";

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div className="app-page__header">
        <h1 className="app-page__title">Users Directory</h1>
        <p className="app-page__description">
          Review client accounts, activate or deactivate users, and manage administrator access.
        </p>
      </div>
      <UsersDirectory />
    </div>
  );
}
