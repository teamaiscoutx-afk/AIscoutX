"use client";

import { cn } from "@/lib/utils";

type IntelligenceSkeletonProps = {
  rows?: number;
  className?: string;
};

function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-gradient-to-r from-white/[0.04] via-white/[0.08] to-white/[0.04] bg-[length:200%_100%]",
        className
      )}
    />
  );
}

export function IntelligenceSkeleton({
  rows = 4,
  className,
}: IntelligenceSkeletonProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="glass-panel rounded-2xl border border-white/[0.06] p-5"
        >
          <Shimmer className="h-3 w-24" />
          <Shimmer className="mt-3 h-5 w-3/4" />
          <Shimmer className="mt-2 h-4 w-full" />
          <Shimmer className="mt-2 h-4 w-5/6" />
        </div>
      ))}
    </div>
  );
}

export function DeepDiveGridSkeleton() {
  return (
    <div className="mt-8 space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass-panel rounded-2xl p-5">
          <Shimmer className="h-3 w-28" />
          <div className="mt-4 space-y-3">
            <Shimmer className="h-16 w-full" />
            <Shimmer className="h-16 w-full" />
            <Shimmer className="h-16 w-full" />
          </div>
        </div>
        <div className="glass-panel rounded-2xl p-5">
          <Shimmer className="h-3 w-36" />
          <div className="mt-4 space-y-2">
            <Shimmer className="h-4 w-full" />
            <Shimmer className="h-4 w-full" />
            <Shimmer className="h-4 w-4/5" />
          </div>
        </div>
      </div>
      <div className="glass-panel rounded-2xl p-5">
        <Shimmer className="h-3 w-32" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Shimmer className="h-20 w-full" />
          <Shimmer className="h-20 w-full" />
          <Shimmer className="h-20 w-full" />
          <Shimmer className="h-20 w-full" />
        </div>
      </div>
    </div>
  );
}
