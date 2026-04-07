import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default function AdminLoginPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-12">
      <div className="grid w-full max-w-4xl gap-8 lg:grid-cols-2">
        <div className="rounded-2xl bg-slate-900 p-10 text-white shadow-soft">
          <div className="inline-flex rounded-full bg-white/15 px-3 py-1 text-sm">Admin Portal</div>
          <h1 className="mt-6 text-4xl font-bold">Manage reservations, users, and reports.</h1>
          <p className="mt-4 text-white/80">
            Review requests, approve bookings, keep the calendar updated, and export reports.
          </p>
        </div>
        <div>
          <h2 className="mb-4 text-2xl font-semibold">Administrator Login</h2>
          <AuthForm mode="admin-login" />
          <div className="mt-4 text-center text-sm text-text-secondary">
            <Link href="/login" className="font-medium text-brand-600 hover:underline">Back to resident login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
