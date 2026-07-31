import {drizzle} from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {requireDatabaseUrl} from "@/lib/env";
import * as schema from "./schema";

/**
 * Hot-reload safe singleton for the postgres.js client.
 * Do not create a new client per request in development.
 */
const globalForDb = globalThis as unknown as {
  postgresClient?: ReturnType<typeof postgres>;
};

function createClient() {
  const url = requireDatabaseUrl();
  /**
   * Cloud Postgres providers (Neon/Supabase) typically require TLS.
   * Prefer sslmode in DATABASE_URL; also enable TLS when the URL host is remote.
   */
  const needsSsl =
    /sslmode=(require|verify-full|verify-ca)/i.test(url) ||
    /neon\.tech|supabase\.(co|com)/i.test(url);

  return postgres(url, {
    max: 10,
    idle_timeout: 20,
    prepare: false,
    ...(needsSsl ? {ssl: "require"} : {}),
  });
}

export function getPostgresClient() {
  if (!globalForDb.postgresClient) {
    globalForDb.postgresClient = createClient();
  }
  return globalForDb.postgresClient;
}

export function getDb() {
  return drizzle(getPostgresClient(), {schema});
}

export type Database = ReturnType<typeof getDb>;
