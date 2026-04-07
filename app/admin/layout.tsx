import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") redirect("/admin-login");

  return (
    <div className="flex min-h-screen bg-[var(--bg)]">
      <Sidebar role="admin" />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
