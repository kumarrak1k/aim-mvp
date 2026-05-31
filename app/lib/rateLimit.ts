/**
 * Rate limiting backed by Upstash Redis when env vars are present,
 * falling back to a per-instance in-memory store for local dev.
 *
 * Production env vars required (add to Vercel + .env.local):
 *   UPSTASH_REDIS_REST_URL   — Upstash REST API endpoint
 *   UPSTASH_REDIS_REST_TOKEN — Upstash REST API token
 *
 * Without those vars the in-memory fallback is used. It works for a single
 * serverless instance but does NOT share state across instances — only for dev.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ---------------------------------------------------------------------------
// In-memory fallback (dev / no Upstash configured)
// ---------------------------------------------------------------------------

type RateLimitEntry = { count: number; resetAt: number };
const memStore = new Map<string, RateLimitEntry>();

function cleanupMem() {
  const now = Date.now();
  for (const [key, entry] of memStore.entries()) {
    if (now > entry.resetAt) memStore.delete(key);
  }
}

function inMemoryLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
): RateLimitResult {
  cleanupMem();
  const now = Date.now();
  const existing = memStore.get(key);

  if (!existing || now > existing.resetAt) {
    memStore.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { allowed: true };
  }

  if (existing.count >= maxRequests) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000),
    };
  }

  existing.count += 1;
  return { allowed: true };
}

// ---------------------------------------------------------------------------
// Upstash Redis limiter (production)
// ---------------------------------------------------------------------------

let redisClient: Redis | null = null;
const limiterCache = new Map<string, Ratelimit>();

function getRedisLimiter(
  maxRequests: number,
  windowSeconds: number
): Ratelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const cacheKey = `${maxRequests}:${windowSeconds}`;
  if (limiterCache.has(cacheKey)) return limiterCache.get(cacheKey)!;

  if (!redisClient) {
    redisClient = new Redis({ url, token });
  }

  const limiter = new Ratelimit({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(maxRequests, `${windowSeconds} s`),
    analytics: false,
    prefix: "aim:rl",
  });

  limiterCache.set(cacheKey, limiter);
  return limiter;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

/**
 * Check rate limit for a user+endpoint combination.
 * Uses Upstash Redis in production (shared across all Vercel instances).
 * Falls back to in-memory for local development.
 */
export async function checkRateLimit(
  userId: string,
  endpoint: string,
  maxRequests: number,
  windowSeconds: number,
  opts?: { failClosed?: boolean }
): Promise<RateLimitResult> {
  const key = `${userId}:${endpoint}`;
  const limiter = getRedisLimiter(maxRequests, windowSeconds);

  if (!limiter) {
    return inMemoryLimit(key, maxRequests, windowSeconds);
  }

  try {
    const { success, reset } = await limiter.limit(key);
    if (success) return { allowed: true };
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((reset - Date.now()) / 1000)),
    };
  } catch (err) {
    console.error("RATE LIMIT REDIS ERROR:", err);
    // For expensive (cost-bearing) endpoints, fail CLOSED so an Upstash outage
    // can't become an unbounded OpenAI-spend window. Cheap/UX limits fail open.
    if (opts?.failClosed) {
      return { allowed: false, retryAfterSeconds: 30 };
    }
    return { allowed: true };
  }
}

/**
 * Best-effort trusted client IP for per-IP limits on unauthenticated routes.
 * On Vercel, `x-vercel-forwarded-for` / `x-real-ip` are platform-injected and
 * client copies are stripped, so they can't be spoofed — unlike the left-most
 * value of `x-forwarded-for`. Falls back to XFF only for local dev.
 */
export function getClientIp(req: Request): string {
  const trusted =
    req.headers.get("x-vercel-forwarded-for") ?? req.headers.get("x-real-ip");
  if (trusted) return trusted.split(",")[0]?.trim() || "unknown";
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length) return parts[0];
  }
  return "unknown";
}
