export type DemoTask = {
  id: string;
  title: string;
  project: string;
  due: string;
  status: "backlog" | "todo" | "progress" | "review" | "done";
};

export type DemoProject = {
  id: string;
  name: string;
  status: "Planning" | "In Progress" | "At Risk";
  progress: number;
  due: string;
};

export type WorkspaceSnapshot = {
  source: "seed";
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
  tasks: DemoTask[];
  projects: DemoProject[];
};

/** Stand-in snapshot until rows are read from Postgres. */
export const demoWorkspace: WorkspaceSnapshot = {
  source: "seed",
  user: { name: "Alex Morgan", firstName: "Alex", initials: "AM", title: "Head of Product" },
  workspace: { name: "Gr8r Studio" },
  stats: {
    activeProjects: 5,
    atRisk: 1,
    openTasks: 39,
    assignedToYou: 7,
    completedThisWeek: 9,
    overdue: 2,
  },
  tasks: [
    { id: "t1", title: "Triage beta tester feedback", project: "Mobile App", due: "Today", status: "todo" },
    { id: "t2", title: "Weekly design sync notes", project: "Website Redesign", due: "Thu", status: "todo" },
    { id: "t3", title: "Launch readiness checklist", project: "Product Launch", due: "Fri", status: "progress" },
    { id: "t4", title: "Prepare design system tokens", project: "Website Redesign", due: "Mon", status: "todo" },
    { id: "t5", title: "Go / no-go meeting", project: "Product Launch", due: "Oct 17", status: "todo" },
    { id: "t6", title: "Launch webinar deck", project: "Marketing Campaign", due: "Oct 21", status: "todo" },
  ],
  projects: [
    { id: "p1", name: "Website Redesign", status: "In Progress", progress: 22, due: "Oct 30" },
    { id: "p2", name: "Mobile App", status: "In Progress", progress: 11, due: "Nov 27" },
    { id: "p3", name: "Marketing Campaign", status: "Planning", progress: 14, due: "Nov 15" },
    { id: "p4", name: "Product Launch", status: "At Risk", progress: 0, due: "Oct 18" },
    { id: "p5", name: "Design System", status: "In Progress", progress: 17, due: "Dec 15" },
  ],
};
