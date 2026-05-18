import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const prismaCliUrl =
  process.env.DIRECT_URL?.trim() || process.env.DATABASE_URL?.trim();

if (!prismaCliUrl) {
  throw new Error("DATABASE_URL or DIRECT_URL must be set for Prisma CLI commands.");
}

export default defineConfig({
  schema: "./prisma/schema.prisma",
  migrations: {
    path: "./prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: prismaCliUrl,
  },
});
