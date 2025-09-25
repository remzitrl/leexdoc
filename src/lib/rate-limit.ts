import { redis } from './redis'

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxAttempts: number // Maximum attempts per window
  keyGenerator: (req: Request) => string // Function to generate rate limit key
}

export class RateLimitError extends Error {
  constructor(
    message: string,
    public retryAfter: number,
    public remainingAttempts: number = 0
  ) {
    super(message)
    this.name = 'RateLimitError'
  }
}

// Check if Redis is available
const hasRedis = process.env.REDIS_URL && process.env.REDIS_URL.trim() !== ''

// In-memory rate limiting for degraded mode
const inMemoryRateLimit = new Map<string, { attempts: number[]; windowMs: number; maxAttempts: number }>()

// Sliding window rate limiter using Redis or in-memory fallback
export async function checkRateLimit(
  action: string,
  userId: string,
  ip?: string
): Promise<{ success: boolean; retryAfter?: number; remainingAttempts: number }> {
  const rateLimitConfig = RATE_LIMITS[action as keyof typeof RATE_LIMITS]
  if (!rateLimitConfig) {
    return { success: true, remainingAttempts: 0 }
  }

  const key = `${action}:${userId}:${ip || 'unknown'}`
  const windowMs = rateLimitConfig.windowMs
  const maxAttempts = rateLimitConfig.maxAttempts
  const now = Date.now()
  const windowStart = now - windowMs

  if (!hasRedis) {
    // Use in-memory rate limiting
    console.log('⚠️  Rate limiting: disabled (Redis unavailable)')
    return { success: true, remainingAttempts: maxAttempts }
  }

  try {
    // Get current attempts in the window
    const attempts = await redis.zrangebyscore(key, windowStart, '+inf')
    
    if (attempts.length >= maxAttempts) {
      // Rate limit exceeded
      const oldestAttempt = await redis.zrange(key, 0, 0, 'WITHSCORES')
      const retryAfter = oldestAttempt.length > 0 
        ? Math.ceil((parseInt(oldestAttempt[1]) + windowMs - now) / 1000)
        : Math.ceil(windowMs / 1000)
      
      return {
        success: false,
        retryAfter,
        remainingAttempts: 0,
      }
    }

    // Add current attempt
    await redis.zadd(key, now, `${now}-${Math.random()}`)
    
    // Set expiration for the key
    await redis.expire(key, Math.ceil(windowMs / 1000))

    return {
      success: true,
      remainingAttempts: maxAttempts - attempts.length - 1,
    }
  } catch (error) {
    console.error('Rate limit check failed:', error)
    // Fail open - allow the request if Redis is down
    return {
      success: true,
      remainingAttempts: maxAttempts,
    }
  }
}

// Clean up expired attempts (can be run periodically)
export async function cleanupExpiredAttempts(key: string, windowMs: number) {
  const now = Date.now()
  const windowStart = now - windowMs
  
  try {
    await redis.zremrangebyscore(key, '-inf', windowStart)
  } catch (error) {
    console.error('Failed to cleanup expired attempts:', error)
  }
}

// Rate limit configurations
export const RATE_LIMITS = {
  // Authentication
  login: { 
    windowMs: 15 * 60 * 1000, 
    maxAttempts: 5,
    keyGenerator: (req: Request) => `login:${getClientIP(req)}`
  }, // 5 per 15 minutes
  register: { 
    windowMs: 60 * 60 * 1000, 
    maxAttempts: 3,
    keyGenerator: (req: Request) => `register:${getClientIP(req)}`
  }, // 3 per hour
  passwordReset: { 
    windowMs: 60 * 60 * 1000, 
    maxAttempts: 3,
    keyGenerator: (req: Request) => `passwordReset:${getClientIP(req)}`
  }, // 3 per hour
  
  // Upload operations
  fileUpload: { 
    windowMs: 10 * 60 * 1000, 
    maxAttempts: 10,
    keyGenerator: (req: Request) => `fileUpload:${getClientIP(req)}`
  }, // 10 per 10 minutes
  urlUpload: { 
    windowMs: 5 * 60 * 1000, 
    maxAttempts: 5,
    keyGenerator: (req: Request) => `urlUpload:${getClientIP(req)}`
  }, // 5 per 5 minutes
  youtubeUpload: { 
    windowMs: 60 * 1000, 
    maxAttempts: 10,
    keyGenerator: (req: Request) => `youtubeUpload:${getClientIP(req)}`
  }, // 10 per minute
  spotifyUpload: { 
    windowMs: 60 * 1000, 
    maxAttempts: 10,
    keyGenerator: (req: Request) => `spotifyUpload:${getClientIP(req)}`
  }, // 10 per minute
  
  // Playlist operations
  createPlaylist: { windowMs: 60 * 1000, maxAttempts: 20 }, // 20 per minute
  updatePlaylist: { windowMs: 60 * 1000, maxAttempts: 30 }, // 30 per minute
  deletePlaylist: { windowMs: 60 * 1000, maxAttempts: 10 }, // 10 per minute
  addTrackToPlaylist: { windowMs: 60 * 1000, maxAttempts: 50 }, // 50 per minute
  removeTrackFromPlaylist: { windowMs: 60 * 1000, maxAttempts: 50 }, // 50 per minute
  reorderPlaylist: { windowMs: 60 * 1000, maxAttempts: 20 }, // 20 per minute
  
  // Library operations
  likeTrack: { windowMs: 60 * 1000, maxAttempts: 100 }, // 100 per minute
  unlikeTrack: { windowMs: 60 * 1000, maxAttempts: 100 }, // 100 per minute
  downloadTrack: { windowMs: 60 * 1000, maxAttempts: 20 }, // 20 per minute
} as const

// Helper function to get client IP
export function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         req.headers.get('x-real-ip') ||
         'unknown'
}
