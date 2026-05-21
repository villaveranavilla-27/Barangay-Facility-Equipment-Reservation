import fs from "node:fs";
import path from "node:path";
import { createDirectDatabaseExecutor } from "@/lib/database";

const migrationsDirectory = path.join(process.cwd(), "supabase", "migrations");

async function main() {
  if (!fs.existsSync(migrationsDirectory)) {
    throw new Error(`Missing migrations directory: ${migrationsDirectory}`);
  }

  const migrationFiles = fs
    .readdirSync(migrationsDirectory)
    .filter((file) => file.endsWith(".sql"))
    .sort((left, right) => left.localeCompare(right));

  if (migrationFiles.length === 0) {
    console.log("No Supabase migration files found.");
    return;
  }

  const sql = createDirectDatabaseExecutor();

  try {
    for (const migrationFile of migrationFiles) {
      const migrationPath = path.join(migrationsDirectory, migrationFile);
      console.log(`Applying ${migrationFile}...`);
      await sql.file(migrationPath);
    }

    console.log(`Applied ${migrationFiles.length} Supabase migration file(s).`);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((error) => {
  console.error("Supabase migration failed.");
  console.error(error);
  process.exit(1);
});
