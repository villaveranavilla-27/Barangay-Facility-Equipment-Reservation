import fs from "node:fs";
import path from "node:path";
import { createDirectDatabaseExecutor } from "@/lib/database";

type MigrationFile = {
  label: string;
  path: string;
};

const prismaMigrationsDirectory = path.join(process.cwd(), "prisma", "migrations");
const legacyMigrationsDirectory = path.join(process.cwd(), "supabase", "migrations");

function getPrismaMigrationFiles() {
  if (!fs.existsSync(prismaMigrationsDirectory)) {
    return [];
  }

  return fs
    .readdirSync(prismaMigrationsDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => ({
      label: entry.name,
      path: path.join(prismaMigrationsDirectory, entry.name, "migration.sql"),
    }))
    .filter((entry) => fs.existsSync(entry.path))
    .sort((left, right) => left.label.localeCompare(right.label));
}

function getLegacyMigrationFiles() {
  if (!fs.existsSync(legacyMigrationsDirectory)) {
    return [];
  }

  return fs
    .readdirSync(legacyMigrationsDirectory)
    .filter((file) => file.endsWith(".sql"))
    .sort((left, right) => left.localeCompare(right))
    .map((file) => ({
      label: file,
      path: path.join(legacyMigrationsDirectory, file),
    }));
}

function getMigrationFiles(): MigrationFile[] {
  const prismaMigrationFiles = getPrismaMigrationFiles();

  if (prismaMigrationFiles.length > 0) {
    return prismaMigrationFiles;
  }

  return getLegacyMigrationFiles();
}

async function main() {
  const migrationFiles = getMigrationFiles();

  if (migrationFiles.length === 0) {
    throw new Error(
      `Missing migration files in ${prismaMigrationsDirectory} or ${legacyMigrationsDirectory}.`
    );
  }

  const sql = createDirectDatabaseExecutor();

  try {
    for (const migrationFile of migrationFiles) {
      console.log(`Applying ${migrationFile.label}...`);
      await sql.file(migrationFile.path);
    }

    console.log(`Applied ${migrationFiles.length} migration file(s).`);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((error) => {
  console.error("Supabase migration failed.");
  console.error(error);
  process.exit(1);
});
