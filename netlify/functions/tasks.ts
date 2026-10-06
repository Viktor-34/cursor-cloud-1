import type { Config, Context } from "@netlify/functions";
import { createTask, updateTask } from "../../db/workspace";
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
      const body = (await req.json()) as Record<string, unknown>;
      const patch: {
        title?: unknown;
        description?: unknown;
        dueOn?: unknown;
        assigneeId?: unknown;
        status?: unknown;
      } = {};
      if ("title" in body) patch.title = body.title;
      if ("description" in body) patch.description = body.description;
      if ("dueOn" in body) patch.dueOn = body.dueOn;
      if ("assigneeId" in body) patch.assigneeId = body.assigneeId;
      if ("status" in body) patch.status = body.status;
      return Response.json(await updateTask(id, patch));
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
