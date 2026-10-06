import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { dayDiff, formatDue, localIso } from "../../db/dates";
import type { TaskPatch, TaskStatus, WorkspaceMember, WorkspaceSnapshot, WorkspaceTask } from "../../shared/workspace";

export function useWorkspace() {
  return useQuery({
    queryKey: ["workspace"],
    queryFn: async (): Promise<WorkspaceSnapshot> => {
      const response = await fetch("/api/workspace");
      if (!response.ok) throw new Error(await errorMessage(response));
      return response.json() as Promise<WorkspaceSnapshot>;
    },
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { title: string; projectId: string; status?: TaskStatus }) => {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!response.ok) throw new Error(await errorMessage(response));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workspace"] }),
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string } & TaskPatch) => {
      const { id, ...patch } = input;
      const response = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!response.ok) throw new Error(await errorMessage(response));
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ["workspace"] });
      const previous = queryClient.getQueryData<WorkspaceSnapshot>(["workspace"]);
      queryClient.setQueryData<WorkspaceSnapshot>(["workspace"], (current) => {
        if (!current) return current;
        const today = localIso();
        const next = applyPatch(current.allTasks.find((task) => task.id === input.id), input, current.members ?? [], today);
        if (!next) return current;
        const mine = (current.tasks ?? []).filter((task) => task.id !== next.id);
        return {
          ...current,
          tasks: next.assigneeId === current.user.memberId ? [...mine, next] : mine,
          allTasks: current.allTasks.map((task) => (task.id === next.id ? next : task)),
        };
      });
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) queryClient.setQueryData(["workspace"], context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["workspace"] }),
  });
}

function applyPatch(task: WorkspaceTask | undefined, patch: { id: string } & TaskPatch, members: WorkspaceMember[], today: string) {
  if (!task) return undefined;
  const next: WorkspaceTask = { ...task };
  if (patch.status !== undefined) next.status = patch.status;
  if (patch.title !== undefined) next.title = patch.title.trim();
  if (patch.description !== undefined) next.description = patch.description?.trim() ?? "";
  if (patch.dueOn !== undefined) {
    next.dueOn = patch.dueOn;
    next.due = formatDue(patch.dueOn, today);
  }
  if (patch.assigneeId !== undefined) {
    const member = members.find((item) => item.id === patch.assigneeId);
    next.assigneeId = member?.id ?? null;
    next.assigneeName = member?.name ?? null;
    next.assigneeInitials = member?.initials ?? null;
  }
  next.overdue = Boolean(next.dueOn && next.status !== "done" && dayDiff(next.dueOn, today) < 0);
  return next;
}

async function errorMessage(response: Response) {
  const body = (await response.json().catch(() => null)) as { error?: string } | null;
  return body?.error ?? "Request failed";
}

export function greeting(firstName: string, now = new Date()) {
  const hour = now.getHours();
  const hello = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return `${hello}, ${firstName}`;
}

export function todayLabel(now = new Date()) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(now);
}
