export const taskStatuses = ["backlog", "todo", "progress", "review", "done"] as const;

export type TaskStatus = (typeof taskStatuses)[number];

export type WorkspaceTask = {
  id: string;
  title: string;
  project: string;
  projectId: string;
  due: string;
  overdue: boolean;
  status: TaskStatus;
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
  user: { name: string; firstName: string; initials: string; title: string };
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
  projects: WorkspaceProject[];
};

export function isTaskStatus(value: unknown): value is TaskStatus {
  return typeof value === "string" && (taskStatuses as readonly string[]).includes(value);
}
