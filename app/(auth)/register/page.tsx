import Link from "next/link";
import Image from "next/image";
import { AuthForm } from "@/components/auth-form";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-4 bg-gray-50">
      <div className="w-full max-w-[680px] bg-white px-6 py-5 shadow-md rounded-lg">
        {/* Logo – smaller to save vertical space */}
        <div className="mb-3 flex flex-col items-center">
          <Image
            src="/logo.png"
            alt="Barangay Go Logo"
            width={200}
            height={70}
            className="object-contain"
            priority
          />
        </div>

        {/* Title – reduced margin and font size */}
        <h2 className="mb-3 border-b-2 border-green-700 pb-1 text-left text-xl font-bold text-green-700">
          CREATE ACCOUNT
        </h2>

        {/* Compact registration form */}
        <AuthForm mode="register" />

        {/* Back link – smaller margin and text */}
        <div className="mt-3 text-right text-sm text-green-700">
          <Link href="/login" className="font-medium hover:underline">
            Back to User Login
          </Link>
        </div>
      </div>
    </div>
  );
}