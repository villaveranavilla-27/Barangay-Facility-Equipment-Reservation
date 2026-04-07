"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button, Card, Input, Textarea } from "@/components/common";
import toast from "react-hot-toast";

export function AuthForm({
  mode
}: {
  mode: "user-login" | "admin-login" | "register";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({
    identifier: "",
    password: "",
    fullName: "",
    username: "",
    email: "",
    contactInfo: "",
    gender: "Male",
    birthdate: "",
    address: ""
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "register") {
        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Registration failed");
        toast.success("Account created. Please log in.");
        router.push("/login");
        return;
      }

      const role = mode === "admin-login" ? "ADMIN" : "USER";
      const res = await signIn("credentials", {
        redirect: false,
        identifier: form.identifier,
        password: form.password,
        role
      });

      if (res?.error) throw new Error("Invalid credentials");
      router.push(role === "ADMIN" ? "/admin/dashboard" : "/user/dashboard");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <form onSubmit={submit} className="space-y-4">
        {mode === "register" ? (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium">Full Name</label>
              <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Username</label>
              <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Password</label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Contact Number</label>
              <Input value={form.contactInfo} onChange={(e) => setForm({ ...form, contactInfo: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Gender</label>
                <Input value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} required />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Birthdate</label>
                <Input type="date" value={form.birthdate} onChange={(e) => setForm({ ...form, birthdate: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Address</label>
              <Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={3} />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium">Email or Username</label>
              <Input value={form.identifier} onChange={(e) => setForm({ ...form, identifier: e.target.value })} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Password</label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </div>
          </>
        )}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Please wait..." : mode === "register" ? "Create Account" : "Sign In"}
        </Button>
      </form>
    </Card>
  );
}
