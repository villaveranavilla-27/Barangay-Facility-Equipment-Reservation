import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isActiveAdmin } from "@/lib/access";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (isActiveAdmin(session?.user)) redirect("/admin/dashboard");
  if (session?.user?.role === "USER") redirect("/user/dashboard");
  redirect("/login");
}
