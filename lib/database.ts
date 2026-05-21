import postgres from "postgres";
import { config as loadEnv } from "dotenv";
import {
  type AdminRecord,
  type AppSessionRecord,
  type EquipmentRecord,
  type FacilityRecord,
  type ReservationRecord,
  type ReservationWithRelations,
  type SelectShape,
  type UserRecord,
  DatabaseClientKnownRequestError,
  UNIQUE_CONSTRAINT_ERROR_CODE,
} from "@/lib/database-types";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

type DatabaseUrlMode = "runtime" | "direct";
type DatabaseExecutor = any;

type FindArgs<T extends Record<string, unknown>> = {
  where?: Record<string, unknown>;
  orderBy?: Record<string, unknown>;
  select?: SelectShape<T>;
};

type MutationArgs<T extends Record<string, unknown>> = {
  data: Record<string, unknown>;
  select?: SelectShape<T>;
};

type ReservationInclude = {
  user?: true | { select?: SelectShape<UserRecord> };
  facility?: true | { select?: SelectShape<FacilityRecord> };
  equipment?: true | { select?: SelectShape<EquipmentRecord> };
  admin?: true | { select?: SelectShape<AdminRecord> };
};

type ReservationFindArgs = FindArgs<ReservationRecord> & {
  include?: ReservationInclude;
};

type ModelConfig<T extends Record<string, unknown>> = {
  tableName: string;
  columns: Record<keyof T, string>;
  dateFields: readonly (keyof T)[];
};

const adminConfig: ModelConfig<AdminRecord> = {
  tableName: "Admin",
  columns: {
    adminId: "Admin_ID",
    name: "Name",
    birthdate: "Birthdate",
    gender: "Gender",
    address: "Address",
    username: "Username",
    password: "Password",
    contactNumber: "Contact number",
    email: "email",
    role: "Role",
    isActive: "Is_Active",
    createdAt: "CreatedAt",
    deactivatedAt: "DeactivatedAt",
  },
  dateFields: ["birthdate", "createdAt", "deactivatedAt"],
};

const userConfig: ModelConfig<UserRecord> = {
  tableName: "User",
  columns: {
    userId: "User_ID",
    name: "Name",
    birthdate: "Birthdate",
    gender: "Gender",
    address: "Address",
    username: "Username",
    password: "Password",
    contactNumber: "Contact number",
    email: "email",
    role: "Role",
    isActive: "Is_Active",
    deactivatedAt: "DeactivatedAt",
  },
  dateFields: ["birthdate", "deactivatedAt"],
};

const equipmentConfig: ModelConfig<EquipmentRecord> = {
  tableName: "Equipment",
  columns: {
    equipmentId: "Equipment_ID",
    adminId: "Admin_ID",
    itemName: "Item_Name",
    description: "Description",
    price: "Price",
    quantity: "Quantity",
  },
  dateFields: [],
};

const facilityConfig: ModelConfig<FacilityRecord> = {
  tableName: "Facility",
  columns: {
    facilityId: "Facility_ID",
    adminId: "Admin_ID",
    itemName: "Item Name",
    description: "Desciption",
    status: "Status",
    pricePerDay: "Priceperday",
  },
  dateFields: [],
};

const reservationConfig: ModelConfig<ReservationRecord> = {
  tableName: "Reservation",
  columns: {
    reservationId: "Reservation_ID",
    userId: "User_ID",
    equipmentId: "Equipment_ID",
    adminId: "Admin_ID",
    facilityId: "Facility_ID",
    startDateTime: "Start_DateTime",
    endDateTime: "End_DateTime",
    purpose: "Purpose",
    status: "Status",
    expectedAttendees: "Expected_Attendees",
    equipmentQuantity: "Equipment_Quantity",
    approvedAt: "ApprovedAt",
    returnedAt: "ReturnedAt",
    cancelledAt: "CancelledAt",
    returnStatus: "Return_Status",
    adminNotes: "Admin_Notes",
  },
  dateFields: [
    "startDateTime",
    "endDateTime",
    "approvedAt",
    "returnedAt",
    "cancelledAt",
  ],
};

