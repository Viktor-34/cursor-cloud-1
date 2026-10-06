import { and, eq } from "drizzle-orm";
import type { TaskStatus, WorkspaceMember, WorkspaceProject, WorkspaceSnapshot, WorkspaceTask } from "../shared/workspace";
import { isTaskStatus } from "../shared/workspace";
import { addDays, dayDiff, formatDue, isIsoDate, localIso, startOfWeek } from "./dates";
import { getDb } from "./index";
import { members, projects, tasks, users, workspaces } from "./schema";

const projectLabels = {
  planning: "Planning",
  active: "In Progress",
  at_risk: "At Risk",
  done: "Done",
} as const;

export async function ensureSeed() {
  const db = await getDb();
  const existing = await db.select({ id: workspaces.id }).from(workspaces).limit(1);
  if (existing.length) return;

  const today = localIso();
  try {
    const [user] = await db
      .insert(users)
      .values({ name: "Alex Morgan", email: "alex@crm.local" })
      .returning();
    const [workspace] = await db.insert(workspaces).values({ name: "CRM" }).returning();
    const teammates = await db
      .insert(users)
      .values([
        { name: "Jordan Lee", email: "jordan@crm.local" },
        { name: "Sam Patel", email: "sam@crm.local" },
      ])
      .returning();
    const jordan = teammates.find((person) => person.email === "jordan@crm.local");
    const sam = teammates.find((person) => person.email === "sam@crm.local");
    if (!jordan || !sam) throw new Error("Teammates were not created");
    const insertedMembers = await db
      .insert(members)
      .values([
        { workspaceId: workspace.id, userId: user.id, role: "owner", title: "Head of Product" },
        { workspaceId: workspace.id, userId: jordan.id, role: "member", title: "Designer" },
        { workspaceId: workspace.id, userId: sam.id, role: "member", title: "Engineer" },
      ])
      .returning();
    const member = insertedMembers.find((row) => row.userId === user.id);
    if (!member) throw new Error("Workspace owner was not created");
    const memberByUser = new Map(insertedMembers.map((row) => [row.userId, row.id]));

    const projectRows = await db
      .insert(projects)
      .values([
        { workspaceId: workspace.id, name: "Website Redesign", status: "active", dueOn: addDays(today, 24) },
        { workspaceId: workspace.id, name: "Mobile App", status: "active", dueOn: addDays(today, 52) },
        { workspaceId: workspace.id, name: "Marketing Campaign", status: "planning", dueOn: addDays(today, 40) },
        { workspaceId: workspace.id, name: "Product Launch", status: "at_risk", dueOn: addDays(today, 12) },
        { workspaceId: workspace.id, name: "Design System", status: "active", dueOn: addDays(today, 70) },
      ])
      .returning();
    const projectId = (name: string) => {
      const project = projectRows.find((row) => row.name === name);
      if (!project) throw new Error(`Missing project ${name}`);
      return project.id;
    };

    await db.insert(tasks).values([
      { projectId: projectId("Mobile App"), assigneeId: member.id, title: "Triage beta tester feedback", status: "todo", dueOn: today, position: 0 },
      { projectId: projectId("Website Redesign"), assigneeId: member.id, title: "Weekly design sync notes", status: "todo", dueOn: addDays(today, 2), position: 1 },
      {
        projectId: projectId("Product Launch"),
        assigneeId: member.id,
        title: "Launch readiness checklist",
        description: "Confirm owners, dates, and the go-live checklist before the review.",
        status: "progress",
        dueOn: addDays(today, 3),
        position: 2,
      },
      { projectId: projectId("Website Redesign"), assigneeId: memberByUser.get(jordan.id), title: "Prepare design system tokens", status: "todo", dueOn: addDays(today, 5), position: 3 },
      { projectId: projectId("Product Launch"), assigneeId: member.id, title: "Go / no-go meeting", status: "todo", dueOn: addDays(today, 11), position: 4 },
      { projectId: projectId("Marketing Campaign"), assigneeId: member.id, title: "Launch webinar deck", status: "todo", dueOn: addDays(today, 15), position: 5 },
      { projectId: projectId("Marketing Campaign"), assigneeId: memberByUser.get(sam.id), title: "Press release draft", status: "todo", dueOn: addDays(today, -1), position: 6 },
      { projectId: projectId("Website Redesign"), assigneeId: member.id, title: "Fix broken anchor links", status: "done", dueOn: addDays(today, -2), position: 7 },
    ]);
  } catch (error) {
    const again = await db.select({ id: workspaces.id }).from(workspaces).limit(1);
    if (again.length) return;
    throw error;
  }
}

