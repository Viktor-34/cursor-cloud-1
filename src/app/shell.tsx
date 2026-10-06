import { useRouterState, useNavigate, Link } from "@tanstack/react-router";
import {
  Activity,
  Bell,
  Calendar,
  ChartGantt,
  Folder,
  Home,
  Inbox,
  LayoutDashboard,
  ListChecks,
  Menu,
  Plus,
  Search,
  Settings,
  Star,
  Users,
} from "lucide-react";
import { useState, type ReactNode } from "react";

const mainNav = [
  { to: "/", label: "Home", icon: Home, exact: true },
  { to: "/inbox", label: "Inbox", icon: Inbox, count: "4" },
  { to: "/my-tasks", label: "My Tasks", icon: ListChecks, count: "2" },
  { to: "/favorites", label: "Favorites", icon: Star },
] as const;

const workspaceNav = [
  { to: "/overview", label: "Overview", icon: LayoutDashboard },
  { to: "/projects", label: "Projects", icon: Folder },
  { to: "/my-tasks", label: "Tasks", icon: ListChecks, match: false },
  { to: "/calendar", label: "Calendar", icon: Calendar },
  { to: "/timeline", label: "Timeline", icon: ChartGantt },
  { to: "/members", label: "Members", icon: Users },
  { to: "/activity", label: "Activity", icon: Activity },
] as const;

const bottomNav = [
  { to: "/", label: "Home", icon: Home, exact: true },
  { to: "/my-tasks", label: "My Tasks", icon: ListChecks },
  { to: "/projects", label: "Projects", icon: Folder },
  { to: "/inbox", label: "Inbox", icon: Inbox },
] as const;

function isActive(pathname: string, to: string, exact?: boolean) {
  if (exact || to === "/") return pathname === to;
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function Shell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <div className={menuOpen ? "shell mnav" : "shell"}>
      {menuOpen ? (
        <button className="side-scrim" type="button" aria-label="Close menu" onClick={() => setMenuOpen(false)} />
      ) : null}
      <aside className="side">
        <div className="side-top">
          <button className="ws" type="button" onClick={() => { closeMenu(); void navigate({ to: "/" }); }}>
            <span className="ws-logo brand">c</span>
            <span className="ws-name trunc">CRM</span>
          </button>
        </div>
        <div className="side-scroll">
          {mainNav.map((item) => (
            <NavButton key={item.label} {...item} pathname={pathname} onNavigate={closeMenu} />
          ))}
          <div className="sgroup">
            <div className="sgroup-h">Workspace</div>
            {workspaceNav.map((item) => (
              <NavButton key={item.label} {...item} pathname={pathname} onNavigate={closeMenu} />
            ))}
          </div>
          <div className="sgroup">
            <div className="sgroup-h">Projects</div>
            <NavButton to="/projects" label="Website Redesign" icon={Folder} pathname={pathname} match={false} onNavigate={closeMenu} />
            <NavButton to="/projects" label="Mobile App" icon={Folder} pathname={pathname} match={false} onNavigate={closeMenu} />
            <NavButton to="/projects" label="Product Launch" icon={Folder} pathname={pathname} match={false} onNavigate={closeMenu} />
          </div>
        </div>
        <div className="side-bot">
          <button className="sitem" type="button" onClick={() => { closeMenu(); void navigate({ to: "/settings" }); }}>
            <Settings size={16} className="i" />
            <span className="trunc">Settings</span>
          </button>
          <button className="sitem" type="button" onClick={() => { closeMenu(); void navigate({ to: "/settings" }); }}>
            <span className="av" style={{ ["--c" as string]: "#5A67D8" }}>AM</span>
            <span className="trunc">Alex Morgan</span>
          </button>
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <button className="ibtn nav-toggle" type="button" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
            <Menu size={16} className="i" />
          </button>
          <div className="crumbs">
            <span className="cur">CRM</span>
          </div>
          <span className="sp" />
          <button className="topsearch" type="button">
            <Search size={14} className="i" />
            <span className="lbltxt">Search or jump to…</span>
            <kbd className="kbd">Ctrl K</kbd>
          </button>
          <button className="ibtn" type="button" aria-label="Notifications" onClick={() => { closeMenu(); void navigate({ to: "/inbox" }); }}>
            <Bell size={16} className="i" />
          </button>
          <button className="btn btn-primary btn-sm" type="button">
            <Plus size={14} className="i" /> New
          </button>
        </header>
        <div className="content">{children}</div>
      </div>
      <nav className="bottomnav" aria-label="Primary">
        {bottomNav.map((item) => {
          const Icon = item.icon;
          const on = isActive(pathname, item.to, "exact" in item ? item.exact : false);
          return (
            <Link key={item.label} to={item.to} className={on ? "on" : undefined} aria-current={on ? "page" : undefined} onClick={closeMenu}>
              <Icon size={16} className="i" />
              {item.label}
            </Link>
          );
        })}
        <Link to="/settings" className={pathname === "/settings" ? "on" : undefined} onClick={closeMenu}>
          <Menu size={16} className="i" />
          More
        </Link>
      </nav>
    </div>
  );
}

function NavButton({
  to,
  label,
  icon: Icon,
  count,
  exact,
  match = true,
  pathname,
  onNavigate,
}: {
  to: "/" | "/inbox" | "/my-tasks" | "/favorites" | "/overview" | "/projects" | "/calendar" | "/timeline" | "/members" | "/activity" | "/settings";
  label: string;
  icon: typeof Home;
  count?: string;
  exact?: boolean;
  match?: boolean;
  pathname: string;
  onNavigate: () => void;
}) {
  const navigate = useNavigate();
  const on = match && isActive(pathname, to, exact);
  return (
    <button
      className={on ? "sitem on" : "sitem"}
      type="button"
      aria-current={on ? "page" : undefined}
      onClick={() => {
        onNavigate();
        void navigate({ to });
      }}
    >
      <Icon size={16} className="i" />
      <span className="trunc">{label}</span>
      {count ? <span className="ct">{count}</span> : null}
    </button>
  );
}
