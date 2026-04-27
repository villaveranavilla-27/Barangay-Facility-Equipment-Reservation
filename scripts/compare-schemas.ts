import { PrismaClient } from "@prisma/client";

const sourceDatabaseUrl = process.env.SOURCE_DATABASE_URL?.trim();
const targetDatabaseUrl = process.env.TARGET_DATABASE_URL?.trim();

if (!sourceDatabaseUrl) {
  throw new Error("SOURCE_DATABASE_URL is required.");
}

if (!targetDatabaseUrl) {
  throw new Error("TARGET_DATABASE_URL is required.");
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

async function getSchema(client: PrismaClient) {
  return client.$queryRawUnsafe<
    Array<{
      TABLE_NAME: string;
      COLUMN_NAME: string;
      COLUMN_TYPE: string;
      IS_NULLABLE: string;
      COLUMN_KEY: string;
      EXTRA: string;
    }>
  >(`
    SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY, EXTRA
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    ORDER BY TABLE_NAME, ORDINAL_POSITION
  `);
}

function toSchemaMap(
  rows: Array<{
    TABLE_NAME: string;
    COLUMN_NAME: string;
    COLUMN_TYPE: string;
    IS_NULLABLE: string;
    COLUMN_KEY: string;
    EXTRA: string;
  }>
) {
  const map = new Map<string, string[]>();

  for (const row of rows) {
    const description = [
      row.COLUMN_NAME,
      row.COLUMN_TYPE,
      row.IS_NULLABLE,
      row.COLUMN_KEY,
      row.EXTRA,
    ].join(":");

    if (!map.has(row.TABLE_NAME)) {
      map.set(row.TABLE_NAME, []);
    }

    map.get(row.TABLE_NAME)!.push(description);
  }

  return map;
}

async function main() {
  const source = createClient(sourceDatabaseUrl);
  const target = createClient(targetDatabaseUrl);

  try {
    const [sourceRows, targetRows] = await Promise.all([
      getSchema(source),
      getSchema(target),
    ]);

    const sourceMap = toSchemaMap(sourceRows);
    const targetMap = toSchemaMap(targetRows);
    const tableNames = [...new Set([...sourceMap.keys(), ...targetMap.keys()])].sort();

    for (const tableName of tableNames) {
      const sourceColumns = sourceMap.get(tableName) ?? [];
      const targetColumns = targetMap.get(tableName) ?? [];
      const identical =
        JSON.stringify(sourceColumns) === JSON.stringify(targetColumns);

      console.log(
        `${tableName}: schema_identical=${identical} source_columns=${sourceColumns.length} target_columns=${targetColumns.length}`
      );
    }
  } finally {
    await Promise.all([source.$disconnect(), target.$disconnect()]);
  }
}

main().catch((error) => {
  console.error("Schema comparison failed.");
  console.error(error);
  process.exit(1);
});
