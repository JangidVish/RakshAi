// Lightweight in-memory fixed-window rate limiter.
//
// Suitable for a single-instance / MVP deployment. NOTE: state lives in the
// process, so it does NOT share counters across multiple serverless instances
// or a horizontally-scaled cluster. For production behind Vercel/multiple pods,
// swap the store for Upstash Redis (or similar) keeping the same interface.

type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();

// Opportunistic cleanup so the Map doesn't grow unbounded. Runs at most once
// per window on access; cheap for MVP traffic.
let lastSweep = 0;
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  store.forEach((bucket, key) => {
    if (bucket.resetAt <= now) store.delete(key);
  });
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  /** Seconds until the window resets — use for the Retry-After header. */
  retryAfter: number;
};

/**
 * Fixed-window limiter.
 * @param key    Caller-scoped identity (e.g. `register:1.2.3.4`).
 * @param limit  Max requests allowed per window.
 * @param windowMs Window length in milliseconds.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now()
): RateLimitResult {
  sweep(now);

  const bucket = store.get(key);

  if (!bucket || bucket.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfter: 0 };
  }

  if (bucket.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  bucket.count += 1;
  return {
    allowed: true,
    remaining: limit - bucket.count,
    retryAfter: 0,
  };
}

/** Extract a best-effort client IP from request headers. */
export function clientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return headers.get("x-real-ip")?.trim() || "unknown";
}
