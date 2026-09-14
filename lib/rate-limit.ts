const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Entries for keys that are only ever hit once (e.g. a one-off IP) would
// otherwise sit in the map forever, since the old code only overwrote an
// entry when the *same* key was seen again. Sweep expired entries on an
// interval so the map doesn't grow unbounded over the life of the process.
const SWEEP_INTERVAL_MS = 5 * 60 * 1000;
let sweepTimer: ReturnType<typeof setInterval> | null = null;

function ensureSweeping() {
  if (sweepTimer) return;
  sweepTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitMap) {
      if (now > entry.resetTime) rateLimitMap.delete(key);
    }
  }, SWEEP_INTERVAL_MS);
  // Don't let this timer keep the process alive on its own.
  sweepTimer.unref?.();
}

export function rateLimit(key: string, maxRequests: number = 60, windowMs: number = 60000) {
  ensureSweeping();
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: entry.resetTime };
  }

  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count, resetTime: entry.resetTime };
}
