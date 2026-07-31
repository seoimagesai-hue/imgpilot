import {defineConfig} from "drizzle-kit";
import {loadLocalEnvFiles} from "./scripts/load-local-env";

loadLocalEnvFiles();

const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";

if (!databaseUrl) {
  // Allow `drizzle-kit generate` without a live database by providing a placeholder.
  // `drizzle-kit migrate` must use a real DATABASE_URL from the environment or .env.local.
  process.env.DATABASE_URL = "postgresql://postgres:postgres@127.0.0.1:5432/seoimages";
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  strict: true,
  verbose: true,
});
