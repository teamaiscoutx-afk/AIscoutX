"use client";

import { normalizeFeatureMatrix } from "@/lib/mvp/normalize-features";

type FeatureMatrixGridProps = {
  features: unknown;
  className?: string;
};

function FeatureColumn({
  title,
  emoji,
  items,
  borderClass,
  titleClass,
  bgClass,
}: {
  title: string;
  emoji: string;
  items: string[];
  borderClass: string;
  titleClass: string;
  bgClass: string;
}) {
  return (
    <div className={`rounded-xl border p-4 ${borderClass} ${bgClass}`}>
      <h4 className={`mb-3 flex items-center gap-2 font-bold ${titleClass}`}>
        <span aria-hidden>{emoji}</span>
        {title}
      </h4>
      <ul className="space-y-2 text-sm text-zinc-400">
        {items.length > 0 ? (
          items.map((feature, index) => (
            <li key={`${title}-${index}`}>• {feature}</li>
          ))
        ) : (
          <li className="text-zinc-600">No data</li>
        )}
      </ul>
    </div>
  );
}

export function FeatureMatrixGrid({ features, className }: FeatureMatrixGridProps) {
  if (!features || typeof features !== "object") {
    return (
      <p className="text-sm text-zinc-500">
        {String(features ?? "No features data generated.")}
      </p>
    );
  }

  const matrix = normalizeFeatureMatrix(features);

  return (
    <div
      className={`grid grid-cols-1 gap-6 md:grid-cols-3 ${className ?? ""}`}
    >
      <FeatureColumn
        title="Must Have"
        emoji="🔥"
        items={matrix.mustHave}
        borderClass="border-emerald-500/20"
        titleClass="text-emerald-400"
        bgClass="bg-emerald-500/5"
      />
      <FeatureColumn
        title="Nice To Have"
        emoji="✨"
        items={matrix.niceToHave}
        borderClass="border-blue-500/20"
        titleClass="text-blue-400"
        bgClass="bg-blue-500/5"
      />
      <FeatureColumn
        title="Future Features"
        emoji="🚀"
        items={matrix.futureFeatures}
        borderClass="border-purple-500/20"
        titleClass="text-purple-400"
        bgClass="bg-purple-500/5"
      />
    </div>
  );
}