const appSessionConfig: ModelConfig<AppSessionRecord> = {
  tableName: "AppSession",
  columns: {
    sessionId: "Session_ID",
    role: "Role",
    username: "Username",
    userId: "User_ID",
    adminId: "Admin_ID",
    createdAt: "CreatedAt",
    lastActivity: "LastActivity",
    expiresAt: "ExpiresAt",
    ipAddress: "IP_Address",
    userAgent: "User_Agent",
  },
  dateFields: ["createdAt", "lastActivity", "expiresAt"],
};

const globalForDatabase = globalThis as unknown as {
  database?: DatabaseClient;
};

export type DatabaseClient = {
  admin: any;
  appSession: any;
  equipment: any;
  facility: any;
  reservation: any;
  user: any;
  $disconnect: () => Promise<void>;
  $queryRaw: <T = unknown>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ) => Promise<T>;
  $transaction: <T>(
    callback: (client: DatabaseClient) => Promise<T>,
    options?: { maxWait?: number; timeout?: number }
  ) => Promise<T>;
};

function quoteIdentifier(identifier: string) {
  return `"${identifier.replace(/"/g, "\"\"")}"`;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) && !(value instanceof Date);
}

function requireDatabaseUrl(mode: DatabaseUrlMode) {
  const preferred =
    mode === "direct"
      ? process.env.SUPABASE_MIGRATION_DATABASE_URL?.trim() ||
        process.env.DATABASE_URL?.trim() ||
        process.env.DIRECT_URL?.trim()
      : process.env.DATABASE_URL?.trim() || process.env.DIRECT_URL?.trim();

  if (!preferred) {
    throw new Error(
      mode === "direct"
        ? "SUPABASE_MIGRATION_DATABASE_URL, DATABASE_URL, or DIRECT_URL is required for migration/seed database access."
        : "DATABASE_URL or DIRECT_URL is required for database access."
    );
  }

  return preferred;
}

function createExecutorForUrl(databaseUrl: string, mode: DatabaseUrlMode) {
  return postgres(databaseUrl, {
    connect_timeout: 30,
    idle_timeout: 20,
    max: mode === "runtime" ? 5 : 1,
    onnotice: () => {},
    prepare: false,
    ssl: "require",
    transform: {
      undefined: null,
    },
  });
}

function createExecutor(mode: DatabaseUrlMode) {
  return createExecutorForUrl(requireDatabaseUrl(mode), mode);
}

function toDate(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }

  return value instanceof Date ? value : new Date(String(value));
}

function normalizeRow<T extends Record<string, unknown>>(
  config: ModelConfig<T>,
  row: Record<string, unknown>
) {
  const result: Record<string, unknown> = {};

  for (const key of Object.keys(config.columns) as Array<keyof T>) {
    const value = row[key as string];
    result[key as string] = config.dateFields.includes(key) ? toDate(value) : value;
  }

  return result as T;
}

function projectRecord<T extends Record<string, unknown>>(
  record: T,
  select?: SelectShape<T>
) {
  if (!select) {
    return record;
  }

  const projected: Partial<T> = {};

  for (const [key, enabled] of Object.entries(select)) {
    if (enabled) {
      projected[key as keyof T] = record[key as keyof T];
    }
  }

  return projected;
}

function addParam(params: unknown[], value: unknown) {
  params.push(value);
  return `$${params.length}`;
}

