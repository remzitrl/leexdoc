import { redis } from './redis'

export interface RateLimitConfig {
  windowMs: number
  maxAttempts: number
  keyGenerator: (req: Request) => string
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

const hasRedis = process.env.REDIS_URL && process.env.REDIS_URL.trim() !== ''

const inMemoryRateLimit = new Map<string, { attempts: number[]; windowMs: number; maxAttempts: number }>()

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
    return { success: true, remainingAttempts: maxAttempts }
  }

  try {
    // Get current attempts in the window
    const attempts = await redis.zrangebyscore(key, windowStart, '+inf')
    
    if (attempts.length >= maxAttempts) {
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

    await redis.zadd(key, now, `${now}-${Math.random()}`)
    
    await redis.expire(key, Math.ceil(windowMs / 1000))

    return {
      success: true,
      remainingAttempts: maxAttempts - attempts.length - 1,
    }
  } catch (error) {
    return {
      success: true,
      remainingAttempts: maxAttempts,
    }
  }
}

export async function cleanupExpiredAttempts(key: string, windowMs: number) {
  const now = Date.now()
  const windowStart = now - windowMs
  
  try {
    await redis.zremrangebyscore(key, '-inf', windowStart)
  } catch (error) {
  }
}

export const RATE_LIMITS = {
  login: { 
    windowMs: 15 * 60 * 1000, 
    maxAttempts: 5,
    keyGenerator: (req: Request) => `login:${getClientIP(req)}`
  },
  register: { 
    windowMs: 60 * 60 * 1000, 
    maxAttempts: 3,
    keyGenerator: (req: Request) => `register:${getClientIP(req)}`
  },
  passwordReset: { 
    windowMs: 60 * 60 * 1000, 
    maxAttempts: 3,
    keyGenerator: (req: Request) => `passwordReset:${getClientIP(req)}`
  },
  
  fileUpload: { 
    windowMs: 10 * 60 * 1000, 
    maxAttempts: 10,
    keyGenerator: (req: Request) => `fileUpload:${getClientIP(req)}`
  },
  urlUpload: { 
    windowMs: 5 * 60 * 1000, 
    maxAttempts: 5,
    keyGenerator: (req: Request) => `urlUpload:${getClientIP(req)}`
  },
  youtubeUpload: { 
    windowMs: 60 * 1000, 
    maxAttempts: 10,
    keyGenerator: (req: Request) => `youtubeUpload:${getClientIP(req)}`
  },
  spotifyUpload: { 
    windowMs: 60 * 1000, 
    maxAttempts: 10,
    keyGenerator: (req: Request) => `spotifyUpload:${getClientIP(req)}`
  },
  
  createPlaylist: { windowMs: 60 * 1000, maxAttempts: 20 },
  updatePlaylist: { windowMs: 60 * 1000, maxAttempts: 30 },
  deletePlaylist: { windowMs: 60 * 1000, maxAttempts: 10 },
  addTrackToPlaylist: { windowMs: 60 * 1000, maxAttempts: 50 },
  removeTrackFromPlaylist: { windowMs: 60 * 1000, maxAttempts: 50 },
  reorderPlaylist: { windowMs: 60 * 1000, maxAttempts: 20 },
  
  likeTrack: { windowMs: 60 * 1000, maxAttempts: 100 },
  unlikeTrack: { windowMs: 60 * 1000, maxAttempts: 100 },
  downloadTrack: { windowMs: 60 * 1000, maxAttempts: 20 },
} as const

export function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         req.headers.get('x-real-ip') ||
         'unknown'
}
