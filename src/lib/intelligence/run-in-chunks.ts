export type RunInChunksOptions = {
  /** Milliseconds to wait after each batch (rate-limit protection). */
  delayBetweenBatchesMs?: number;
  /** Abort remaining work when this budget is exceeded. */
  budgetMs?: number;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runInChunks<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R | null>,
  options: RunInChunksOptions = {}
): Promise<R[]> {
  const results: R[] = [];
  const limit = Math.max(1, concurrency);
  const startedAt = Date.now();
  const { delayBetweenBatchesMs = 0, budgetMs } = options;

  for (let offset = 0; offset < items.length; offset += limit) {
    if (budgetMs !== undefined && Date.now() - startedAt >= budgetMs) {
      console.warn(
        `[runInChunks] budget ${budgetMs}ms exceeded after ${results.length} results`
      );
      break;
    }

    const chunk = items.slice(offset, offset + limit);
    const settled = await Promise.all(
      chunk.map((item, index) => worker(item, offset + index))
    );
    for (const value of settled) {
      if (value !== null) results.push(value);
    }

    const hasMore = offset + limit < items.length;
    if (hasMore && delayBetweenBatchesMs > 0) {
      await sleep(delayBetweenBatchesMs);
    }
  }

  return results;
}

/** Reject with `fallback` when `promise` does not settle within `ms`. */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  fallback: T
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => {
      setTimeout(() => resolve(fallback), ms);
    }),
  ]);
}
