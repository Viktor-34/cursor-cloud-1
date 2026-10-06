import type { Config } from "@netlify/functions";
import { databaseTarget } from "../../db/index";

export default async () => {
  return Response.json({ ok: true, database: databaseTarget() });
};

export const config: Config = { path: "/api/health" };
