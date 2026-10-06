import type { CSSProperties, FormEvent } from "react";
import { useState } from "react";
import { taskStatuses, type TaskStatus, type WorkspaceProject, type WorkspaceTask } from "../../shared/workspace";
import { useCreateTask, useUpdateTaskStatus } from "../data/workspace";

const columns = "minmax(0,1.6fr) 150px 132px 88px";
const statusLabel: Record<TaskStatus, string> = {
  backlog: "Backlog",
  todo: "To do",
  progress: "In progress",
  review: "Review",
  done: "Done",
};

export function TaskList({ tasks, projects }: { tasks: WorkspaceTask[]; projects: WorkspaceProject[] }) {
  const createTask = useCreateTask();
  const updateStatus = useUpdateTaskStatus();
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const nextTitle = title.trim();
    if (!nextTitle || !projectId) return;
    createTask.mutate(
      { title: nextTitle, projectId },
      { onSuccess: () => setTitle("") },
    );
  }

  return (
    <div>
      <form className="task-add" onSubmit={onSubmit}>
        <input
          className="input"
          value={title}
          placeholder="New task"
          aria-label="Task title"
          onChange={(event) => setTitle(event.target.value)}
        />
        <select className="select" aria-label="Project" value={projectId} onChange={(event) => setProjectId(event.target.value)}>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>{project.name}</option>
          ))}
        </select>
        <button className="btn btn-primary" type="submit" disabled={createTask.isPending || !title.trim()}>
          Add task
        </button>
      </form>
      {createTask.isError ? <p className="err" style={{ padding: "0 14px 10px" }}>{createTask.error.message}</p> : null}
      <div className="tlist" style={{ "--cols": columns } as CSSProperties}>
        <div className="thead">
          <div>Task</div>
          <div>Project</div>
          <div>Status</div>
          <div>Due</div>
        </div>
        {tasks.map((task) => (
          <div className={task.status === "done" ? "trow done" : "trow"} key={task.id}>
            <div className="ttl">
              <span className="tt">{task.title}</span>
            </div>
            <div className="muted trunc">{task.project}</div>
            <div>
              <select
                className="select"
                aria-label={`Status for ${task.title}`}
                value={task.status}
                disabled={updateStatus.isPending && updateStatus.variables?.id === task.id}
                onChange={(event) => {
                  const status = event.target.value as TaskStatus;
                  updateStatus.mutate({ id: task.id, status });
                }}
              >
                {taskStatuses.map((status) => (
                  <option key={status} value={status}>{statusLabel[status]}</option>
                ))}
              </select>
            </div>
            <div className={task.overdue ? "badge red" : task.due === "Today" ? "badge amber" : "faint"}>{task.due}</div>
          </div>
        ))}
      </div>
      {updateStatus.isError ? <p className="err" style={{ padding: "10px 14px" }}>{updateStatus.error.message}</p> : null}
    </div>
  );
}
