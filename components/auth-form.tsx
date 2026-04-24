"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button, Input, Textarea } from "@/components/common";
import toast from "react-hot-toast";

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
      if (mode === "register") {
        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Registration failed");

        toast.success("Account created. Please log in.");
        router.push("/login");
        return;
      }

      const intendedRole = mode === "admin-login" ? "admin" : "user";
      const identifier = form.identifier.trim();
      const password = form.password;
      const destination = mode === "admin-login" ? "/admin/dashboard" : "/user/dashboard";

      if (!identifier || !password) {
        throw new Error("Username and password are required");
      }

      const res = await signIn("credentials", {
        redirect: false,
        callbackUrl: destination,
        identifier,
        password,
        intendedRole,
      });

      if (!res?.ok || res.error) {
        throw new Error("Invalid email/username or password");
      }

      toast.success(mode === "admin-login" ? "Admin login successful" : "Login successful");
      router.replace(res.url ?? destination);
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

  // Styles based on mode
  const isAdmin = mode === "admin-login";
  const isRegister = mode === "register";

  const formSpacing = isRegister ? "space-y-2.5" : isAdmin ? "space-y-6" : "space-y-4";
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
          <div>
            <label className={labelClasses}>Full Name</label>
            <Input
              className={inputClasses}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className={labelClasses}>Username</label>
            <Input
              className={inputClasses}
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
          </div>

          <div>
            <label className={labelClasses}>Email</label>
            <Input
              type="email"
              className={inputClasses}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div>
            <label className={labelClasses}>Password</label>
            <Input
              type="password"
              className={inputClasses}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          <div>
            <label className={labelClasses}>Contact Number</label>
            <Input
              className={inputClasses}
              value={form.contactNumber}
              onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
              required
            />
          </div>

          <div className={`grid grid-cols-2 ${gridGap}`}>
            <div>
              <label className={labelClasses}>Gender</label>
              <Input
                className={inputClasses}
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                required
              />
            </div>
            <div>
              <label className={labelClasses}>Birthdate</label>
              <Input
                type="date"
                className={inputClasses}
                value={form.birthdate}
                onChange={(e) => setForm({ ...form, birthdate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className={labelClasses}>Address</label>
            <Textarea
              className={isRegister ? "w-full rounded-md border-gray-300 text-sm py-1.5 px-3" : "w-full rounded-md"}
              rows={2}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>

          <Button type="submit" className={buttonClasses} disabled={loading}>
            {loading ? "Please wait..." : "Create Account"}
          </Button>
        </>
      ) : (
        // LOGIN MODES (user + admin)
        <>
          <div>
            <label className={labelClasses}>
              {mode === "admin-login" ? "Admin Email or Username" : "Email or Username"}
            </label>
            <Input
              className={inputClasses}
              value={form.identifier}
              onChange={(e) => updateField("identifier", e.target.value)}
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
              required
            />
          </div>

          <Button type="submit" className={buttonClasses} disabled={loading}>
            {loading ? "Please wait..." : mode === "admin-login" ? "ADMIN LOGIN" : "LOGIN"}
          </Button>

          {errorMessage ? (
            <p className="text-sm font-medium text-red-600" aria-live="polite">
              {errorMessage}
            </p>
          ) : null}
        </>
      )}
    </form>
  );
}
