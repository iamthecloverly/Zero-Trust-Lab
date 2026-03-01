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
  setInterval(() => {
    const now = Date.now();
    for (const key of Object.keys(store)) {
      if (now > store[key].resetTime) {
        delete store[key];
      }
    }
  }, windowMs).unref();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || 'unknown';
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
