"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Rocket, Sparkles } from "lucide-react";

import { generateVenturePack } from "@/app/actions/generation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function BuildInput() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await generateVenturePack(query);
      if (!result.ok) {
        setError(result.error ?? "Generation failed");
        return;
      }
      router.push("/dashboard/analyze");
      router.refresh();
    });
  }

  return (
    <div className="glass-panel relative overflow-hidden rounded-2xl border-[#deff9a]/20 p-6 sm:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(222,255,154,0.08),transparent_70%)]"
      />
      <div className="relative">
        <div className="flex items-center gap-2 text-[#deff9a]">
          <Sparkles className="h-4 w-4" strokeWidth={1.5} />
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em]">
            10-minute blueprint engine
          </p>
        </div>
        <h2 className="mt-3 text-xl font-semibold text-white sm:text-2xl">
          What are you building today?
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          From startup idea to startup blueprint in 10 minutes — Analyze, Blueprint,
          and Launch packs generated in one pipeline.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='e.g. "AI SaaS for creators"'
            disabled={isPending}
            className="h-11 flex-1 border-white/[0.1] bg-white/[0.04] text-zinc-200 placeholder:text-zinc-600"
          />
          <Button
            type="submit"
            disabled={isPending || !query.trim()}
            className="h-11 bg-[#deff9a] px-6 text-[#030308] hover:bg-[#deff9a]/90"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Rocket className="h-4 w-4" />
                Generate Blueprint
              </>
            )}
          </Button>
        </form>

        {error && (
          <p className="mt-3 text-sm text-orange-400" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
