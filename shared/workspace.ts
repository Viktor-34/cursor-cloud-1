export const taskStatuses = ["backlog", "todo", "progress", "review", "done"] as const;

export type TaskStatus = (typeof taskStatuses)[number];

export const taskStatusLabel: Record<TaskStatus, string> = {
  backlog: "Backlog",
  todo: "To do",
  progress: "In progress",
  review: "Review",
  done: "Done",
};

export type WorkspaceMember = {
  id: string;
  name: string;
  initials: string;
  title: string;
};

export type WorkspaceTask = {
  id: string;
  title: string;
  description: string;
  project: string;
  projectId: string;
  due: string;
  dueOn: string | null;
  overdue: boolean;
  status: TaskStatus;
  assigneeId: string | null;
  assigneeName: string | null;
  assigneeInitials: string | null;
};

export type TaskPatch = {
  title?: string;
  description?: string | null;
  dueOn?: string | null;
  assigneeId?: string | null;
  status?: TaskStatus;
};

export type WorkspaceProject = {
  id: string;
  name: string;
  status: "Planning" | "In Progress" | "At Risk" | "Done";
  progress: number;
  due: string;
};

export type WorkspaceSnapshot = {
  source: "database";
  user: { memberId: string; name: string; firstName: string; initials: string; title: string };
  workspace: { name: string };
  stats: {
    activeProjects: number;
    atRisk: number;
    openTasks: number;
    assignedToYou: number;
    completedThisWeek: number;
    overdue: number;
  };
  tasks: WorkspaceTask[];
  /** Every task in the workspace, including ones not assigned to the current user. */
  allTasks: WorkspaceTask[];
  projects: WorkspaceProject[];
  members: WorkspaceMember[];
};

export function isTaskStatus(value: unknown): value is TaskStatus {
  return typeof value === "string" && (taskStatuses as readonly string[]).includes(value);
}
