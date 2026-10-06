import { X } from "lucide-react";
import { createContext, useContext, useState, type FormEvent, type ReactNode } from "react";
import { taskStatusLabel, taskStatuses, type TaskStatus, type WorkspaceTask } from "../../shared/workspace";
import { useUpdateTask, useWorkspace } from "../data/workspace";
import { avatarColor } from "./avatar";

const OpenTaskContext = createContext<(id: string) => void>(() => {});

export function useOpenTask() {
  return useContext(OpenTaskContext);
}

export function OpenTaskProvider({ children }: { children: ReactNode }) {
  const [taskId, setTaskId] = useState<string | null>(null);
  return (
    <OpenTaskContext.Provider value={setTaskId}>
      {children}
      <TaskDrawer taskId={taskId} onClose={() => setTaskId(null)} />
    </OpenTaskContext.Provider>
  );
}

function TaskDrawer({ taskId, onClose }: { taskId: string | null; onClose: () => void }) {
  const workspace = useWorkspace();
  if (!taskId) return null;
  const task = workspace.data?.allTasks.find((item) => item.id === taskId);

  return (
    <>
      <button className="drawer-scrim full enter" type="button" aria-label="Close task" onClick={onClose} />
      <aside
        className="drawer enter"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-card-title"
        onKeyDown={(event) => {
          if (event.key === "Escape") onClose();
        }}
      >
        <header className="drawer-h">
          <span className="trunc faint">{task?.project ?? "Task"}</span>
          {task?.assigneeInitials ? (
            <span className="av" title={task.assigneeName ?? undefined} style={{ ["--c" as string]: avatarColor(task.assigneeId ?? task.assigneeInitials) }}>
              {task.assigneeInitials}
            </span>
          ) : null}
          <span className="sp" />
          <button className="ibtn" type="button" aria-label="Close" onClick={onClose}>
            <X size={16} className="i" />
          </button>
        </header>
        <div className="drawer-b">
          {task && workspace.data ? (
            <TaskEditor key={task.id} task={task} members={workspace.data.members} />
          ) : (
            <p className="muted">This task is no longer in the workspace.</p>
          )}
        </div>
      </aside>
    </>
  );
}

function TaskEditor({
  task,
  members,
}: {
  task: WorkspaceTask;
  members: { id: string; name: string; title: string }[];
}) {
  const update = useUpdateTask();
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const saving = update.isPending && update.variables?.id === task.id;
  const failed = update.isError && update.variables?.id === task.id;

  function saveTitle() {
    const next = title.trim();
    if (!next) {
      setTitle(task.title);
      return;
    }
    setTitle(next);
    if (next !== task.title) update.mutate({ id: task.id, title: next });
  }

  function saveDescription() {
    const next = description.trim();
    setDescription(next);
    if (next !== task.description) update.mutate({ id: task.id, description: next });
  }

  return (
    <form
      className="task-card"
      onSubmit={(event: FormEvent) => {
        event.preventDefault();
        saveTitle();
        saveDescription();
      }}
    >
      <input
        id="task-card-title"
        className="task-title"
        value={title}
        aria-label="Title"
        autoFocus
        onChange={(event) => setTitle(event.target.value)}
        onBlur={saveTitle}
      />
      <label className="field">
        <span className="label">Description</span>
        <textarea
          className="textarea"
          rows={5}
          placeholder="Add a description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          onBlur={saveDescription}
        />
      </label>
      <div className="task-fields">
        <label className="field">
          <span className="label">Status</span>
          <select
            className="select"
            value={task.status}
            onChange={(event) => update.mutate({ id: task.id, status: event.target.value as TaskStatus })}
          >
            {taskStatuses.map((status) => (
              <option key={status} value={status}>{taskStatusLabel[status]}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="label">Due</span>
          <input
            className="input"
            type="date"
            value={task.dueOn ?? ""}
            onChange={(event) => update.mutate({ id: task.id, dueOn: event.target.value || null })}
          />
        </label>
        <label className="field">
          <span className="label">Assignee</span>
          <select
            className="select"
            value={task.assigneeId ?? ""}
            onChange={(event) => update.mutate({ id: task.id, assigneeId: event.target.value || null })}
          >
            <option value="">Unassigned</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.title ? `${member.name} · ${member.title}` : member.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      {saving ? <p className="hint">Saving…</p> : null}
      {failed ? <p className="err">{update.error.message}</p> : null}
    </form>
  );
}
