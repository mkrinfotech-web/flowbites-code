/**
 * Lightweight in-memory rate limiter for guest endpoints.
 * Soft retail: enough to blunt casual abuse; not a hard security boundary.
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function rateLimit(
  key: string,
  opts: { limit?: number; windowMs?: number } = {},
): { ok: true } | { ok: false; retryAfterSec: number } {
  const limit = opts.limit ?? 8;
  const windowMs = opts.windowMs ?? 60_000;
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now >= existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (existing.count >= limit) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return { ok: true };
}

/** Best-effort client key from request headers (behind proxies). */
export function clientKeyFromHeaders(headers: Headers, prefix: string): string {
  const forwarded = headers.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown";
  return `${prefix}:${ip}`;
}
