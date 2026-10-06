import {
  date,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const memberRole = pgEnum("member_role", ["owner", "admin", "member", "guest"]);
export const projectStatus = pgEnum("project_status", ["planning", "active", "at_risk", "done"]);
export const taskStatus = pgEnum("task_status", ["backlog", "todo", "progress", "review", "done"]);

export const users = pgTable("users", {
  id: uuid().primaryKey().defaultRandom(),
  email: text().notNull().unique(),
  name: text().notNull(),
  /** Subject from the auth provider. Empty when the account is created directly in Postgres. */
  identityId: text("identity_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const workspaces = pgTable("workspaces", {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const members = pgTable(
  "members",
  {
    id: uuid().primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    role: memberRole().notNull().default("member"),
    title: text(),
  },
  (table) => [uniqueIndex("members_workspace_user").on(table.workspaceId, table.userId)],
);

export const projects = pgTable("projects", {
  id: uuid().primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id),
  name: text().notNull(),
  status: projectStatus().notNull().default("planning"),
  dueOn: date("due_on"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: uuid().primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id),
  title: text().notNull(),
  status: taskStatus().notNull().default("todo"),
  dueOn: date("due_on"),
  assigneeId: uuid("assignee_id").references(() => members.id),
  position: integer().notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
