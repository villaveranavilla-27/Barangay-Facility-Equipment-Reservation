"use client";

import { ProfileForm } from "@/components/profile-form";

export default function UserProfilePage() {
  return (
    <div className="space-y-6">
      <div className="app-page__header">
        <h1 className="app-page__title">Profile</h1>
        <p className="app-page__description">Edit your information and password.</p>
      </div>
      <ProfileForm />
    </div>
  );
}
