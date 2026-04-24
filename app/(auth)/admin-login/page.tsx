import Image from "next/image";
import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f3f3f3] px-4">
      <div className="w-full max-w-[600px] rounded-3xl bg-white px-16 py-20 shadow-md">
        <div className="mb-8 flex flex-col items-center">
          <Image
            src="/logo.png"
            alt="Barangay Go Logo"
            width={300}
            height={100}
            className="object-contain"
            priority
          />
        </div>

        <h2 className="mb-6 border-b-2 border-green-700 pb-1 text-left text-2xl font-bold text-green-700">
          ADMIN LOGIN
        </h2>

        <AuthForm mode="admin-login" />

        <div className="mt-6 flex items-center justify-between text-base text-green-700">
          <Link href="/login" className="font-medium hover:underline">
            Back to User Login
          </Link>
        </div>
      </div>
    </main>
  );
}
