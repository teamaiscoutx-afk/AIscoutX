"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { CopyToast } from "@/components/dashboard/copy-toast";
import { cn } from "@/lib/utils";

type TrendingSectionProps = {
  activeKeyword: string | null;
  onKeywordChange: (keyword: string | null) => void;
  trendingKeywords: string[];
  viralHooks: string[];
};

export function TrendingSection({
  activeKeyword,
  onKeywordChange,
  trendingKeywords,
  viralHooks,
}: TrendingSectionProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showCopiedToast, setShowCopiedToast] = useState(false);

  async function copyHook(index: number, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setShowCopiedToast(true);
      window.setTimeout(() => {
        setCopiedIndex(null);
        setShowCopiedToast(false);
      }, 2000);
    } catch {
      setShowCopiedToast(true);
      window.setTimeout(() => setShowCopiedToast(false), 2000);
    }
  }

  function toggleKeyword(keyword: string) {
    if (activeKeyword === keyword) {
      onKeywordChange(null);
      return;
    }
    onKeywordChange(keyword);
  }

  return (
    <>
      <CopyToast visible={showCopiedToast} />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass-panel rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Trending keywords
            </p>
            {activeKeyword && (
              <button
                type="button"
                onClick={() => onKeywordChange(null)}
                className="text-[10px] font-medium text-zinc-500 underline-offset-2 hover:text-[#deff9a] hover:underline"
              >
                Clear filter
              </button>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {trendingKeywords.map((keyword) => (
              <button
                key={keyword}
                type="button"
                onClick={() => toggleKeyword(keyword)}
                className={cn(
                  "cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200",
                  activeKeyword === keyword
                    ? "border-[#deff9a]/40 bg-[#deff9a]/15 text-[#deff9a] shadow-[0_0_16px_rgba(222,255,154,0.12)]"
                    : "border-white/10 bg-white/[0.03] text-zinc-400 hover:border-[#deff9a]/25 hover:text-white"
                )}
              >
                {keyword}
              </button>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-zinc-600">
            Click a keyword to filter the opportunities table below.
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-4 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Viral hooks
          </p>
          <ul className="mt-3 space-y-2">
            {viralHooks.map((hook, index) => (
              <li
                key={hook}
                className="group flex items-start gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 transition-colors hover:border-white/[0.1]"
              >
                <p className="flex-1 text-xs leading-relaxed text-zinc-400 group-hover:text-zinc-300">
                  &ldquo;{hook}&rdquo;
                </p>
                <button
                  type="button"
                  onClick={() => copyHook(index, hook)}
                  aria-label={copiedIndex === index ? "Copied" : "Copy hook"}
                  className={cn(
                    "shrink-0 cursor-pointer rounded-lg border p-1.5 transition-all duration-200",
                    copiedIndex === index
                      ? "border-[#deff9a]/40 bg-[#deff9a]/15 text-[#deff9a]"
                      : "border-white/10 text-zinc-500 hover:border-[#deff9a]/30 hover:text-[#deff9a]"
                  )}
                >
                  {copiedIndex === index ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
