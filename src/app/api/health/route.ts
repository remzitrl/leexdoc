import { NextResponse } from "next/server";
import { db } from '@/lib/db'
import { redis } from '@/lib/redis'
import { storage } from '@/lib/storage'
import { getQueueMode } from '@/lib/queue'

export const dynamic = "force-dynamic";

const startTime = Date.now()

// Check service with timeout
const checkService = async (name: string, checkFn: () => Promise<any>, timeoutMs = 1000) => {
  try {
    await Promise.race([
      checkFn(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`${name} timeout after ${timeoutMs}ms`)), timeoutMs)
      )
    ]);
    return 'ok';
  } catch (error) {
    console.error(`[${name}] Health check failed:`, error);
    return 'fail';
  }
};

export async function GET() {
  const checks = {
    db: 'fail',
    redis: 'degraded', 
    queue: 'degraded',
    storage: 'fail',
    uptimeMs: Date.now() - startTime
  };

  // Check database (required)
  const dbStatus = await checkService('db', () => db.$queryRaw`SELECT 1`);
  checks.db = dbStatus;

  // Check Redis (optional)
  const hasRedis = process.env.REDIS_URL && process.env.REDIS_URL.trim() !== '';
  if (hasRedis) {
    const redisStatus = await checkService('redis', () => redis.ping());
    checks.redis = redisStatus === 'ok' ? 'ok' : 'degraded';
  } else {
    checks.redis = 'degraded';
  }

  // Check queue (depends on Redis)
  const queueMode = getQueueMode();
  checks.queue = queueMode === 'bullmq' ? 'ok' : 'degraded';

  // Check storage (optional)
  const storageStatus = await checkService('storage', () => storage.headObject('health-check'));
  checks.storage = storageStatus;

  // Health is OK if DB is OK and Redis is either OK or degraded
  const allOk = checks.db === 'ok' && (checks.redis === 'ok' || checks.redis === 'degraded');
  
  return NextResponse.json({
    ok: allOk,
    checks,
    t: Date.now()
  }, { status: allOk ? 200 : 503 });
}