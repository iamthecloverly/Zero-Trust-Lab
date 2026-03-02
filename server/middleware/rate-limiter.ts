import type { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Simple in-memory rate limiter
export function createRateLimiter(windowMs: number, max: number) {
  // Each limiter instance gets its own store so limits don't bleed across limiters
  const store: Record<string, RateLimitEntry> = {};
  // Maximum entries to store in memory to prevent unbounded growth
  const MAX_STORE_SIZE = 10000;

  // Cleanup old entries periodically; unref so it doesn't prevent process exit
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    const keysBefore = Object.keys(store).length;
    
    // Remove expired entries
    for (const key of Object.keys(store)) {
      if (now > store[key].resetTime) {
        delete store[key];
      }
    }
    
    // If store still exceeds max size, remove oldest entries
    const keysAfter = Object.keys(store).length;
    if (keysAfter > MAX_STORE_SIZE) {
      const sortedKeys = Object.keys(store).sort(
        (a, b) => store[a].resetTime - store[b].resetTime
      );
      const entriesToRemove = keysAfter - Math.floor(MAX_STORE_SIZE * 0.9);
      for (let i = 0; i < entriesToRemove; i++) {
        delete store[sortedKeys[i]];
      }
    }
  }, windowMs);

  if (typeof (cleanupTimer as NodeJS.Timeout).unref === "function") {
    (cleanupTimer as NodeJS.Timeout).unref();
  }

  return (req: Request, res: Response, next: NextFunction) => {
    // req.ip respects the `trust proxy` setting; fall back to x-forwarded-for only
    // when req.ip is absent, and take only the first (client) IP from the header.
    const forwarded = req.headers['x-forwarded-for']?.toString().split(',')[0].trim();
    const key = (req.ip || forwarded || 'unknown') as string;
    const now = Date.now();

    if (!store[key] || now > store[key].resetTime) {
      store[key] = {
        count: 1,
        resetTime: now + windowMs,
      };
      return next();
    }

    store[key].count++;

    // count increments before this check, so >= would reject the max-th request.
    // Use > so exactly `max` requests are allowed per window.
    if (store[key].count > max) {
      return res.status(429).json({
        error: 'Too many requests, please try again later',
      });
    }

    next();
  };
}
