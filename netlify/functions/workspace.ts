import type { Config } from "@netlify/functions";
import { HttpError, loadWorkspace } from "../../db/workspace";

export default async () => {
  try {
    return Response.json(await loadWorkspace());
  } catch (error) {
    return jsonError(error);
  }
};

export function jsonError(error: unknown) {
  const status = error instanceof HttpError ? error.status : 500;
  const message = error instanceof Error ? error.message : "Request failed";
  return Response.json({ error: message }, { status });
}

export const config: Config = { path: "/api/workspace" };
