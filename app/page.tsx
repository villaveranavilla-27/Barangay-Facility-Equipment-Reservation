import { redirect } from "next/navigation";
import { redirectIfAuthenticated } from "@/lib/session";

export default async function HomePage() {
  await redirectIfAuthenticated();
  redirect("/login");
}
