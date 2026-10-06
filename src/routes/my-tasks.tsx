import { WorkspaceGate } from "../app/gate";
import { TaskList } from "./task-list";

export function MyTasksPage() {
  return (
    <WorkspaceGate>
      {(data) => (
        <div className="page">
          <header className="ph">
            <div>
              <h1>My Tasks</h1>
              <p>{data.stats.assignedToYou} assigned to {data.user.firstName}</p>
            </div>
          </header>
          <section className="panel">
            <TaskList tasks={data.tasks} projects={data.projects} />
          </section>
        </div>
      )}
    </WorkspaceGate>
  );
}
