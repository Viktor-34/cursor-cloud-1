import { and, eq } from "drizzle-orm";
import type { TaskStatus, WorkspaceProject, WorkspaceSnapshot, WorkspaceTask } from "../shared/workspace";
import { isTaskStatus } from "../shared/workspace";
import { addDays, dayDiff, formatDue, localIso, startOfWeek } from "./dates";
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
    const [member] = await db
      .insert(members)
      .values({
        workspaceId: workspace.id,
        userId: user.id,
        role: "owner",
        title: "Head of Product",
      })
      .returning();

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
      { projectId: projectId("Product Launch"), assigneeId: member.id, title: "Launch readiness checklist", status: "progress", dueOn: addDays(today, 3), position: 2 },
      { projectId: projectId("Website Redesign"), assigneeId: member.id, title: "Prepare design system tokens", status: "todo", dueOn: addDays(today, 5), position: 3 },
      { projectId: projectId("Product Launch"), assigneeId: member.id, title: "Go / no-go meeting", status: "todo", dueOn: addDays(today, 11), position: 4 },
      { projectId: projectId("Marketing Campaign"), assigneeId: member.id, title: "Launch webinar deck", status: "todo", dueOn: addDays(today, 15), position: 5 },
      { projectId: projectId("Marketing Campaign"), assigneeId: member.id, title: "Press release draft", status: "todo", dueOn: addDays(today, -1), position: 6 },
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
    .map((row) => toTask(row.tasks, byProject.get(row.tasks.projectId)?.name ?? "Project", today));

  const snapshotAllTasks: WorkspaceTask[] = allTasks
    .slice()
    .sort((a, b) => a.tasks.position - b.tasks.position || a.tasks.title.localeCompare(b.tasks.title))
    .map((row) => toTask(row.tasks, byProject.get(row.tasks.projectId)?.name ?? "Project", today));

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
  const initials = [firstName, rest.at(-1)]
    .filter((part): part is string => Boolean(part))
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return {
    source: "database",
    user: { name: me.name, firstName, initials, title: me.title ?? "" },
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
  };
}

function toTask(
  task: { id: string; title: string; projectId: string; status: TaskStatus; dueOn: string | null },
  project: string,
  today: string,
): WorkspaceTask {
  const overdue = Boolean(task.dueOn && task.status !== "done" && dayDiff(task.dueOn, today) < 0);
  return {
    id: task.id,
    title: task.title,
    project,
    projectId: task.projectId,
    due: formatDue(task.dueOn, today),
    overdue,
    status: task.status,
  };
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

export async function updateTaskStatus(id: string, status: unknown) {
  if (!isTaskStatus(status)) throw new HttpError(400, "Unknown status");
  const db = await getDb();
  const [updated] = await db
    .update(tasks)
    .set({ status, updatedAt: new Date() })
    .where(eq(tasks.id, id))
    .returning({ id: tasks.id, status: tasks.status });
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
