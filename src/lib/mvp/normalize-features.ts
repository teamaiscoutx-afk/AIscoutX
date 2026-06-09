export type NormalizedFeatureMatrix = {
  mustHave: string[];
  niceToHave: string[];
  futureFeatures: string[];
};

function coerceStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && "name" in item) {
          return String((item as { name: string }).name);
        }
        return typeof item === "object" ? JSON.stringify(item) : String(item);
      })
      .filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) return [value];
  return [];
}

/** Normalize feature data from various backend / LLM JSON shapes. */
export function normalizeFeatureMatrix(input: unknown): NormalizedFeatureMatrix {
  const empty: NormalizedFeatureMatrix = {
    mustHave: [],
    niceToHave: [],
    futureFeatures: [],
  };

  if (!input || typeof input !== "object") return empty;

  const obj = input as Record<string, unknown>;

  if ("features" in obj && obj.features && typeof obj.features === "object") {
    return normalizeFeatureMatrix(obj.features);
  }

  const mustHave = coerceStringArray(obj.mustHave);
  const niceToHave = coerceStringArray(obj.niceToHave);
  const futureFeatures = coerceStringArray(
    obj.futureFeatures ?? obj.future ?? obj.future_features
  );

  if (mustHave.length || niceToHave.length || futureFeatures.length) {
    return { mustHave, niceToHave, futureFeatures };
  }

  return empty;
}

/** Flatten tier or roadmap feature values into a string list. */
export function listFeatureStrings(features: unknown): string[] {
  if (Array.isArray(features)) {
    return features.map((item) =>
      typeof item === "string" ? item : JSON.stringify(item)
    );
  }
  const matrix = normalizeFeatureMatrix(features);
  return [
    ...matrix.mustHave,
    ...matrix.niceToHave,
    ...matrix.futureFeatures,
  ];
}
