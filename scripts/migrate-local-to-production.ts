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

function getDatabaseUrl(filePath: string, overrideEnvVarName: string) {
  const overrideValue = process.env[overrideEnvVarName]?.trim();

  if (overrideValue) {
    return overrideValue;
  }

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

  const localDatabaseUrl = getDatabaseUrl(
    SOURCE_ENV_PATH,
    "SOURCE_DATABASE_URL"
  );
  const productionDatabaseUrl = getDatabaseUrl(
    TARGET_ENV_PATH,
    "TARGET_DATABASE_URL"
  );

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

    const adminIdMap = new Map<number, number>();
    const userIdMap = new Map<number, number>();
    const equipmentIdMap = new Map<number, number>();
    const facilityIdMap = new Map<number, number>();

    await upsertRows("Admins", admins, async (admin) => {
      const existing =
        (await production.admin.findUnique({
          where: { adminId: admin.adminId },
          select: { adminId: true, username: true, email: true },
        })) ??
        (await production.admin.findFirst({
          where: {
            OR: [{ username: admin.username }, { email: admin.email }],
          },
          select: { adminId: true, username: true, email: true },
        }));

      const data = {
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
          where: { adminId: existing.adminId },
          data,
        });

        adminIdMap.set(admin.adminId, existing.adminId);

        return "updated";
      }

      const created = await production.admin.create({
        data: {
          adminId: admin.adminId,
          ...data,
        },
        select: { adminId: true },
      });

      adminIdMap.set(admin.adminId, created.adminId);
      return "created";
    });

    await upsertRows("Users", users, async (user) => {
      const existing =
        (await production.user.findUnique({
          where: { userId: user.userId },
          select: { userId: true, username: true, email: true },
        })) ??
        (await production.user.findFirst({
          where: {
            OR: [{ username: user.username }, { email: user.email }],
          },
          select: { userId: true, username: true, email: true },
        }));

      const data = {
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
          where: { userId: existing.userId },
          data,
        });

        userIdMap.set(user.userId, existing.userId);

        return "updated";
      }

      const created = await production.user.create({
        data: {
          userId: user.userId,
          ...data,
        },
        select: { userId: true },
      });

      userIdMap.set(user.userId, created.userId);
      return "created";
    });

    await upsertRows("Equipment", equipment, async (item) => {
      const mappedAdminId = adminIdMap.get(item.adminId);

      if (!mappedAdminId) {
        throw new Error(`Missing admin mapping for equipment ${item.equipmentId}`);
      }

      const existing =
        (await production.equipment.findUnique({
          where: { equipmentId: item.equipmentId },
          select: { equipmentId: true },
        })) ??
        (await production.equipment.findFirst({
          where: {
            adminId: mappedAdminId,
            itemName: item.itemName,
          },
          select: { equipmentId: true },
        }));

      const data = {
        adminId: mappedAdminId,
        itemName: item.itemName,
        description: item.description,
        price: item.price ? new Prisma.Decimal(item.price.toString()) : null,
        quantity: item.quantity,
      };

      if (existing) {
        await production.equipment.update({
          where: { equipmentId: existing.equipmentId },
          data,
        });

        equipmentIdMap.set(item.equipmentId, existing.equipmentId);

        return "updated";
      }

      const created = await production.equipment.create({
        data: {
          equipmentId: item.equipmentId,
          ...data,
        },
        select: { equipmentId: true },
      });

      equipmentIdMap.set(item.equipmentId, created.equipmentId);
      return "created";
    });

    await upsertRows("Facilities", facilities, async (facility) => {
      const mappedAdminId = adminIdMap.get(facility.adminId);

      if (!mappedAdminId) {
        throw new Error(`Missing admin mapping for facility ${facility.facilityId}`);
      }

      const existing =
        (await production.facility.findUnique({
          where: { facilityId: facility.facilityId },
          select: { facilityId: true },
        })) ??
        (await production.facility.findFirst({
          where: {
            adminId: mappedAdminId,
            itemName: facility.itemName,
          },
          select: { facilityId: true },
        }));

      const data = {
        adminId: mappedAdminId,
        itemName: facility.itemName,
        description: facility.description,
        status: facility.status,
        pricePerDay: facility.pricePerDay,
      };

      if (existing) {
        await production.facility.update({
          where: { facilityId: existing.facilityId },
          data,
        });

        facilityIdMap.set(facility.facilityId, existing.facilityId);

        return "updated";
      }

      const created = await production.facility.create({
        data: {
          facilityId: facility.facilityId,
          ...data,
        },
        select: { facilityId: true },
      });

      facilityIdMap.set(facility.facilityId, created.facilityId);
      return "created";
    });

    await upsertRows("Reservations", reservations, async (reservation) => {
      const mappedUserId = userIdMap.get(reservation.userId);
      const mappedAdminId =
        reservation.adminId === null ? null : adminIdMap.get(reservation.adminId);
      const mappedEquipmentId =
        reservation.equipmentId === null
          ? null
          : equipmentIdMap.get(reservation.equipmentId);
      const mappedFacilityId =
        reservation.facilityId === null
          ? null
          : facilityIdMap.get(reservation.facilityId);

      if (!mappedUserId) {
        throw new Error(
          `Missing user mapping for reservation ${reservation.reservationId}`
        );
      }

      if (reservation.adminId !== null && mappedAdminId === undefined) {
        throw new Error(
          `Missing admin mapping for reservation ${reservation.reservationId}`
        );
      }

      if (reservation.equipmentId !== null && mappedEquipmentId === undefined) {
        throw new Error(
          `Missing equipment mapping for reservation ${reservation.reservationId}`
        );
      }

      if (reservation.facilityId !== null && mappedFacilityId === undefined) {
        throw new Error(
          `Missing facility mapping for reservation ${reservation.reservationId}`
        );
      }

      const existing =
        (await production.reservation.findUnique({
          where: { reservationId: reservation.reservationId },
          select: { reservationId: true },
        })) ??
        (await production.reservation.findFirst({
          where: {
            userId: mappedUserId,
            facilityId: mappedFacilityId ?? null,
            equipmentId: mappedEquipmentId ?? null,
            startDateTime: reservation.startDateTime,
            endDateTime: reservation.endDateTime,
          },
          select: { reservationId: true },
        }));

      const data = {
        userId: mappedUserId,
        equipmentId: mappedEquipmentId ?? null,
        adminId: mappedAdminId ?? null,
        facilityId: mappedFacilityId ?? null,
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
          where: { reservationId: existing.reservationId },
          data,
        });

        return "updated";
      }

      await production.reservation.create({
        data: {
          reservationId: reservation.reservationId,
          ...data,
        },
      });
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
