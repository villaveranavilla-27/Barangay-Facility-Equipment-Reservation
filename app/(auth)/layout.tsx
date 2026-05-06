import { redirectIfAuthenticated } from "@/lib/session";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  await redirectIfAuthenticated();

  return (
    <div className="min-h-dvh bg-[var(--bg)]">
      {children}
    </div>
  );
}
