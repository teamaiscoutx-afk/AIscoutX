"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { hasClientActiveWorkspace } from "@/lib/workspace/active-workspace";

export function DiscoverRouteGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const explicitDiscover = searchParams.get("intent") === "discover";
    if (explicitDiscover) {
      setAllowed(true);
      return;
    }

    if (hasClientActiveWorkspace()) {
      router.replace("/dashboard/workspace");
      return;
    }

    setAllowed(true);
  }, [router, searchParams]);

  if (!allowed) {
    return <div className="min-h-0 flex-1 bg-[#09090B]" aria-hidden />;
  }

  return <>{children}</>;
}
