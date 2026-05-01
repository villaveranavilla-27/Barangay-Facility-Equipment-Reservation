"use client";

import { ProfileForm } from "@/components/profile-form";

export default function UserProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold sm:text-3xl">Profile</h1>
        <p className="mt-1 text-text-secondary">Edit your information and password.</p>
      </div>
      <ProfileForm />
    </div>
  );
}
