import { ProtectedSessionGuard } from "@/components/protected-session-guard";
import { Sidebar } from "@/components/sidebar";
import { requirePageSession } from "@/lib/session";

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  await requirePageSession("USER");

  return (
    <div className="app-shell app-shell--user flex min-h-dvh bg-[var(--bg)]">
      <ProtectedSessionGuard />
      <Sidebar role="user" />
      <main className="app-shell__main w-full flex-1 overflow-x-hidden px-4 pb-6 pt-[calc(var(--mobile-shell-header-height)+1rem)] sm:px-6 sm:pb-8 sm:pt-[calc(var(--mobile-shell-header-height)+1.5rem)] lg:ml-[var(--sidebar-width)] lg:px-8 lg:pb-8 lg:pt-8">
        {children}
      </main>
    </div>
  );
}