function buildScalarCondition(
  columnSql: string,
  value: unknown,
  params: unknown[]
) {
  if (value === null) {
    return `${columnSql} IS NULL`;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "1 = 0";
    }

    const placeholders = value.map((item) => addParam(params, item)).join(", ");
    return `${columnSql} IN (${placeholders})`;
  }

  if (value instanceof Date || typeof value !== "object" || value === undefined) {
    return `${columnSql} = ${addParam(params, value)}`;
  }

  if (!isPlainObject(value)) {
    return `${columnSql} = ${addParam(params, value)}`;
  }

  const parts: string[] = [];

  for (const [operator, operand] of Object.entries(value)) {
    switch (operator) {
      case "contains":
        parts.push(`${columnSql} LIKE ${addParam(params, `%${String(operand)}%`)}`);
        break;
      case "in":
        if (!Array.isArray(operand) || operand.length === 0) {
          parts.push("1 = 0");
        } else {
          const placeholders = operand.map((item) => addParam(params, item)).join(", ");
          parts.push(`${columnSql} IN (${placeholders})`);
        }
        break;
      case "not":
        if (operand === null) {
          parts.push(`${columnSql} IS NOT NULL`);
        } else if (isPlainObject(operand)) {
          parts.push(`NOT (${buildScalarCondition(columnSql, operand, params)})`);
        } else {
          parts.push(`${columnSql} <> ${addParam(params, operand)}`);
        }
        break;
      case "gt":
        parts.push(`${columnSql} > ${addParam(params, operand)}`);
        break;
      case "gte":
        parts.push(`${columnSql} >= ${addParam(params, operand)}`);
        break;
      case "lt":
        parts.push(`${columnSql} < ${addParam(params, operand)}`);
        break;
      case "lte":
        parts.push(`${columnSql} <= ${addParam(params, operand)}`);
        break;
      default:
        throw new Error(`Unsupported where operator: ${operator}`);
    }
  }

  return parts.length > 0 ? parts.join(" AND ") : "1 = 1";
}

function buildWhere<T extends Record<string, unknown>>(
  config: ModelConfig<T>,
  where: Record<string, unknown> | undefined,
  params: unknown[]
): string {
  if (!where || !isPlainObject(where)) {
    return "";
  }

  const parts: string[] = [];

  for (const [field, value] of Object.entries(where)) {
    if (field === "OR") {
      if (!Array.isArray(value) || value.length === 0) {
        continue;
      }

      const orParts = value
        .map((entry) => buildWhere(config, entry as Record<string, unknown>, params))
        .filter(Boolean)
        .map((entry) => `(${entry})`);

      if (orParts.length > 0) {
        parts.push(`(${orParts.join(" OR ")})`);
      }

      continue;
    }

    if (field === "AND") {
      if (!Array.isArray(value) || value.length === 0) {
        continue;
      }

      const andParts = value
        .map((entry) => buildWhere(config, entry as Record<string, unknown>, params))
        .filter(Boolean)
        .map((entry) => `(${entry})`);

      if (andParts.length > 0) {
        parts.push(`(${andParts.join(" AND ")})`);
      }

      continue;
    }

    if (field === "NOT") {
      const notPart = buildWhere(config, value as Record<string, unknown>, params);

      if (notPart) {
        parts.push(`NOT (${notPart})`);
      }

      continue;
    }

    const columnName = config.columns[field as keyof T];

    if (!columnName) {
      throw new Error(`Unsupported where field "${field}" on ${config.tableName}`);
    }

    parts.push(buildScalarCondition(quoteIdentifier(columnName), value, params));
  }

  return parts.join(" AND ");
}

function buildOrderBy<T extends Record<string, unknown>>(
  config: ModelConfig<T>,
  orderBy?: Record<string, unknown>
) {
  if (!orderBy || !isPlainObject(orderBy)) {
    return "";
  }

  const parts = Object.entries(orderBy).map(([field, direction]) => {
    const columnName = config.columns[field as keyof T];

    if (!columnName) {
      throw new Error(`Unsupported orderBy field "${field}" on ${config.tableName}`);
    }

    const normalizedDirection =
      String(direction).toUpperCase() === "DESC" ? "DESC" : "ASC";

    return `${quoteIdentifier(columnName)} ${normalizedDirection}`;
  });

  return parts.join(", ");
}

function buildSelectList<T extends Record<string, unknown>>(config: ModelConfig<T>) {
  return (Object.entries(config.columns) as Array<[keyof T, string]>)
    .map(([field, columnName]) => `${quoteIdentifier(columnName)} AS "${String(field)}"`)
    .join(", ");
}

function toDatabasePayload<T extends Record<string, unknown>>(
  config: ModelConfig<T>,
  data: Record<string, unknown>
) {
  const payload: Record<string, unknown> = {};

  for (const [field, value] of Object.entries(data)) {
    if (value === undefined) {
      continue;
    }

    const columnName = config.columns[field as keyof T];

    if (!columnName) {
      throw new Error(`Unsupported write field "${field}" on ${config.tableName}`);
    }

    payload[columnName] = value;
  }

  return payload;
}

