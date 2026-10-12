/*
 * ponytail: in-process fixed-window counter. Good enough for a single Next
 * instance; swap the Map for Redis/Upstash the day this runs on more than one
 * node, because each node would otherwise keep its own allowance.
 */
const buckets = new Map();

const PRUNE_EVERY = 500;
let callsSincePrune = 0;

const prune = (now) => {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
};

export const clientIp = (req) =>
  req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
  req.headers.get("x-real-ip") ||
  "unknown";

/**
 * @returns {{ ok: boolean, retryAfter: number }}
 */
export const rateLimit = (key, { limit, windowMs }) => {
  const now = Date.now();

  if (++callsSincePrune >= PRUNE_EVERY) {
    callsSincePrune = 0;
    prune(now);
  }

  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }

  bucket.count += 1;

  if (bucket.count > limit) {
    return { ok: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  return { ok: true, retryAfter: 0 };
};
