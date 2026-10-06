import type { CSSProperties } from "react";
import { Link } from "@tanstack/react-router";
import { WorkspaceGate } from "../app/gate";

export function ProjectsPage() {
  return (
    <WorkspaceGate>
      {(data) => (
        <div className="page">
          <header className="ph">
            <div>
              <h1>Projects</h1>
              <p>{data.stats.activeProjects} active in {data.workspace.name}</p>
            </div>
          </header>
          <div className="stack">
            {data.projects.map((project) => (
              <article className="panel" key={project.id}>
                <div className="panel-h">
                  <h2>
                    <Link to="/projects/$projectId" params={{ projectId: project.id }}>{project.name}</Link>
                  </h2>
                  <div className="acts">
                    <span className={`badge ${project.status === "At Risk" ? "red" : project.status === "Planning" ? "amber" : "green"}`}>
                      {project.status}
                    </span>
                  </div>
                </div>
                <div className="panel-b">
                  <div className="row" style={{ gap: 12 }}>
                    <span className="prog" style={{ "--p": project.progress / 100 } as CSSProperties}>
                      <i />
                    </span>
                    <span className="num">{project.progress}%</span>
                    <span className="faint">Due {project.due}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </WorkspaceGate>
  );
}
