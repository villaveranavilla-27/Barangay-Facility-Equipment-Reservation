import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

function requireEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

const databaseUrl = requireEnv("BACKUP_DATABASE_URL");
const outputPath = requireEnv("BACKUP_OUTPUT_PATH");
const label = process.env.BACKUP_LABEL?.trim() || "database-backup";

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