function buildUpdateSet<T extends Record<string, unknown>>(
  config: ModelConfig<T>,
  data: Record<string, unknown>,
  params: unknown[]
) {
  const assignments: string[] = [];

  for (const [field, value] of Object.entries(data)) {
    if (value === undefined) {
      continue;
    }

    const columnName = config.columns[field as keyof T];

    if (!columnName) {
      throw new Error(`Unsupported write field "${field}" on ${config.tableName}`);
    }

    const columnSql = quoteIdentifier(columnName);

    if (isPlainObject(value) && "increment" in value) {
      assignments.push(
        `${columnSql} = COALESCE(${columnSql}, 0) + ${addParam(
          params,
          value.increment
        )}`
      );
      continue;
    }

    if (isPlainObject(value) && "decrement" in value) {
      assignments.push(
        `${columnSql} = COALESCE(${columnSql}, 0) - ${addParam(
          params,
          value.decrement
        )}`
      );
      continue;
    }

    assignments.push(`${columnSql} = ${addParam(params, value)}`);
  }

  if (assignments.length === 0) {
    throw new Error(`No writable fields supplied for ${config.tableName}`);
  }

  return assignments.join(", ");
}

function translateDatabaseError(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  ) {
    return new DatabaseClientKnownRequestError(
      UNIQUE_CONSTRAINT_ERROR_CODE,
      "Unique constraint failed."
    );
  }

  return error;
}

async function runUnsafe<T>(
  executor: DatabaseExecutor,
  query: string,
  params: unknown[] = []
) {
  try {
    return (await executor.unsafe(query, params)) as unknown as T[];
  } catch (error) {
    throw translateDatabaseError(error);
  }
}

async function runTagged<T>(
  executor: DatabaseExecutor,
  strings: TemplateStringsArray,
  values: unknown[]
) {
  try {
    return (await executor(strings, ...values)) as unknown as T;
  } catch (error) {
    throw translateDatabaseError(error);
  }
}

async function findManyBase<T extends Record<string, unknown>>(
  executor: DatabaseExecutor,
  config: ModelConfig<T>,
  args: {
    where?: Record<string, unknown>;
    orderBy?: Record<string, unknown>;
    limit?: number;
  } = {}
) {
  const params: unknown[] = [];
  let query = `SELECT ${buildSelectList(config)} FROM ${quoteIdentifier(config.tableName)}`;

  const whereSql = buildWhere(config, args.where, params);
  if (whereSql) {
    query += ` WHERE ${whereSql}`;
  }

  const orderBySql = buildOrderBy(config, args.orderBy);
  if (orderBySql) {
    query += ` ORDER BY ${orderBySql}`;
  }

  if (typeof args.limit === "number" && Number.isFinite(args.limit)) {
    query += ` LIMIT ${Math.max(1, Math.trunc(args.limit))}`;
  }

  const rows = await runUnsafe<Record<string, unknown>>(executor, query, params);
  return rows.map((row) => normalizeRow(config, row));
}

async function countBase<T extends Record<string, unknown>>(
  executor: DatabaseExecutor,
  config: ModelConfig<T>,
  where?: Record<string, unknown>
) {
  const params: unknown[] = [];
  let query = `SELECT COUNT(*)::int AS "count" FROM ${quoteIdentifier(config.tableName)}`;
  const whereSql = buildWhere(config, where, params);

  if (whereSql) {
    query += ` WHERE ${whereSql}`;
  }

  const rows = await runUnsafe<{ count: number }>(executor, query, params);
  return Number(rows[0]?.count ?? 0);
}

