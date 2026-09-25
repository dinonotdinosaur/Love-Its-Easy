/**
 * Ограничитель частоты запросов в памяти процесса (скользящее окно).
 *
 * Хватает, пока приложение — один процесс на одном VPS (AGENTS.md §2). При
 * нескольких инстансах у каждого будет свой счётчик — тогда переносить
 * в общее хранилище (Postgres/Redis). Счётчики сбрасываются при рестарте.
 */
export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }) {
  const hits = new Map<string, number[]>();
  let lastSweep = 0;

  // Без чистки Map рос бы на каждый новый IP бесконечно.
  function sweep(now: number) {
    if (now - lastSweep < windowMs) return;
    lastSweep = now;
    for (const [key, times] of hits) {
      if (times[times.length - 1] <= now - windowMs) hits.delete(key);
    }
  }

  return {
    /** Засчитывает попытку; `ok: false` — лимит исчерпан, попытка не засчитана. */
    check(key: string, now = Date.now()): { ok: true } | { ok: false; retryAfterSeconds: number } {
      sweep(now);
      const recent = (hits.get(key) ?? []).filter((t) => t > now - windowMs);
      if (recent.length >= limit) {
        hits.set(key, recent);
        return { ok: false, retryAfterSeconds: Math.ceil((recent[0] + windowMs - now) / 1000) };
      }
      recent.push(now);
      hits.set(key, recent);
      return { ok: true };
    },
  };
}
