import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TaskStatus, WorkspaceSnapshot, WorkspaceTask } from "../../shared/workspace";

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

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; status: TaskStatus }) => {
      const response = await fetch(`/api/tasks/${input.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: input.status }),
      });
      if (!response.ok) throw new Error(await errorMessage(response));
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ["workspace"] });
      const previous = queryClient.getQueryData<WorkspaceSnapshot>(["workspace"]);
      queryClient.setQueryData<WorkspaceSnapshot>(["workspace"], (current) => {
        if (!current) return current;
        const move = (task: WorkspaceTask) =>
          task.id === input.id ? { ...task, status: input.status, overdue: input.status === "done" ? false : task.overdue } : task;
        return {
          ...current,
          tasks: current.tasks.map(move),
          allTasks: (current.allTasks ?? []).map(move),
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
