import Image from "next/image";
import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
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
          <h1 className="auth-card__title">Resident Login</h1>
          <p className="auth-card__description">
            Access your dashboard, review reservation activity, and book barangay
            facilities or equipment.
          </p>
        </div>

        <div className="mt-6">
          <AuthForm mode="user-login" />
        </div>

        <div className="mt-6 flex flex-col gap-3 text-sm text-text-secondary sm:flex-row sm:items-center sm:justify-between">
          <Link href="/admin-login" className="font-semibold text-brand-600 transition hover:text-brand-500">
            Admin Login
          </Link>

          <Link href="/register" className="font-semibold text-brand-600 transition hover:text-brand-500">
            Create Account
          </Link>
        </div>
      </section>
    </main>
  );
}
