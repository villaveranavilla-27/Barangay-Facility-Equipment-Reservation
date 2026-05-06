import Link from "next/link";
import Image from "next/image";
import { AuthForm } from "@/components/auth-form";

export default function RegisterPage() {
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="auth-card__logo">
          <Image
            src="/logo.png"
            alt="Barangay Go Logo"
            width={200}
            height={70}
            className="h-auto w-36 object-contain sm:w-48"
            priority
          />
        </div>

        <div className="app-page__header">
          <h1 className="auth-card__title">Create Resident Account</h1>
          <p className="auth-card__description">
            Register once to request barangay facilities, track approvals, and manage
            your profile from any device.
          </p>
        </div>

        <div className="mt-6">
          <AuthForm mode="register" />
        </div>

        <div className="mt-6 text-right text-sm text-text-secondary">
          <Link href="/login" className="font-semibold text-brand-600 transition hover:text-brand-500">
            Back to User Login
          </Link>
        </div>
      </section>
    </main>
  );
}
