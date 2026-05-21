import fs from "node:fs";
import path from "node:path";
import { createDatabaseClientForUrl } from "@/lib/database";
import {
  type AdminRecord,
  type EquipmentRecord,
  type FacilityRecord,
  type ReservationRecord,
  type UserRecord,
} from "@/lib/database-types";

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
const database = createDatabaseClientForUrl(databaseUrl);

async function main() {
  const [admins, users, equipment, facilities, reservations] = await Promise.all([
    database.admin.findMany({ orderBy: { adminId: "asc" } }) as Promise<AdminRecord[]>,
    database.user.findMany({ orderBy: { userId: "asc" } }) as Promise<UserRecord[]>,
    database.equipment.findMany({ orderBy: { equipmentId: "asc" } }) as Promise<EquipmentRecord[]>,
    database.facility.findMany({ orderBy: { facilityId: "asc" } }) as Promise<FacilityRecord[]>,
    database.reservation.findMany({ orderBy: { reservationId: "asc" } }) as Promise<ReservationRecord[]>,
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
    await database.$disconnect();
  });
