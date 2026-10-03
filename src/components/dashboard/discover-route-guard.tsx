"use client";

import { useEffect, useState, type ReactNode } from "react";

export function DiscoverRouteGuard({ children }: { children: ReactNode }) {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const explicitDiscover = new URLSearchParams(window.location.search).get("intent") === "discover";
      if (explicitDiscover) {
        setAllowed(true);
        return;
      }

      const startupId = window.localStorage.getItem("active_startup_id");
      const workspaceFlag = window.localStorage.getItem("aiscoutx_active_workspace");
      const hasActive =
        Boolean(startupId && startupId !== "false") ||
        workspaceFlag === "true";

      if (hasActive) {
        window.location.replace("/dashboard/workspace");
        return;
      }
    } catch {
      // Storage blocked — stay on Discover rather than crash Safari.
    }

    setAllowed(true);
  }, []);

  if (!allowed) {
    return <div className="min-h-0 flex-1 bg-[#09090B]" aria-hidden />;
  }

  return <>{children}</>;
}
