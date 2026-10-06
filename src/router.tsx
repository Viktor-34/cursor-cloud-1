import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from "@tanstack/react-router";
import { Shell } from "./app/shell";
import { ProjectBoardPage } from "./routes/board";
import { CalendarPage } from "./routes/calendar";
import { HomePage } from "./routes/home";
import { MyTasksPage } from "./routes/my-tasks";
import { ProjectsPage } from "./routes/projects";
import { SectionPage } from "./routes/section";

const rootRoute = createRootRoute({
  component: () => (
    <Shell>
      <Outlet />
    </Shell>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const myTasksRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/my-tasks",
  component: MyTasksPage,
});

const projectsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/projects",
  component: ProjectsPage,
});

const projectBoardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/projects/$projectId",
  component: ProjectBoardPage,
});

const calendarRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/calendar",
  component: CalendarPage,
});

const inboxRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/inbox",
  component: () => <SectionPage title="Inbox" />,
});

const favoritesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/favorites",
  component: () => <SectionPage title="Favorites" />,
});

const overviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/overview",
  component: () => <SectionPage title="Overview" />,
});

const timelineRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/timeline",
  component: () => <SectionPage title="Timeline" />,
});

const membersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/members",
  component: () => <SectionPage title="Members" />,
});

const activityRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/activity",
  component: () => <SectionPage title="Activity" />,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: () => <SectionPage title="Settings" />,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  inboxRoute,
  favoritesRoute,
  myTasksRoute,
  overviewRoute,
  projectsRoute,
  projectBoardRoute,
  calendarRoute,
  timelineRoute,
  membersRoute,
  activityRoute,
  settingsRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
