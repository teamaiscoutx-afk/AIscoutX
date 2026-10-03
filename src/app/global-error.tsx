"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[AIscoutX] global error", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-[#09090B] px-6 text-center text-white">
        <div className="space-y-3">
          <p className="text-lg font-semibold">We hit a snag loading the app.</p>
          <p className="text-sm text-zinc-400">Refresh the page. Your workspace is still saved.</p>
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-lg bg-[#A3E635] px-4 py-2 text-sm font-semibold text-zinc-950"
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
