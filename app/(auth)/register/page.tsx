import Link from "next/link";
import Image from "next/image";
import { AuthForm } from "@/components/auth-form";

export default function RegisterPage() {
  return (
    <main className="flex min-h-dvh items-start justify-center bg-gray-50 px-4 py-6 sm:px-6 sm:py-10 lg:items-center lg:py-12">
      <div className="w-full max-w-[680px] rounded-2xl bg-white px-4 py-5 shadow-md sm:px-6 sm:py-6">
        <div className="mb-3 flex flex-col items-center">
          <Image
            src="/logo.png"
            alt="Barangay Go Logo"
            width={200}
            height={70}
            className="h-auto w-40 object-contain sm:w-52"
            priority
          />
        </div>

        <h2 className="mb-3 border-b-2 border-green-700 pb-1 text-left text-xl font-bold text-green-700">
          CREATE ACCOUNT
        </h2>

        <AuthForm mode="register" />

        <div className="mt-3 text-right text-sm text-green-700">
          <Link href="/login" className="font-medium hover:underline">
            Back to User Login
          </Link>
        </div>
      </div>
    </main>
  );
}
