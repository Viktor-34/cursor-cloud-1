import { Link, useParams } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useRef, useState, type DragEvent, type FormEvent } from "react";
import { taskStatusLabel, taskStatuses, type TaskStatus, type WorkspaceTask } from "../../shared/workspace";
import { avatarColor } from "../app/avatar";
import { WorkspaceGate } from "../app/gate";
import { useOpenTask } from "../app/task-drawer";
import { useCreateTask, useUpdateTask } from "../data/workspace";

const statusColor: Record<TaskStatus, string> = {
  backlog: "var(--st-backlog)",
  todo: "var(--st-todo)",
  progress: "var(--st-progress)",
  review: "var(--st-review)",
  done: "var(--st-done)",
};

export function ProjectBoardPage() {
  const { projectId } = useParams({ from: "/projects/$projectId" });

  return (
    <WorkspaceGate>
      {(data) => {
        const project = data.projects.find((item) => item.id === projectId);
        if (!project) {
          return (
            <div className="page">
              <header className="ph">
                <div>
                  <h1>Project not found</h1>
                  <p>This project is not in the workspace.</p>
                </div>
              </header>
              <Link to="/projects" className="btn btn-secondary">Back to projects</Link>
            </div>
          );
        }

        const cards = data.allTasks.filter((task) => task.projectId === projectId);
        const badge =
          project.status === "At Risk" ? "badge red" : project.status === "Planning" ? "badge amber" : "badge green";

        return (
          <div className="page flush">
            <div className="toolbar">
              <Link to="/projects" className="btn btn-ghost btn-sm">Projects</Link>
              <h1 className="board-title">{project.name}</h1>
              <span className={badge}>{project.status}</span>
              <span className="faint">{cards.length} {cards.length === 1 ? "task" : "tasks"}</span>
            </div>
            <Board projectId={project.id} tasks={cards} />
          </div>
        );
      }}
    </WorkspaceGate>
  );
}

function Board({ projectId, tasks }: { projectId: string; tasks: WorkspaceTask[] }) {
  const updateTask = useUpdateTask();
  const openTask = useOpenTask();
  const dragged = useRef(false);
  const [over, setOver] = useState<TaskStatus | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  function dropOn(status: TaskStatus, event: DragEvent<HTMLElement>) {
    event.preventDefault();
    const id = event.dataTransfer.getData("text/plain") || draggingId;
    setOver(null);
    setDraggingId(null);
    if (!id) return;
    const task = tasks.find((item) => item.id === id);
    if (!task || task.status === status) return;
    updateTask.mutate({ id, status });
  }

  return (
    <>
      {updateTask.isError ? <p className="err board-error">{updateTask.error.message}</p> : null}
      <div className="board">
      {taskStatuses.map((status) => {
        const columnTasks = tasks.filter((task) => task.status === status);
        return (
          <section
            key={status}
            className={over === status ? "bcol over" : "bcol"}
            aria-label={taskStatusLabel[status]}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
              setOver((current) => (current === status ? current : status));
            }}
            onDragLeave={(event) => {
              if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
              setOver((current) => (current === status ? null : current));
            }}
            onDrop={(event) => dropOn(status, event)}
          >
            <header className="bcol-h">
              <span className="pdot" style={{ ["--c" as string]: statusColor[status] }} />
              <span>{taskStatusLabel[status]}</span>
              <span className="cnt">{columnTasks.length}</span>
            </header>
            <div className="bcol-b">
              {columnTasks.map((task) => (
                <article
                  key={task.id}
                  className={
                    draggingId === task.id ? "kcard dragging" : task.status === "done" ? "kcard done" : "kcard"
                  }
                  draggable
                  onClick={(event) => {
                    if (dragged.current) return;
                    const target = event.target as HTMLElement;
                    if (target.closest("select, button, textarea, input, a")) return;
                    openTask(task.id);
                  }}
                  onDragStart={(event) => {
                    dragged.current = true;
                    event.dataTransfer.setData("text/plain", task.id);
                    event.dataTransfer.effectAllowed = "move";
                    setDraggingId(task.id);
                  }}
                  onDragEnd={() => {
                    setDraggingId(null);
                    setOver(null);
                    window.setTimeout(() => {
                      dragged.current = false;
                    }, 0);
                  }}
                >
                  <div className="title">{task.title}</div>
                  {task.description ? <p className="desc">{task.description}</p> : null}
                  <div className="meta">
                    <span className={task.overdue ? "due over" : task.due === "Today" ? "due soon" : "due"}>{task.due}</span>
                    {task.assigneeInitials ? (
                      <span className="av" style={{ ["--c" as string]: avatarColor(task.assigneeId ?? task.assigneeInitials) }} title={task.assigneeName ?? undefined}>
                        {task.assigneeInitials}
                      </span>
                    ) : null}
                    <select
                      className="select status-move"
                      aria-label={`Move ${task.title}`}
                      value={task.status}
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={(event) => event.stopPropagation()}
                      onChange={(event) => {
                        const next = event.target.value as TaskStatus;
                        if (next !== task.status) updateTask.mutate({ id: task.id, status: next });
                      }}
                    >
                      {taskStatuses.map((option) => (
                        <option key={option} value={option}>{taskStatusLabel[option]}</option>
                      ))}
                    </select>
                  </div>
                </article>
              ))}
              {columnTasks.length === 0 ? <p className="faint empty-col">Drop a task here</p> : null}
              <AddCard projectId={projectId} status={status} />
            </div>
          </section>
        );
      })}
      </div>
    </>
  );
}

function AddCard({ projectId, status }: { projectId: string; status: TaskStatus }) {
  const createTask = useCreateTask();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const nextTitle = title.trim();
    if (!nextTitle) return;
    createTask.mutate(
      { title: nextTitle, projectId, status },
      {
        onSuccess: () => {
          setTitle("");
          setOpen(false);
        },
      },
    );
  }

  if (!open) {
    return (
      <button className="addcard" type="button" onClick={() => setOpen(true)}>
        <Plus size={14} className="i" /> Add
      </button>
    );
  }

  return (
    <form className="composer" onSubmit={onSubmit}>
      <textarea
        autoFocus
        rows={2}
        placeholder="Task title"
        aria-label={`New ${taskStatusLabel[status]} task`}
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            event.currentTarget.form?.requestSubmit();
          }
        }}
      />
      <div className="row">
        <button className="btn btn-primary btn-sm" type="submit" disabled={createTask.isPending || !title.trim()}>
          Add
        </button>
        <button className="btn btn-ghost btn-sm" type="button" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
      {createTask.isError ? <p className="err">{createTask.error.message}</p> : null}
    </form>
  );
}
