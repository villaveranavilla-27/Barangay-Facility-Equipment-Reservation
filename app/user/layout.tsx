import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ProtectedSessionGuard } from "@/components/protected-session-guard";
import { Sidebar } from "@/components/sidebar";
import { isActiveUser } from "@/lib/access";

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!isActiveUser(session?.user)) redirect("/login");

  return (
    <div className="flex min-h-screen bg-[var(--bg)]">
      <ProtectedSessionGuard />
      <Sidebar role="user" />
      <main className="ml-80 flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
