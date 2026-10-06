import type { CSSProperties } from "react";
import { WorkspaceGate } from "../app/gate";
import { greeting, todayLabel } from "../data/workspace";
import { TaskList } from "./task-list";

export function HomePage() {
  return (
    <WorkspaceGate>
      {(data) => (
        <div className="page">
          <header className="ph">
            <div>
              <h1>{greeting(data.user.firstName)}</h1>
              <p>{todayLabel()} · Here&apos;s what&apos;s happening across your workspace.</p>
            </div>
          </header>
          <div className="stats">
            <Stat label="Active projects" value={data.stats.activeProjects} detail={`${data.stats.atRisk} at risk`} />
            <Stat label="Open tasks" value={data.stats.openTasks} detail={`${data.stats.assignedToYou} assigned to you`} />
            <Stat label="Completed" value={data.stats.completedThisWeek} detail="this week" tone="up" />
            <Stat label="Overdue" value={data.stats.overdue} detail="need attention" tone="bad" />
          </div>
          <div className="stack" style={{ marginTop: 16 }}>
            <section className="panel">
              <div className="panel-h">
                <h2>My tasks</h2>
              </div>
              <TaskList tasks={data.tasks} />
            </section>
            <section className="panel">
              <div className="panel-h">
                <h2>Project progress</h2>
              </div>
              <div className="panel-b">
                {data.projects.map((project) => (
                  <div className="row" key={project.id} style={{ minHeight: 40, gap: 12 }}>
                    <span className="trunc grow">{project.name}</span>
                    <span className={`badge ${project.status === "At Risk" ? "red" : project.status === "Planning" ? "amber" : "green"}`}>
                      {project.status}
                    </span>
                    <span className="prog stat-prog" style={{ "--p": project.progress / 100 } as CSSProperties}>
                      <i />
                    </span>
                    <span className="faint num" style={{ width: 36 }}>{project.progress}%</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}
    </WorkspaceGate>
  );
}

function Stat({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: number;
  detail: string;
  tone?: "up" | "bad";
}) {
  return (
    <div className="stat">
      <div className="k">{label}</div>
      <div className="v">{value}</div>
      <div className={tone ? `d ${tone}` : "d"}>{detail}</div>
    </div>
  );
}
