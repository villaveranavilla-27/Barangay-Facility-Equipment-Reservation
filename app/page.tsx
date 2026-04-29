import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isActiveAdmin, isActiveUser } from "@/lib/access";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (isActiveAdmin(session?.user)) redirect("/admin/dashboard");
  if (isActiveUser(session?.user)) redirect("/user/dashboard");
  redirect("/login");
}
