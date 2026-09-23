import type { RequestHandler } from 'express';

type Bucket = { count: number; resetAt: number };

export function rateLimiter(options: { windowMs: number; max: number; message: string }): RequestHandler {
  const buckets = new Map<string, Bucket>();

  return (req, res, next) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || now >= bucket.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + options.windowMs });
      return next();
    }

    if (bucket.count >= options.max) {
      const retryAfterSeconds = Math.ceil((bucket.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retryAfterSeconds));
      return res.status(429).json({ error: options.message });
    }

    bucket.count += 1;
    next();
  };
}