async function createBase<T extends Record<string, unknown>>(
  executor: DatabaseExecutor,
  config: ModelConfig<T>,
  data: Record<string, unknown>
) {
  const payload = toDatabasePayload(config, data);
  const columns = Object.keys(payload);

  if (columns.length === 0) {
    throw new Error(`No insertable fields supplied for ${config.tableName}`);
  }

  const values = Object.values(payload);
  const placeholders = values.map((_, index) => `$${index + 1}`).join(", ");
  const query = `INSERT INTO ${quoteIdentifier(config.tableName)} (${columns
    .map(quoteIdentifier)
    .join(", ")}) VALUES (${placeholders}) RETURNING ${buildSelectList(config)}`;

  const rows = await runUnsafe<Record<string, unknown>>(executor, query, values);

  if (!rows[0]) {
    throw new Error(`Failed to create ${config.tableName} record.`);
  }

  return normalizeRow(config, rows[0]);
}

async function updateBase<T extends Record<string, unknown>>(
  executor: DatabaseExecutor,
  config: ModelConfig<T>,
  where: Record<string, unknown>,
  data: Record<string, unknown>
) {
  const params: unknown[] = [];
  const setSql = buildUpdateSet(config, data, params);
  let query = `UPDATE ${quoteIdentifier(config.tableName)} SET ${setSql}`;
  const whereSql = buildWhere(config, where, params);

  if (!whereSql) {
    throw new Error(`Refusing to update ${config.tableName} without a where clause.`);
  }

  query += ` WHERE ${whereSql} RETURNING ${buildSelectList(config)}`;

  const rows = await runUnsafe<Record<string, unknown>>(executor, query, params);

  if (!rows[0]) {
    throw new Error(`${config.tableName} record not found.`);
  }

  return normalizeRow(config, rows[0]);
}

async function updateManyBase<T extends Record<string, unknown>>(
  executor: DatabaseExecutor,
  config: ModelConfig<T>,
  where: Record<string, unknown>,
  data: Record<string, unknown>
) {
  const params: unknown[] = [];
  const setSql = buildUpdateSet(config, data, params);
  const whereSql = buildWhere(config, where, params);

  if (!whereSql) {
    throw new Error(`Refusing to update ${config.tableName} without a where clause.`);
  }

  const query = `UPDATE ${quoteIdentifier(config.tableName)} SET ${setSql} WHERE ${whereSql} RETURNING 1`;
  const rows = await runUnsafe<Record<string, unknown>>(executor, query, params);

  return { count: rows.length };
}

async function deleteBase<T extends Record<string, unknown>>(
  executor: DatabaseExecutor,
  config: ModelConfig<T>,
  where: Record<string, unknown>
) {
  const params: unknown[] = [];
  const whereSql = buildWhere(config, where, params);

  if (!whereSql) {
    throw new Error(`Refusing to delete ${config.tableName} without a where clause.`);
  }

  const query = `DELETE FROM ${quoteIdentifier(config.tableName)} WHERE ${whereSql} RETURNING ${buildSelectList(
    config
  )}`;
  const rows = await runUnsafe<Record<string, unknown>>(executor, query, params);

  if (!rows[0]) {
    throw new Error(`${config.tableName} record not found.`);
  }

  return normalizeRow(config, rows[0]);
}

async function deleteManyBase<T extends Record<string, unknown>>(
  executor: DatabaseExecutor,
  config: ModelConfig<T>,
  where: Record<string, unknown>
) {
  const params: unknown[] = [];
  const whereSql = buildWhere(config, where, params);

  if (!whereSql) {
    throw new Error(`Refusing to delete ${config.tableName} without a where clause.`);
  }

  const query = `DELETE FROM ${quoteIdentifier(config.tableName)} WHERE ${whereSql} RETURNING 1`;
  const rows = await runUnsafe<Record<string, unknown>>(executor, query, params);

  return { count: rows.length };
}

function collectIds<T extends Record<string, unknown>>(
  rows: T[],
  key: keyof T
) {
  const ids = new Set<number>();

  for (const row of rows) {
    const value = row[key];

    if (typeof value === "number") {
      ids.add(value);
    }
  }

  return [...ids];
}

async function loadUsersByIds(executor: DatabaseExecutor, userIds: number[]) {
  const rows = await findManyBase(executor, userConfig, {
    where: { userId: { in: userIds } },
  });

  return new Map(rows.map((row) => [row.userId, row]));
}

async function loadFacilitiesByIds(executor: DatabaseExecutor, facilityIds: number[]) {
  const rows = await findManyBase(executor, facilityConfig, {
    where: { facilityId: { in: facilityIds } },
  });

  return new Map(rows.map((row) => [row.facilityId, row]));
}

