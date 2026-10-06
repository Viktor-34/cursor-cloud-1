import type { ReactNode } from "react";
import type { WorkspaceSnapshot } from "../../shared/workspace";
import { useWorkspace } from "../data/workspace";

export function WorkspaceGate({ children }: { children: (data: WorkspaceSnapshot) => ReactNode }) {
  const workspace = useWorkspace();

  if (workspace.isPending) {
    return (
      <div className="page">
        <p className="muted">Loading workspace…</p>
      </div>
    );
  }

  if (workspace.isError) {
    return (
      <div className="page">
        <div className="panel">
          <div className="panel-h">
            <h2>Workspace unavailable</h2>
          </div>
          <div className="panel-b">
            <p className="muted">The workspace snapshot did not load.</p>
            <button className="btn btn-secondary" type="button" onClick={() => void workspace.refetch()}>
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children(workspace.data);
}
