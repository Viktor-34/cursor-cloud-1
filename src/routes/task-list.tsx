import type { CSSProperties, FormEvent } from "react";
import { useState } from "react";
import { taskStatusLabel, taskStatuses, type TaskStatus, type WorkspaceProject, type WorkspaceTask } from "../../shared/workspace";
import { useOpenTask } from "../app/task-drawer";
import { useCreateTask, useUpdateTask } from "../data/workspace";

const columns = "minmax(0,1.6fr) 150px 132px 88px";

export function TaskList({ tasks, projects }: { tasks: WorkspaceTask[]; projects: WorkspaceProject[] }) {
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const openTask = useOpenTask();
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
              <button className="tt" type="button" onClick={() => openTask(task.id)}>{task.title}</button>
            </div>
            <div className="muted trunc">{task.project}</div>
            <div>
              <select
                className="select"
                aria-label={`Status for ${task.title}`}
                value={task.status}
                disabled={updateTask.isPending && updateTask.variables?.id === task.id}
                onChange={(event) => {
                  const status = event.target.value as TaskStatus;
                  updateTask.mutate({ id: task.id, status });
                }}
              >
                {taskStatuses.map((status) => (
                  <option key={status} value={status}>{taskStatusLabel[status]}</option>
                ))}
              </select>
            </div>
            <div className={task.overdue ? "badge red" : task.due === "Today" ? "badge amber" : "faint"}>{task.due}</div>
          </div>
        ))}
      </div>
      {updateTask.isError ? <p className="err" style={{ padding: "10px 14px" }}>{updateTask.error.message}</p> : null}
    </div>
  );
}
