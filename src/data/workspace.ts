import { useQuery } from "@tanstack/react-query";
import type { WorkspaceSnapshot } from "../../shared/workspace";

export function useWorkspace() {
  return useQuery({
    queryKey: ["workspace"],
    queryFn: async (): Promise<WorkspaceSnapshot> => {
      const response = await fetch("/api/workspace");
      if (!response.ok) throw new Error("Could not load the workspace");
      return response.json() as Promise<WorkspaceSnapshot>;
    },
  });
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
