import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      {/* Larger card container */}
      <div className="w-full max-w-3xl md:max-w-4xl">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 md:p-10">
          {/* Larger heading */}
          <h2 className="mb-6 text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white">
            Administrator Login
          </h2>
          
          {/* AuthForm – consider passing a `size="lg"` prop if your component supports it */}
          <AuthForm mode="admin-login" />
          
          {/* Larger, clearer link */}
          <div className="mt-6 text-center text-base text-text-secondary">
            <Link 
              href="/login" 
              className="font-medium text-brand-600 hover:underline transition-colors"
            >
              ← Back to resident login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}