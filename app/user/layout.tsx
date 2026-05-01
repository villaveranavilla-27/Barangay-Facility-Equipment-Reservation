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
      <main className="w-full flex-1 overflow-x-hidden overflow-y-auto p-4 pt-24 sm:p-6 sm:pt-24 lg:ml-80 lg:p-6 lg:pt-6">
        {children}
      </main>
    </div>
  );
}
