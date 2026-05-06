import Image from "next/image";
import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default function AdminLoginPage() {
  return (
    <main className="auth-shell">
      <section className="auth-card auth-card--compact">
        <div className="auth-card__logo">
          <Image
            src="/logo.png"
            alt="Barangay Go Logo"
            width={300}
            height={100}
            className="h-auto w-44 object-contain sm:w-56"
            priority
          />
        </div>

        <div className="app-page__header">
          <h1 className="auth-card__title">Administrator Login</h1>
          <p className="auth-card__description">
            Review requests, manage access, and keep reservation operations organized
            from one workspace.
          </p>
        </div>

        <div className="mt-6">
          <AuthForm mode="admin-login" />
        </div>

        <div className="mt-6 flex flex-col gap-3 text-sm text-text-secondary sm:flex-row sm:items-center sm:justify-between">
          <Link href="/login" className="font-semibold text-brand-600 transition hover:text-brand-500">
            Back to User Login
          </Link>
        </div>
      </section>
    </main>
  );
}
