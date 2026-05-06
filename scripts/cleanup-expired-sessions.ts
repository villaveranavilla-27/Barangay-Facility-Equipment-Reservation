import { cleanupExpiredSessions } from "@/lib/session";
import { prisma } from "@/lib/prisma";

async function main() {
  const deletedCount = await cleanupExpiredSessions();
  console.log(`Deleted ${deletedCount} expired session(s).`);
}

main()
  .catch((error) => {
    console.error("Session cleanup failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
