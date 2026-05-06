import { ProtectedSessionGuard } from "@/components/protected-session-guard";
import { Sidebar } from "@/components/sidebar";
import { requirePageSession } from "@/lib/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requirePageSession("ADMIN");

  return (
    <div className="app-shell bg-[var(--bg)]">
      <ProtectedSessionGuard />
      <Sidebar role="admin" />
      <main className="app-shell__content overflow-x-hidden">
        <div className="app-page">{children}</div>
      </main>
    </div>
  );
}
