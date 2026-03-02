import type { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Simple in-memory rate limiter
export function createRateLimiter(windowMs: number, max: number) {
  // Each limiter instance gets its own store so limits don't bleed across limiters
  const store: Record<string, RateLimitEntry> = {};

  // Cleanup old entries periodically; unref so it doesn't prevent process exit
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const key of Object.keys(store)) {
      if (now > store[key].resetTime) {
        delete store[key];
      }
    }
  }, windowMs);

  if (typeof (cleanupTimer as NodeJS.Timeout).unref === "function") {
    (cleanupTimer as NodeJS.Timeout).unref();
  }

  return (req: Request, res: Response, next: NextFunction) => {
    // Safely extract IP, with fallback to session ID for proxied/unknown cases
    const key = (req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown') as string;
    const now = Date.now();

    if (!store[key] || now > store[key].resetTime) {
      store[key] = {
        count: 1,
        resetTime: now + windowMs,
      };
      return next();
    }

    store[key].count++;

    if (store[key].count >= max) {
      return res.status(429).json({
        error: 'Too many requests, please try again later',
      });
    }

    next();
  };
}
