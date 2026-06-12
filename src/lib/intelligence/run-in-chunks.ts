export async function runInChunks<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R | null>
): Promise<R[]> {
  const results: R[] = [];
  const limit = Math.max(1, concurrency);

  for (let offset = 0; offset < items.length; offset += limit) {
    const chunk = items.slice(offset, offset + limit);
    const settled = await Promise.all(
      chunk.map((item, index) => worker(item, offset + index))
    );
    for (const value of settled) {
      if (value !== null) results.push(value);
    }
  }

  return results;
}