async function loadEquipmentByIds(executor: DatabaseExecutor, equipmentIds: number[]) {
  const rows = await findManyBase(executor, equipmentConfig, {
    where: { equipmentId: { in: equipmentIds } },
  });

  return new Map(rows.map((row) => [row.equipmentId, row]));
}

async function loadAdminsByIds(executor: DatabaseExecutor, adminIds: number[]) {
  const rows = await findManyBase(executor, adminConfig, {
    where: { adminId: { in: adminIds } },
  });

  return new Map(rows.map((row) => [row.adminId, row]));
}

async function attachReservationIncludes(
  executor: DatabaseExecutor,
  reservations: ReservationRecord[],
  include?: ReservationInclude
) {
  if (!include || reservations.length === 0) {
    return reservations;
  }

  const userMap = include.user
    ? await loadUsersByIds(executor, collectIds(reservations, "userId"))
    : null;
  const facilityMap = include.facility
    ? await loadFacilitiesByIds(executor, collectIds(reservations, "facilityId"))
    : null;
  const equipmentMap = include.equipment
    ? await loadEquipmentByIds(executor, collectIds(reservations, "equipmentId"))
    : null;
  const adminMap = include.admin
    ? await loadAdminsByIds(executor, collectIds(reservations, "adminId"))
    : null;

  return reservations.map((reservation) => {
    const record: Record<string, unknown> = { ...reservation };

    if (include.user) {
      const user = userMap?.get(reservation.userId);

      if (!user) {
        throw new Error(`Reservation ${reservation.reservationId} is missing its user relation.`);
      }

      record.user =
        include.user === true ? user : projectRecord(user, include.user.select);
    }

    if (include.facility) {
      const facility =
        reservation.facilityId === null ? null : facilityMap?.get(reservation.facilityId) ?? null;

      record.facility =
        include.facility === true || facility === null
          ? facility
          : projectRecord(facility, include.facility.select);
    }

    if (include.equipment) {
      const equipment =
        reservation.equipmentId === null
          ? null
          : equipmentMap?.get(reservation.equipmentId) ?? null;

      record.equipment =
        include.equipment === true || equipment === null
          ? equipment
          : projectRecord(equipment, include.equipment.select);
    }

    if (include.admin) {
      const admin =
        reservation.adminId === null ? null : adminMap?.get(reservation.adminId) ?? null;

      record.admin =
        include.admin === true || admin === null
          ? admin
          : projectRecord(admin, include.admin.select);
    }

    return record as ReservationWithRelations;
  });
}

function createGenericDelegate<T extends Record<string, unknown>>(
  executor: DatabaseExecutor,
  config: ModelConfig<T>
) {
  return {
    async findFirst(args: FindArgs<T> = {}) {
      const [record] = await findManyBase(executor, config, {
        limit: 1,
        orderBy: args.orderBy,
        where: args.where,
      });

      return record ? projectRecord(record, args.select) : null;
    },
    async findUnique(args: FindArgs<T>) {
      const [record] = await findManyBase(executor, config, {
        limit: 1,
        where: args.where,
      });

      return record ? projectRecord(record, args.select) : null;
    },
    async findMany(args: FindArgs<T> = {}) {
      const records = await findManyBase(executor, config, {
        orderBy: args.orderBy,
        where: args.where,
      });

      return args.select ? records.map((record) => projectRecord(record, args.select)) : records;
    },
    async create(args: MutationArgs<T>) {
      const record = await createBase(executor, config, args.data);
      return projectRecord(record, args.select);
    },
    async update(args: { where: Record<string, unknown>; data: Record<string, unknown>; select?: SelectShape<T> }) {
      const record = await updateBase(executor, config, args.where, args.data);
      return projectRecord(record, args.select);
    },
    async updateMany(args: { where: Record<string, unknown>; data: Record<string, unknown> }) {
      return updateManyBase(executor, config, args.where, args.data);
    },
    async delete(args: { where: Record<string, unknown> }) {
      return deleteBase(executor, config, args.where);
    },
    async deleteMany(args: { where: Record<string, unknown> }) {
      return deleteManyBase(executor, config, args.where);
    },
    async count(args: { where?: Record<string, unknown> } = {}) {
      return countBase(executor, config, args.where);
    },
  };
}

