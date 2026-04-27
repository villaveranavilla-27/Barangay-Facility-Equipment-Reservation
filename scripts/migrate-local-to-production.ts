import fs from "node:fs";
import path from "node:path";
import { PrismaClient, Prisma } from "@prisma/client";

type Counts = {
  admins: number;
  users: number;
  equipment: number;
  facilities: number;
  reservations: number;
};

type SyncStats = {
  created: number;
  updated: number;
};

type RowAction = "created" | "updated";
type Mode = "counts" | "compare" | "apply";

const ROOT_DIR = process.cwd();
const SOURCE_ENV_PATH = path.join(ROOT_DIR, ".env");
const TARGET_ENV_PATH = path.join(ROOT_DIR, ".env.production");

function readEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing env file: ${path.basename(filePath)}`);
  }

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  const env: Record<string, string> = {};

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, equalsIndex).trim();
    let value = trimmed.slice(equalsIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

function getDatabaseUrl(filePath: string) {
  const env = readEnvFile(filePath);
  const databaseUrl = env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    throw new Error(`DATABASE_URL is missing in ${path.basename(filePath)}`);
  }

  return databaseUrl;
}

function createClient(databaseUrl: string) {
  return new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });
}

async function getCounts(client: PrismaClient): Promise<Counts> {
  const [admins, users, equipment, facilities, reservations] = await Promise.all([
    client.admin.count(),
    client.user.count(),
    client.equipment.count(),
    client.facility.count(),
    client.reservation.count(),
  ]);

  return { admins, users, equipment, facilities, reservations };
}

function printCounts(label: string, counts: Counts) {
  console.log(
    `${label}: admins=${counts.admins}, users=${counts.users}, equipment=${counts.equipment}, facilities=${counts.facilities}, reservations=${counts.reservations}`
  );
}

async function upsertRows<T>(
  label: string,
  rows: T[],
  upsert: (row: T) => Promise<RowAction>
) {
  const stats: SyncStats = {
    created: 0,
    updated: 0,
  };

  for (const row of rows) {
    const action = await upsert(row);
    stats[action] += 1;
  }

  console.log(`${label}: created=${stats.created}, updated=${stats.updated}`);
  return stats;
}

function stableStringify(value: unknown): string {
  if (value === null || value === undefined) {
    return JSON.stringify(value);
  }

  if (value instanceof Date) {
    return JSON.stringify(value.toISOString());
  }

  if (value instanceof Prisma.Decimal) {
    return JSON.stringify(value.toString());
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
      a.localeCompare(b)
    );

    return `{${entries
      .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

function compareRecords<T extends { [key: string]: unknown }>(
  label: string,
  localRows: T[],
  productionRows: T[],
  idKey: keyof T
) {
  const localMap = new Map(localRows.map((row) => [String(row[idKey]), row]));
  const productionMap = new Map(
    productionRows.map((row) => [String(row[idKey]), row])
  );

  const onlyInLocal: string[] = [];
  const onlyInProduction: string[] = [];
  const different: string[] = [];

  for (const [id, localRow] of localMap) {
    const productionRow = productionMap.get(id);

    if (!productionRow) {
      onlyInLocal.push(id);
      continue;
    }

    if (stableStringify(localRow) !== stableStringify(productionRow)) {
      different.push(id);
    }
  }

  for (const [id] of productionMap) {
    if (!localMap.has(id)) {
      onlyInProduction.push(id);
    }
  }

  const identical =
    onlyInLocal.length === 0 &&
    onlyInProduction.length === 0 &&
    different.length === 0;

  console.log(
    `${label}: identical=${identical} onlyInLocal=${onlyInLocal.length} onlyInProduction=${onlyInProduction.length} different=${different.length}`
  );

  if (!identical) {
    if (onlyInLocal.length > 0) {
      console.log(`  ${label} ids only in local: ${onlyInLocal.join(", ")}`);
    }

    if (onlyInProduction.length > 0) {
      console.log(
        `  ${label} ids only in production: ${onlyInProduction.join(", ")}`
      );
    }

    if (different.length > 0) {
      console.log(`  ${label} ids with field differences: ${different.join(", ")}`);
    }
  }

  return identical;
}

async function main() {
  const mode: Mode = process.argv.includes("--apply")
    ? "apply"
    : process.argv.includes("--compare")
    ? "compare"
    : "counts";

  const localDatabaseUrl = getDatabaseUrl(SOURCE_ENV_PATH);
  const productionDatabaseUrl = getDatabaseUrl(TARGET_ENV_PATH);

  const local = createClient(localDatabaseUrl);
  const production = createClient(productionDatabaseUrl);

  try {
    const [localCountsBefore, productionCountsBefore] = await Promise.all([
      getCounts(local),
      getCounts(production),
    ]);

    printCounts("Local before", localCountsBefore);
    printCounts("Production before", productionCountsBefore);

    if (mode === "counts") {
      return;
    }

    const admins = await local.admin.findMany({
      orderBy: { adminId: "asc" },
    });

    const users = await local.user.findMany({
      orderBy: { userId: "asc" },
    });

    const equipment = await local.equipment.findMany({
      orderBy: { equipmentId: "asc" },
    });

    const facilities = await local.facility.findMany({
      orderBy: { facilityId: "asc" },
    });

    const reservations = await local.reservation.findMany({
      orderBy: { reservationId: "asc" },
    });

    if (mode === "compare") {
      const [
        productionAdmins,
        productionUsers,
        productionEquipment,
        productionFacilities,
        productionReservations,
      ] = await Promise.all([
        production.admin.findMany({ orderBy: { adminId: "asc" } }),
        production.user.findMany({ orderBy: { userId: "asc" } }),
        production.equipment.findMany({ orderBy: { equipmentId: "asc" } }),
        production.facility.findMany({ orderBy: { facilityId: "asc" } }),
        production.reservation.findMany({ orderBy: { reservationId: "asc" } }),
      ]);

      compareRecords("Admins", admins, productionAdmins, "adminId");
      compareRecords("Users", users, productionUsers, "userId");
      compareRecords("Equipment", equipment, productionEquipment, "equipmentId");
      compareRecords("Facilities", facilities, productionFacilities, "facilityId");
      compareRecords(
        "Reservations",
        reservations,
        productionReservations,
        "reservationId"
      );

      return;
    }

    await upsertRows("Admins", admins, async (admin) => {
      const existing = await production.admin.findUnique({
        where: { adminId: admin.adminId },
        select: { adminId: true },
      });

      const data = {
        adminId: admin.adminId,
        name: admin.name,
        birthdate: admin.birthdate,
        gender: admin.gender,
        address: admin.address,
        username: admin.username,
        password: admin.password,
        contactNumber: admin.contactNumber,
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive,
        createdAt: admin.createdAt,
        deactivatedAt: admin.deactivatedAt,
      };

      if (existing) {
        await production.admin.update({
          where: { adminId: admin.adminId },
          data,
        });

        return "updated";
      }

      await production.admin.create({ data });
      return "created";
    });

    await upsertRows("Users", users, async (user) => {
      const existing = await production.user.findUnique({
        where: { userId: user.userId },
        select: { userId: true },
      });

      const data = {
        userId: user.userId,
        name: user.name,
        birthdate: user.birthdate,
        gender: user.gender,
        address: user.address,
        username: user.username,
        password: user.password,
        contactNumber: user.contactNumber,
        email: user.email,
      };

      if (existing) {
        await production.user.update({
          where: { userId: user.userId },
          data,
        });

        return "updated";
      }

      await production.user.create({ data });
      return "created";
    });

    await upsertRows("Equipment", equipment, async (item) => {
      const existing = await production.equipment.findUnique({
        where: { equipmentId: item.equipmentId },
        select: { equipmentId: true },
      });

      const data = {
        equipmentId: item.equipmentId,
        adminId: item.adminId,
        itemName: item.itemName,
        description: item.description,
        price: item.price ? new Prisma.Decimal(item.price.toString()) : null,
        quantity: item.quantity,
      };

      if (existing) {
        await production.equipment.update({
          where: { equipmentId: item.equipmentId },
          data,
        });

        return "updated";
      }

      await production.equipment.create({ data });
      return "created";
    });

    await upsertRows("Facilities", facilities, async (facility) => {
      const existing = await production.facility.findUnique({
        where: { facilityId: facility.facilityId },
        select: { facilityId: true },
      });

      const data = {
        facilityId: facility.facilityId,
        adminId: facility.adminId,
        itemName: facility.itemName,
        description: facility.description,
        status: facility.status,
        pricePerDay: facility.pricePerDay,
      };

      if (existing) {
        await production.facility.update({
          where: { facilityId: facility.facilityId },
          data,
        });

        return "updated";
      }

      await production.facility.create({ data });
      return "created";
    });

    await upsertRows("Reservations", reservations, async (reservation) => {
      const existing = await production.reservation.findUnique({
        where: { reservationId: reservation.reservationId },
        select: { reservationId: true },
      });

      const data = {
        reservationId: reservation.reservationId,
        userId: reservation.userId,
        equipmentId: reservation.equipmentId,
        adminId: reservation.adminId,
        facilityId: reservation.facilityId,
        startDateTime: reservation.startDateTime,
        endDateTime: reservation.endDateTime,
        purpose: reservation.purpose,
        status: reservation.status,
        expectedAttendees: reservation.expectedAttendees,
        equipmentQuantity: reservation.equipmentQuantity,
        approvedAt: reservation.approvedAt,
        returnedAt: reservation.returnedAt,
        cancelledAt: reservation.cancelledAt,
        returnStatus: reservation.returnStatus,
        adminNotes: reservation.adminNotes,
      };

      if (existing) {
        await production.reservation.update({
          where: { reservationId: reservation.reservationId },
          data,
        });

        return "updated";
      }

      await production.reservation.create({ data });
      return "created";
    });

    const productionCountsAfter = await getCounts(production);
    printCounts("Production after", productionCountsAfter);
  } finally {
    await Promise.all([local.$disconnect(), production.$disconnect()]);
  }
}

main().catch((error) => {
  console.error("Migration failed.");
  console.error(error);
  process.exit(1);
});
