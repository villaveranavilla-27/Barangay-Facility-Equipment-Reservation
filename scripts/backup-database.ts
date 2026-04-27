import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const databaseUrl = process.env.BACKUP_DATABASE_URL?.trim();
const outputPath = process.env.BACKUP_OUTPUT_PATH?.trim();
const label = process.env.BACKUP_LABEL?.trim() || "database-backup";

if (!databaseUrl) {
  throw new Error("BACKUP_DATABASE_URL is required.");
}

if (!outputPath) {
  throw new Error("BACKUP_OUTPUT_PATH is required.");
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

async function main() {
  const [admins, users, equipment, facilities, reservations] = await Promise.all([
    prisma.admin.findMany({ orderBy: { adminId: "asc" } }),
    prisma.user.findMany({ orderBy: { userId: "asc" } }),
    prisma.equipment.findMany({ orderBy: { equipmentId: "asc" } }),
    prisma.facility.findMany({ orderBy: { facilityId: "asc" } }),
    prisma.reservation.findMany({ orderBy: { reservationId: "asc" } }),
  ]);

  const payload = {
    label,
    exportedAt: new Date().toISOString(),
    counts: {
      admins: admins.length,
      users: users.length,
      equipment: equipment.length,
      facilities: facilities.length,
      reservations: reservations.length,
    },
    data: {
      admins,
      users,
      equipment,
      facilities,
      reservations,
    },
  };

  const absoluteOutputPath = path.resolve(process.cwd(), outputPath);
  fs.mkdirSync(path.dirname(absoluteOutputPath), { recursive: true });
  fs.writeFileSync(absoluteOutputPath, JSON.stringify(payload, null, 2), "utf8");

  console.log(`Backup written to ${absoluteOutputPath}`);
  console.log(
    `Counts: admins=${admins.length}, users=${users.length}, equipment=${equipment.length}, facilities=${facilities.length}, reservations=${reservations.length}`
  );
}

main()
  .catch((error) => {
    console.error("Backup failed.");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
