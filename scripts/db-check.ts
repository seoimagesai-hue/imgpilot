import {loadLocalEnvFiles, summarizeDatabaseUrlPresence} from "./load-local-env";

loadLocalEnvFiles();

async function main() {
  const summary = summarizeDatabaseUrlPresence();
  if (!summary.present) {
    console.error("DATABASE_URL is not set. Connection check blocked.");
    process.exitCode = 1;
    return;
  }

  console.log(
    `DATABASE_URL present (len=${summary.length}, sslHint=${summary.hasSslModeHint}, providerGuess=${summary.providerGuess})`,
  );

  // Dynamic import after env load so the DB client sees DATABASE_URL.
  const {checkDatabaseConnection} = await import("../src/db/health");
  const result = await checkDatabaseConnection();

  if (result.ok) {
    console.log("Database connection: ok");
    return;
  }

  // Avoid dumping connection strings that some drivers embed in messages.
  const safeError = result.error
    .replace(/postgresql:\/\/[^\s]+/gi, "postgresql://[redacted]")
    .replace(/postgres:\/\/[^\s]+/gi, "postgres://[redacted]");
  console.error(`Database connection failed: ${safeError}`);
  process.exitCode = 1;
}

void main();
