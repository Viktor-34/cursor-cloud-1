import type { Config } from "@netlify/functions";
import { demoWorkspace } from "../../shared/workspace";

export default async () => {
  return Response.json(demoWorkspace);
};

export const config: Config = { path: "/api/workspace" };
