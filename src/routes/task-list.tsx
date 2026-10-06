import type { CSSProperties } from "react";
import type { DemoTask } from "../../shared/workspace";

const columns = "minmax(0,1.6fr) 168px 88px";

export function TaskList({ tasks }: { tasks: DemoTask[] }) {
  return (
    <div className="tlist" style={{ "--cols": columns } as CSSProperties}>
      <div className="thead">
        <div>Task</div>
        <div>Project</div>
        <div>Due</div>
      </div>
      {tasks.map((task) => (
        <div className="trow" key={task.id}>
          <div className="ttl">
            <span className="tt">{task.title}</span>
          </div>
          <div className="muted trunc">{task.project}</div>
          <div className={task.due === "Today" ? "badge amber" : "faint"}>{task.due}</div>
        </div>
      ))}
    </div>
  );
}