export async function loadWorkspace(): Promise<WorkspaceSnapshot> {
  await ensureSeed();
  const db = await getDb();
  const today = localIso();
  const weekStart = startOfWeek(today);

  const [workspace] = await db.select().from(workspaces).limit(1);
  if (!workspace) throw new Error("Workspace was not created");

  const [me] = await db
    .select({
      name: users.name,
      title: members.title,
      memberId: members.id,
    })
    .from(members)
    .innerJoin(users, eq(users.id, members.userId))
    .where(and(eq(members.workspaceId, workspace.id), eq(members.role, "owner")))
    .limit(1);
  if (!me) throw new Error("Workspace owner is missing");

  const projectRows = await db.select().from(projects).where(eq(projects.workspaceId, workspace.id));
  const allTasks = await db
    .select()
    .from(tasks)
    .innerJoin(projects, eq(projects.id, tasks.projectId))
    .where(eq(projects.workspaceId, workspace.id));

  const memberRows = await db
    .select({
      id: members.id,
      name: users.name,
      title: members.title,
    })
    .from(members)
    .innerJoin(users, eq(users.id, members.userId))
    .where(eq(members.workspaceId, workspace.id));
  const memberById = new Map(memberRows.map((member) => [member.id, member]));
  const snapshotMembers: WorkspaceMember[] = memberRows
    .map((member) => ({
      id: member.id,
      name: member.name,
      initials: initials(member.name),
      title: member.title ?? "",
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const byProject = new Map(projectRows.map((project) => [project.id, project]));
  const mine = allTasks.filter((row) => row.tasks.assigneeId === me.memberId);
  const openMine = mine.filter((row) => row.tasks.status !== "done");

  const snapshotTasks: WorkspaceTask[] = mine
    .slice()
    .sort((a, b) => {
      const doneRank = Number(a.tasks.status === "done") - Number(b.tasks.status === "done");
      if (doneRank !== 0) return doneRank;
      return (a.tasks.dueOn ?? "9999-99-99").localeCompare(b.tasks.dueOn ?? "9999-99-99");
    })
    .map((row) => toTask(row.tasks, byProject.get(row.tasks.projectId)?.name ?? "Project", today, memberById.get(row.tasks.assigneeId ?? "")));

  const snapshotAllTasks: WorkspaceTask[] = allTasks
    .slice()
    .sort((a, b) => a.tasks.position - b.tasks.position || a.tasks.title.localeCompare(b.tasks.title))
    .map((row) => toTask(row.tasks, byProject.get(row.tasks.projectId)?.name ?? "Project", today, memberById.get(row.tasks.assigneeId ?? "")));

  const snapshotProjects: WorkspaceProject[] = projectRows
    .map((project) => {
      const projectTasks = allTasks.filter((row) => row.tasks.projectId === project.id);
      const done = projectTasks.filter((row) => row.tasks.status === "done").length;
      const progress = projectTasks.length ? Math.round((done / projectTasks.length) * 100) : 0;
      return {
        id: project.id,
        name: project.name,
        status: projectLabels[project.status],
        progress,
        due: formatDue(project.dueOn, today),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const active = projectRows.filter((project) => project.status === "active" || project.status === "at_risk");
  const completedThisWeek = mine.filter((row) => {
    if (row.tasks.status !== "done" || !row.tasks.updatedAt) return false;
    return localIso(row.tasks.updatedAt) >= weekStart;
  }).length;

  const [firstName, ...rest] = me.name.split(" ");
  const userInitials = [firstName, rest.at(-1)]
    .filter((part): part is string => Boolean(part))
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return {
    source: "database",
    user: { memberId: me.memberId, name: me.name, firstName, initials: userInitials, title: me.title ?? "" },
    workspace: { name: workspace.name },
    stats: {
      activeProjects: active.length,
      atRisk: projectRows.filter((project) => project.status === "at_risk").length,
      openTasks: allTasks.filter((row) => row.tasks.status !== "done").length,
      assignedToYou: openMine.length,
      completedThisWeek,
      overdue: openMine.filter((row) => row.tasks.dueOn && dayDiff(row.tasks.dueOn, today) < 0).length,
    },
    tasks: snapshotTasks,
    allTasks: snapshotAllTasks,
    projects: snapshotProjects,
    members: snapshotMembers,
  };
}

function toTask(
  task: {
    id: string;
    title: string;
    description: string | null;
    projectId: string;
    status: TaskStatus;
    dueOn: string | null;
    assigneeId: string | null;
  },
  project: string,
  today: string,
  assignee: { name: string } | undefined,
): WorkspaceTask {
  const overdue = Boolean(task.dueOn && task.status !== "done" && dayDiff(task.dueOn, today) < 0);
  return {
    id: task.id,
    title: task.title,
    description: task.description ?? "",
    project,
    projectId: task.projectId,
    due: formatDue(task.dueOn, today),
    dueOn: task.dueOn,
    overdue,
    status: task.status,
    assigneeId: assignee ? task.assigneeId : null,
    assigneeName: assignee?.name ?? null,
    assigneeInitials: assignee ? initials(assignee.name) : null,
  };
}

function initials(name: string) {
  const parts = name.split(" ").filter(Boolean);
  return [parts[0], parts.length > 1 ? parts.at(-1) : undefined]
    .filter((part): part is string => Boolean(part))
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export async function createTask(input: { title: string; projectId: string; status?: unknown }) {
  const title = input.title.trim();
  if (!title) throw new HttpError(400, "Title is required");
  const status = input.status === undefined ? "todo" : input.status;
  if (!isTaskStatus(status)) throw new HttpError(400, "Unknown status");
  await ensureSeed();
  const db = await getDb();
  const [project] = await db.select().from(projects).where(eq(projects.id, input.projectId)).limit(1);
  if (!project) throw new HttpError(404, "Project not found");
  const [owner] = await db
    .select({ id: members.id })
    .from(members)
    .where(and(eq(members.workspaceId, project.workspaceId), eq(members.role, "owner")))
    .limit(1);
  const [created] = await db
    .insert(tasks)
    .values({
      projectId: project.id,
      assigneeId: owner?.id,
      title,
      status,
    })
    .returning();
  return { id: created.id };
}

export async function updateTask(
  id: string,
  patch: {
    title?: unknown;
    description?: unknown;
    dueOn?: unknown;
    assigneeId?: unknown;
    status?: unknown;
  },
) {
  const db = await getDb();
  const [existing] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  if (!existing) throw new HttpError(404, "Task not found");

  const values: {
    updatedAt: Date;
    title?: string;
    description?: string | null;
    dueOn?: string | null;
    assigneeId?: string | null;
    status?: TaskStatus;
  } = { updatedAt: new Date() };

  if ("status" in patch) {
    if (!isTaskStatus(patch.status)) throw new HttpError(400, "Unknown status");
    values.status = patch.status;
  }
  if ("title" in patch) {
    if (typeof patch.title !== "string" || !patch.title.trim()) throw new HttpError(400, "Title is required");
    values.title = patch.title.trim();
  }
  if ("description" in patch) {
    if (patch.description !== null && typeof patch.description !== "string") throw new HttpError(400, "Description is invalid");
    const text = typeof patch.description === "string" ? patch.description.trim() : "";
    values.description = text || null;
  }
  if ("dueOn" in patch) {
    if (patch.dueOn !== null && (typeof patch.dueOn !== "string" || !isIsoDate(patch.dueOn))) {
      throw new HttpError(400, "Due date is invalid");
    }
    values.dueOn = patch.dueOn;
  }
  if ("assigneeId" in patch) {
    if (patch.assigneeId === null) {
      values.assigneeId = null;
    } else if (typeof patch.assigneeId !== "string") {
      throw new HttpError(400, "Assignee is invalid");
    } else {
      const [project] = await db.select().from(projects).where(eq(projects.id, existing.projectId)).limit(1);
      if (!project) throw new HttpError(404, "Project not found");
      const [member] = await db
        .select({ id: members.id })
        .from(members)
        .where(and(eq(members.id, patch.assigneeId), eq(members.workspaceId, project.workspaceId)))
        .limit(1);
      if (!member) throw new HttpError(400, "Assignee is not in this workspace");
      values.assigneeId = member.id;
    }
  }

  if (Object.keys(values).length === 1) throw new HttpError(400, "Nothing to update");

  const [updated] = await db.update(tasks).set(values).where(eq(tasks.id, id)).returning({ id: tasks.id });
  if (!updated) throw new HttpError(404, "Task not found");
  return updated;
}

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}
