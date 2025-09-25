import Redis from 'ioredis'
import { ENV } from './env'

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined
}

// Check if Redis is disabled or URL is not provided
const isRedisDisabled = process.env.REDIS_DISABLED === 'true' || !ENV.REDIS_URL || ENV.REDIS_URL.trim() === ''

export const redis = isRedisDisabled 
  ? null 
  : globalForRedis.redis ?? new Redis(ENV.REDIS_URL!, {
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
    })

if (ENV.NODE_ENV !== 'production' && !isRedisDisabled) globalForRedis.redis = redis

export default redis
