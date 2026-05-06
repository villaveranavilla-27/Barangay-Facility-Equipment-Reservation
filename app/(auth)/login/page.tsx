import Image from "next/image";
import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-start justify-center bg-[#f3f3f3] px-4 py-6 sm:px-6 sm:py-10 lg:items-center lg:py-12">
      <div className="w-full max-w-[600px] rounded-3xl bg-white px-6 py-8 shadow-md sm:px-10 sm:py-12 lg:px-16 lg:py-16">
        <div className="mb-8 flex flex-col items-center">
          <Image
            src="/logo.png"
            alt="Barangay Go Logo"
            width={300}
            height={100}
            className="h-auto w-48 object-contain sm:w-64"
            priority
          />
        </div>

        <h2 className="mb-6 border-b-2 border-green-700 pb-1 text-left text-2xl font-bold text-green-700">
          USER LOGIN
        </h2>

        <AuthForm mode="user-login" />

        <div className="mt-6 flex flex-col gap-2 text-sm text-green-700 sm:flex-row sm:items-center sm:justify-between sm:text-base">
          <Link href="/admin-login" className="font-medium hover:underline">
            Admin Login
          </Link>

          <Link href="/register" className="font-medium hover:underline">
            Create Account
          </Link>
        </div>
      </div>
    </main>
  );
}
