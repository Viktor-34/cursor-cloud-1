import type { Config, Context } from "@netlify/functions";
import { createTask, updateTaskStatus } from "../../db/workspace";
import { jsonError } from "./workspace";

export default async (req: Request, context: Context) => {
  try {
    if (req.method === "POST") {
      const body = (await req.json()) as { title?: unknown; projectId?: unknown; status?: unknown };
      if (typeof body.title !== "string" || typeof body.projectId !== "string") {
        return Response.json({ error: "Title and project are required" }, { status: 400 });
      }
      return Response.json(
        await createTask({ title: body.title, projectId: body.projectId, status: body.status }),
        { status: 201 },
      );
    }

    if (req.method === "PATCH") {
      const id = context.params.id;
      if (!id) return Response.json({ error: "Task id is required" }, { status: 400 });
      const body = (await req.json()) as { status?: unknown };
      return Response.json(await updateTaskStatus(id, body.status));
    }

    return new Response("Method not allowed", { status: 405 });
  } catch (error) {
    return jsonError(error);
  }
};

export const config: Config = {
  path: ["/api/tasks", "/api/tasks/:id"],
  method: ["POST", "PATCH"],
};
