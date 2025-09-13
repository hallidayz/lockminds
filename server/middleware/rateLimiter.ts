import { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
}

interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  maxAttempts: number;  // Maximum attempts per window
  blockDuration?: number;  // Optional block duration in milliseconds
}

export class RateLimiter {
  private static attempts = new Map<string, RateLimitEntry>();
  
  // Default configurations for different endpoints
  private static readonly configs = {
    mfaChallenge: { windowMs: 5 * 60 * 1000, maxAttempts: 3, blockDuration: 15 * 60 * 1000 }, // 3 attempts per 5 min, block 15 min
    mfaApproval: { windowMs: 1 * 60 * 1000, maxAttempts: 5 }, // 5 attempts per minute
    tokenRegistration: { windowMs: 10 * 60 * 1000, maxAttempts: 10 }, // 10 attempts per 10 min
    default: { windowMs: 1 * 60 * 1000, maxAttempts: 20 } // 20 attempts per minute
  };

  static createRateLimiter(configKey: keyof typeof RateLimiter.configs = 'default') {
    const config = this.configs[configKey];
    
    return (req: Request, res: Response, next: NextFunction) => {
      const clientKey = this.getClientKey(req);
      const now = Date.now();
      
      const entry = this.attempts.get(clientKey);
      
      if (!entry) {
        // First attempt
        this.attempts.set(clientKey, {
          count: 1,
          firstAttempt: now,
          lastAttempt: now
        });
        return next();
      }
      
      // Check if we're still in the time window
      const timeSinceFirst = now - entry.firstAttempt;
      
      if (timeSinceFirst > config.windowMs) {
        // Reset window
        this.attempts.set(clientKey, {
          count: 1,
          firstAttempt: now,
          lastAttempt: now
        });
        return next();
      }
      
      // Within time window - check if blocked
      if (config.blockDuration) {
        const timeSinceBlock = now - entry.lastAttempt;
        if (entry.count >= config.maxAttempts && timeSinceBlock < config.blockDuration) {
          return res.status(429).json({
            error: 'Rate limit exceeded. Please try again later.',
            code: 'RATE_LIMITED',
            retryAfter: Math.ceil((config.blockDuration - timeSinceBlock) / 1000)
          });
        }
      }
      
      // Update attempt count
      entry.count++;
      entry.lastAttempt = now;
      
      if (entry.count > config.maxAttempts) {
        return res.status(429).json({
          error: 'Rate limit exceeded. Too many attempts.',
          code: 'RATE_LIMITED',
          retryAfter: Math.ceil(config.windowMs / 1000)
        });
      }
      
      next();
    };
  }
  
  private static getClientKey(req: Request): string {
    // Use multiple identifiers for better rate limiting
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    const userId = (req as any).user?.userId || 'anonymous';
    
    return `${ip}:${userId}:${Buffer.from(userAgent).toString('base64').slice(0, 16)}`;
  }
  
  // Cleanup old entries periodically
  static cleanup(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    for (const [key, entry] of this.attempts.entries()) {
      if (now - entry.lastAttempt > maxAge) {
        this.attempts.delete(key);
      }
    }
  }
  
  // Force clear an entry (for testing or admin purposes)
  static clearEntry(clientKey: string): void {
    this.attempts.delete(clientKey);
  }
}

// Cleanup old entries every hour
setInterval(() => {
  RateLimiter.cleanup();
}, 60 * 60 * 1000);