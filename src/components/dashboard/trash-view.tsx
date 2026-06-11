"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileStack, FolderKanban, RotateCcw, Trash2, X } from "lucide-react";

import {
  permanentDeleteTrashItem,
  recoverTrashItem,
  type TrashItem,
} from "@/app/actions/trash";
import { useUpgradeModal } from "@/components/billing/upgrade-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TrashViewProps = {
  initialItems: TrashItem[];
};

function formatDeletedDate(deletedAt: string | null): string {
  if (!deletedAt) return "Recently";
  return new Date(deletedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function TrashView({ initialItems }: TrashViewProps) {
  const router = useRouter();
  const { openUpgradeModal } = useUpgradeModal();
  const [items, setItems] = useState<TrashItem[]>(initialItems);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function removeFromList(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  function handleRecover(item: TrashItem) {
    setError(null);
    setBusyId(item.id);
    startTransition(async () => {
      const result = await recoverTrashItem(item.kind, item.id);
      setBusyId(null);
      if (result.ok) {
        removeFromList(item.id);
        router.refresh();
        return;
      }
      if (result.code === "UPGRADE_REQUIRED") {
        openUpgradeModal(result.error);
        return;
      }
      setError(result.error ?? "Could not recover this item.");
    });
  }

  function handlePermanentDelete(item: TrashItem) {
    setError(null);
    setBusyId(item.id);
    startTransition(async () => {
      const result = await permanentDeleteTrashItem(item.kind, item.id);
      setBusyId(null);
      if (result.ok) {
        removeFromList(item.id);
        router.refresh();
        return;
      }
      setError(result.error ?? "Could not delete this item.");
    });
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03]">
          <Trash2 className="h-5 w-5 text-zinc-400" strokeWidth={1.5} />
        </span>
        <div>
          <h1 className="text-xl font-semibold text-white">Trash / Bin</h1>
          <p className="text-xs text-zinc-500">
            Deleted projects and blueprints. Pro members can recover items for
            30 days.
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-red-500/25 bg-red-500/[0.07] px-4 py-3 text-xs text-red-300">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="shrink-0 text-red-400 hover:text-red-200"
            aria-label="Dismiss error"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="card-premium mt-8 flex flex-col items-center rounded-2xl px-6 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03]">
            <Trash2 className="h-6 w-6 text-zinc-600" strokeWidth={1.5} />
          </span>
          <h2 className="mt-4 text-sm font-medium text-white">
            Trash is empty
          </h2>
          <p className="mt-1 max-w-sm text-xs leading-relaxed text-zinc-500">
            Deleted projects and blueprints land here. Nothing to recover right
            now.
          </p>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {items.map((item) => {
            const busy = busyId === item.id;
            const expired = item.daysLeft <= 0;
            const Icon = item.kind === "project" ? FolderKanban : FileStack;

            return (
              <li
                key={`${item.kind}-${item.id}`}
                className="card-premium flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center sm:gap-4"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03]">
                  <Icon className="h-4.5 w-4.5 text-zinc-400" strokeWidth={1.5} />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-medium text-white">
                      {item.title}
                    </p>
                    <Badge
                      variant="outline"
                      className="border-white/[0.1] bg-white/[0.03] text-[10px] uppercase tracking-wider text-zinc-500"
                    >
                      {item.kind === "project" ? "Project" : "Blueprint"}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-[11px] text-zinc-600">
                    Deleted {formatDeletedDate(item.deletedAt)} ·{" "}
                    <span
                      className={cn(
                        expired ? "text-red-400/80" : "text-zinc-500"
                      )}
                    >
                      {expired
                        ? "Recovery window expired"
                        : `${item.daysLeft} day${item.daysLeft === 1 ? "" : "s"} left to recover`}
                    </span>
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={busy || expired}
                    onClick={() => handleRecover(item)}
                    className="border-[#deff9a]/25 bg-[#deff9a]/[0.06] text-xs text-[#deff9a] hover:bg-[#deff9a]/15 hover:text-[#deff9a]"
                  >
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                    Recover
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => handlePermanentDelete(item)}
                    className="border-red-500/25 bg-red-500/[0.05] text-xs text-red-400 hover:bg-red-500/15 hover:text-red-300"
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Delete forever
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
