"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Button, Input, Select, Textarea } from "@/components/common";

const genderOptions = ["Male", "Female", "Other", "Prefer not to say"] as const;

function sanitizeUsername(value: string) {
  return value.replace(/[^A-Za-z0-9_]/g, "").slice(0, 191);
}

function sanitizeContactNumber(value: string) {
  return value.replace(/\D/g, "").slice(0, 15);
}

function Field({
  label,
  children,
  helper,
}: {
  label: string;
  children: React.ReactNode;
  helper?: string;
}) {
  return (
    <div className="field-stack">
      <label className="field-label">{label}</label>
      {children}
      {helper ? <p className="field-helper">{helper}</p> : null}
    </div>
  );
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

  const isRegister = mode === "register";
  const isAdmin = mode === "admin-login";

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
        if (!res.ok) {
          throw new Error(data.error || "Registration failed");
        }

        toast.success("Account created. Please log in.");
        router.push("/login");
        return;
      }

      const intendedRole = isAdmin ? "admin" : "user";
      const identifier = form.identifier.trim();
      const password = form.password;
      const destination = isAdmin ? "/admin/dashboard" : "/user/dashboard";

      if (!identifier || !password) {
        throw new Error("Username and password are required");
      }

      const res = await fetch("/api/auth/login", {
        method: "POST",
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

      toast.success(isAdmin ? "Admin login successful" : "Login successful");
      router.replace(data.destination || destination);
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {isRegister ? (
        <>
          <Field label="Full Name">
            <Input
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              minLength={2}
              maxLength={191}
              autoComplete="name"
              required
            />
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Username" helper="Letters, numbers, and underscore only.">
              <Input
                value={form.username}
                onChange={(e) => updateField("username", sanitizeUsername(e.target.value))}
                minLength={3}
                maxLength={191}
                autoComplete="username"
                required
              />
            </Field>
            <Field label="Email Address">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                maxLength={191}
                autoComplete="email"
                required
              />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Password" helper="Use at least 4 characters.">
              <Input
                type="password"
                value={form.password}
                onChange={(e) => updateField("password", e.target.value)}
                minLength={4}
                maxLength={191}
                autoComplete="new-password"
                required
              />
            </Field>
            <Field label="Contact Number">
              <Input
                type="tel"
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
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Gender">
              <Select
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
            </Field>
            <Field label="Birthdate">
              <Input
                type="date"
                value={form.birthdate}
                onChange={(e) => updateField("birthdate", e.target.value)}
                max={new Date().toISOString().slice(0, 10)}
              />
            </Field>
          </div>

          <Field label="Address">
            <Textarea
              rows={3}
              className="min-h-[108px]"
              value={form.address}
              onChange={(e) => updateField("address", e.target.value)}
              maxLength={191}
            />
          </Field>
        </>
      ) : (
        <>
          <Field
            label={isAdmin ? "Admin Email or Username" : "Email or Username"}
            helper={isAdmin ? "Use your administrator credentials." : undefined}
          >
            <Input
              value={form.identifier}
              onChange={(e) => updateField("identifier", e.target.value)}
              autoComplete="username"
              required
            />
          </Field>

          <Field label="Password">
            <Input
              type="password"
              value={form.password}
              onChange={(e) => updateField("password", e.target.value)}
              autoComplete="current-password"
              required
            />
          </Field>
        </>
      )}

      {errorMessage ? (
        <div className="surface-note surface-note--danger">
          <p className="field-error">{errorMessage}</p>
        </div>
      ) : null}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading
          ? "Please wait..."
          : isRegister
            ? "Create Account"
            : isAdmin
              ? "Sign In to Admin Portal"
              : "Sign In"}
      </Button>
    </form>
  );
}
