import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { localIso } from "../../db/dates";
import type { WorkspaceTask } from "../../shared/workspace";
import { avatarColor } from "../app/avatar";
import { WorkspaceGate } from "../app/gate";
import { useOpenTask } from "../app/task-drawer";

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function CalendarPage() {
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  function shift(delta: number) {
    const next = new Date(cursor.year, cursor.month + delta, 1);
    setCursor({ year: next.getFullYear(), month: next.getMonth() });
  }

  return (
    <WorkspaceGate>
      {(data) => (
        <Month
          year={cursor.year}
          month={cursor.month}
          today={localIso()}
          tasks={data.allTasks}
          onPrevious={() => shift(-1)}
          onNext={() => shift(1)}
          onToday={() => {
            const now = new Date();
            setCursor({ year: now.getFullYear(), month: now.getMonth() });
          }}
        />
      )}
    </WorkspaceGate>
  );
}

function Month({
  year,
  month,
  today,
  tasks,
  onPrevious,
  onNext,
  onToday,
}: {
  year: number;
  month: number;
  today: string;
  tasks: WorkspaceTask[];
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
}) {
  const openTask = useOpenTask();
  const cells = monthCells(year, month);
  const inMonth = tasks.filter((task) => task.dueOn?.startsWith(monthKey(year, month)));
  const label = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date(year, month, 1));

  return (
    <div className="page flush">
      <div className="toolbar">
        <button className="ibtn" type="button" aria-label="Previous month" onClick={onPrevious}>
          <ChevronLeft size={16} className="i" />
        </button>
        <h1 className="board-title">{label}</h1>
        <button className="ibtn" type="button" aria-label="Next month" onClick={onNext}>
          <ChevronRight size={16} className="i" />
        </button>
        <button className="btn btn-ghost btn-sm" type="button" onClick={onToday}>Today</button>
        <span className="faint">{inMonth.length} {inMonth.length === 1 ? "deadline" : "deadlines"}</span>
      </div>
      <div className="cal">
        <div className="cal-h">
          {weekdays.map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>
        <div className="cal-g">
          {cells.map((cell) => {
            const dayTasks = tasks
              .filter((task) => task.dueOn === cell.iso)
              .sort((a, b) => Number(a.status === "done") - Number(b.status === "done") || a.title.localeCompare(b.title));
            const className = ["cday", cell.inMonth ? "" : "out", cell.iso === today ? "today" : ""].filter(Boolean).join(" ");
            return (
              <div key={cell.iso} className={className} data-iso={cell.iso}>
                <span className="dn">{cell.day}</span>
                {dayTasks.map((task) => (
                  <button
                    key={task.id}
                    className={task.status === "done" ? "cev done" : "cev"}
                    type="button"
                    style={{ ["--c" as string]: task.overdue ? "var(--red)" : avatarColor(task.projectId) }}
                    title={`${task.title} · ${task.project}`}
                    onClick={() => openTask(task.id)}
                  >
                    <span className="trunc">{task.title}</span>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
        <Agenda tasks={inMonth} onOpen={openTask} />
      </div>
    </div>
  );
}

function Agenda({ tasks, onOpen }: { tasks: WorkspaceTask[]; onOpen: (id: string) => void }) {
  const groups = new Map<string, WorkspaceTask[]>();
  for (const task of [...tasks].sort((a, b) => (a.dueOn ?? "").localeCompare(b.dueOn ?? "") || a.title.localeCompare(b.title))) {
    const key = task.dueOn ?? "";
    groups.set(key, [...(groups.get(key) ?? []), task]);
  }

  return (
    <section className="cal-agenda" aria-label="Deadlines this month">
      {[...groups].map(([iso, dayTasks]) => (
        <div key={iso}>
          <h2>{dayLabel(iso)}</h2>
          {dayTasks.map((task) => (
            <button
              key={task.id}
              className={task.status === "done" ? "cev done" : "cev"}
              type="button"
              style={{ ["--c" as string]: task.overdue ? "var(--red)" : avatarColor(task.projectId) }}
              onClick={() => onOpen(task.id)}
            >
              <span className="trunc">{task.title}</span>
              <span className="faint">{task.project}</span>
            </button>
          ))}
        </div>
      ))}
    </section>
  );
}

function dayLabel(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" }).format(new Date(year, month - 1, day));
}

function monthCells(year: number, month: number) {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - offset);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return { iso: localIso(date), inMonth: date.getMonth() === month, day: date.getDate() };
  });
}

function monthKey(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}
