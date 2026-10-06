import * as schema from "./schema";

/**
 * Netlify Database when no explicit URL is set.
 * `DATABASE_URL` points at any Postgres, including Beget's cloud database.
 */
export async function getDb() {
  if (process.env.DATABASE_URL) {
    const { drizzle } = await import("drizzle-orm/node-postgres");
    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
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