function createReservationDelegate(executor: DatabaseExecutor) {
  return {
    async findFirst(args: ReservationFindArgs = {}) {
      const [record] = await findManyBase(executor, reservationConfig, {
        limit: 1,
        orderBy: args.orderBy,
        where: args.where,
      });

      if (!record) {
        return null;
      }

      const [withRelations] = await attachReservationIncludes(executor, [record], args.include);
      return args.select ? projectRecord(withRelations, args.select) : withRelations;
    },
    async findUnique(args: ReservationFindArgs) {
      const [record] = await findManyBase(executor, reservationConfig, {
        limit: 1,
        where: args.where,
      });

      if (!record) {
        return null;
      }

      const [withRelations] = await attachReservationIncludes(executor, [record], args.include);
      return args.select ? projectRecord(withRelations, args.select) : withRelations;
    },
    async findMany(args: ReservationFindArgs = {}) {
      const records = await findManyBase(executor, reservationConfig, {
        orderBy: args.orderBy,
        where: args.where,
      });
      const withRelations = await attachReservationIncludes(executor, records, args.include);
      return args.select ? withRelations.map((record) => projectRecord(record, args.select)) : withRelations;
    },
    async create(args: {
      data: Record<string, unknown>;
      include?: ReservationInclude;
      select?: SelectShape<ReservationRecord>;
    }) {
      const record = await createBase(executor, reservationConfig, args.data);
      const [withRelations] = await attachReservationIncludes(executor, [record], args.include);
      return args.select ? projectRecord(withRelations, args.select) : withRelations;
    },
    async update(args: {
      where: Record<string, unknown>;
      data: Record<string, unknown>;
      include?: ReservationInclude;
      select?: SelectShape<ReservationRecord>;
    }) {
      const record = await updateBase(executor, reservationConfig, args.where, args.data);
      const [withRelations] = await attachReservationIncludes(executor, [record], args.include);
      return args.select ? projectRecord(withRelations, args.select) : withRelations;
    },
    async updateMany(args: { where: Record<string, unknown>; data: Record<string, unknown> }) {
      return updateManyBase(executor, reservationConfig, args.where, args.data);
    },
    async count(args: { where?: Record<string, unknown> } = {}) {
      return countBase(executor, reservationConfig, args.where);
    },
  };
}

function createDatabaseClient(executor: DatabaseExecutor): DatabaseClient {
  const admin = createGenericDelegate(executor, adminConfig);
  const user = createGenericDelegate(executor, userConfig);
  const equipment = createGenericDelegate(executor, equipmentConfig);
  const facility = createGenericDelegate(executor, facilityConfig);
  const appSession = createGenericDelegate(executor, appSessionConfig);
  const reservation = createReservationDelegate(executor);

  return {
    admin,
    appSession,
    equipment,
    facility,
    reservation,
    user,
    async $disconnect() {
      await executor.end({ timeout: 5 });
    },
    async $queryRaw<T = unknown>(
      strings: TemplateStringsArray,
      ...values: unknown[]
    ) {
      return runTagged<T>(executor, strings, values);
    },
    async $transaction<T>(
      callback: (client: DatabaseClient) => Promise<T>,
      _options?: { maxWait?: number; timeout?: number }
    ) {
      return executor.begin(async (transactionExecutor: any) =>
        callback(createDatabaseClient(transactionExecutor as unknown as DatabaseExecutor))
      );
    },
  };
}

export function createDirectDatabaseClient() {
  return createDatabaseClient(createExecutor("direct"));
}

export function createDirectDatabaseExecutor() {
  return createExecutor("direct");
}

export function createDatabaseClientForUrl(databaseUrl: string) {
  return createDatabaseClient(createExecutorForUrl(databaseUrl, "direct"));
}

export const database =
  globalForDatabase.database ?? createDatabaseClient(createExecutor("runtime"));

if (process.env.NODE_ENV !== "production") {
  globalForDatabase.database = database;
}
