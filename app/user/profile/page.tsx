"use client";

import { ProfileForm } from "@/components/profile-form";

export default function UserProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Profile</h1>
        <p className="mt-1 text-text-secondary">Edit your information and password.</p>
      </div>
      <ProfileForm />
    </div>
  );
}
