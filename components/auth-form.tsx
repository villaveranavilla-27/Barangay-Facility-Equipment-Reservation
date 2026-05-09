"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Select, Textarea } from "@/components/common";
import toast from "react-hot-toast";

const genderOptions = ["Male", "Female", "Other", "Prefer not to say"] as const;

function sanitizeUsername(value: string) {
  return value.replace(/[^A-Za-z0-9_]/g, "").slice(0, 191);
}

function sanitizeContactNumber(value: string) {
  return value.replace(/\D/g, "").slice(0, 15);
}

export function AuthForm({
  mode,
}: {
  mode: "user-login" | "admin-login" | "register";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [form, setForm] = useState<Record<string, string>>({
    identifier: "",
    password: "",
    name: "",
    username: "",
    email: "",
    contactNumber: "",
    gender: "Male",
    birthdate: "",
    address: "",
  });

  function updateField(field: string, value: string) {
    setErrorMessage("");
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      // REGISTER
      if (mode === "register") {
        const registerPayload = {
          name: form.name.trim(),
          username: form.username.trim(),
          email: form.email.trim(),
          password: form.password,
          contactNumber: form.contactNumber.trim(),
          gender: form.gender.trim(),
          birthdate: form.birthdate || null,
          address: form.address.trim() || null,
        };

        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(registerPayload),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Registration failed");

        toast.success("Account created. Please log in.");
        router.push("/login");
        return;
      }

      // LOGIN
      const intendedRole = mode === "admin-login" ? "admin" : "user";
      const identifier = form.identifier.trim();
      const password = form.password;

      const destination =
        mode === "admin-login"
          ? "/admin/dashboard"
          : "/user/dashboard";

      if (!identifier || !password) {
        throw new Error("Username and password are required");
      }

      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier,
          password,
          intendedRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Invalid email/username or password");
      }

      toast.success(
        mode === "admin-login"
          ? "Admin login successful"
          : "Login successful"
      );

      // ✅ FORCE correct route (fixes Vercel redirect issue)
      router.replace(data.destination || destination);
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong";

      setErrorMessage(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  // ===== STYLES (UNCHANGED) =====
  const isAdmin = mode === "admin-login";
  const isRegister = mode === "register";

  const formSpacing = isRegister
    ? "space-y-2.5"
    : isAdmin
    ? "space-y-6"
    : "space-y-4";

  const labelClasses = isRegister
    ? "mb-0.5 block text-xs font-medium text-gray-700"
    : isAdmin
    ? "mb-1.5 block text-base font-medium text-gray-700 dark:text-gray-300"
    : "mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300";

  const inputClasses = isRegister
    ? "w-full rounded-md border-gray-300 text-sm py-1.5 px-3 shadow-sm focus:border-brand-500 focus:ring-brand-500"
    : isAdmin
    ? "w-full rounded-lg border-gray-300 text-base py-3 px-4 shadow-sm focus:border-brand-500 focus:ring-brand-500"
    : "w-full rounded-md border-gray-300 text-sm py-2 px-3 shadow-sm focus:border-brand-500 focus:ring-brand-500";

  const buttonClasses = isRegister
    ? "w-full py-1.5 text-sm font-semibold rounded-md mt-1"
    : isAdmin
    ? "w-full py-3 text-lg font-semibold rounded-lg"
    : "w-full";

  const gridGap = isRegister ? "gap-2" : "gap-4";

  return (
    <form onSubmit={submit} className={formSpacing}>
      {mode === "register" ? (
        <>
          {/* REGISTER */}
          <div>
            <label className={labelClasses}>Full Name</label>
            <Input
              className={inputClasses}
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              minLength={2}
              maxLength={191}
              autoComplete="name"
              required
            />
          </div>

          <div className={`grid ${gridGap} md:grid-cols-2`}>
            <div>
              <label className={labelClasses}>Username</label>
              <Input
                className={inputClasses}
                value={form.username}
                onChange={(e) =>
                  updateField("username", sanitizeUsername(e.target.value))
                }
                minLength={3}
                maxLength={191}
                autoComplete="username"
                required
              />
            </div>

            <div>
              <label className={labelClasses}>Email</label>
              <Input
                type="email"
                className={inputClasses}
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                maxLength={191}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className={`grid ${gridGap} md:grid-cols-2`}>
            <div>
              <label className={labelClasses}>Password</label>
              <Input
                type="password"
                className={inputClasses}
                value={form.password}
                onChange={(e) => updateField("password", e.target.value)}
                minLength={4}
                maxLength={191}
                autoComplete="new-password"
                required
              />
            </div>

            <div>
              <label className={labelClasses}>Contact Number</label>
              <Input
                type="tel"
                className={inputClasses}
                value={form.contactNumber}
                onChange={(e) =>
                  updateField("contactNumber", sanitizeContactNumber(e.target.value))
                }
                inputMode="numeric"
                pattern="[0-9]{7,15}"
                minLength={7}
                maxLength={15}
                autoComplete="tel"
                required
              />
            </div>
          </div>

          <div className={`grid ${gridGap} md:grid-cols-2`}>
            <div>
              <label className={labelClasses}>Gender</label>
              <Select
                className={inputClasses}
                value={form.gender}
                onChange={(e) => updateField("gender", e.target.value)}
                required
              >
                {genderOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className={labelClasses}>Birthdate</label>
              <Input
                type="date"
                className={inputClasses}
                value={form.birthdate}
                onChange={(e) => updateField("birthdate", e.target.value)}
                max={new Date().toISOString().slice(0, 10)}
              />
            </div>
          </div>

          <div>
            <label className={labelClasses}>Address</label>
            <Textarea
              rows={3}
              className={inputClasses}
              value={form.address}
              onChange={(e) => updateField("address", e.target.value)}
              maxLength={191}
            />
          </div>

          <Button type="submit" className={buttonClasses} disabled={loading}>
            {loading ? "Please wait..." : "Create Account"}
          </Button>

          {errorMessage && (
            <p className="text-sm font-medium text-red-600">
              {errorMessage}
            </p>
          )}
        </>
      ) : (
        <>
          {/* LOGIN */}
          <div>
            <label className={labelClasses}>
              {mode === "admin-login"
                ? "Admin Email or Username"
                : "Email or Username"}
            </label>
            <Input
              className={inputClasses}
              value={form.identifier}
              onChange={(e) => updateField("identifier", e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div>
            <label className={labelClasses}>Password</label>
            <Input
              type="password"
              className={inputClasses}
              value={form.password}
              onChange={(e) => updateField("password", e.target.value)}
              autoComplete={
                mode === "admin-login" ? "current-password" : "current-password"
              }
              required
            />
          </div>

          <Button type="submit" className={buttonClasses} disabled={loading}>
            {loading
              ? "Please wait..."
              : mode === "admin-login"
              ? "ADMIN LOGIN"
              : "LOGIN"}
          </Button>

          {errorMessage && (
            <p className="text-sm font-medium text-red-600">
              {errorMessage}
            </p>
          )}
        </>
      )}
    </form>
  );
}
