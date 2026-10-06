import * as schema from "./schema";

type Database = Awaited<ReturnType<typeof openDatabase>>;

let cached: Database | undefined;
let cachedUrl: string | undefined;

/**
 * `DATABASE_URL` is any Postgres, including Beget.
 * Without it, Drizzle uses the Netlify Database driver.
 */
export async function getDb() {
  const url = process.env.DATABASE_URL;
  if (cached && cachedUrl === (url ?? "")) return cached;
  cachedUrl = url ?? "";
  cached = await openDatabase(url);
  return cached;
}

async function openDatabase(url: string | undefined) {
  if (url) {
    const { drizzle } = await import("drizzle-orm/node-postgres");
    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: url });
    return drizzle({ client: pool, schema });
  }

  const { drizzle } = await import("drizzle-orm/netlify-db");
  return drizzle({ schema });
}

export function databaseTarget() {
  if (process.env.DATABASE_URL) return "postgres" as const;
  if (process.env.NETLIFY_DB_URL) return "netlify" as const;
  return "unconfigured" as const;
}
