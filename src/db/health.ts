import {getPostgresClient} from "./index";

/**
 * Lightweight connectivity check for development/ops scripts.
 * Does not log connection strings.
 */
export async function checkDatabaseConnection(): Promise<{ok: true} | {ok: false; error: string}> {
  try {
    const client = getPostgresClient();
    await client`select 1 as ok`;
    return {ok: true};
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error";
    return {ok: false, error: message};
  }
}
