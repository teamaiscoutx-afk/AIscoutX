"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[AIscoutX] dashboard error", error);
  }, [error]);

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-sm font-semibold text-white">This screen couldn&apos;t load.</p>
      <p className="text-sm text-zinc-400">Try again — we didn&apos;t lose your active startup.</p>
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-lg bg-[#A3E635] px-4 py-2 text-xs font-semibold text-zinc-950"
      >
        Try again
      </button>
    </div>
  );
}
