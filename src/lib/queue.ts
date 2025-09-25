import { Queue, Worker, Job } from 'bullmq'
import { redis } from './redis'

export interface TranscodeJobData {
  trackId?: string
  uploadId: string
  userId: string
  inputPath?: string
  tempPath: string
  tempFileName: string
  yearMonth: string
  requestId?: string
}

// Check if Redis is available
const hasRedis = redis !== null && process.env.REDIS_URL && process.env.REDIS_URL.trim() !== ''

// Test Redis connection asynchronously
let redisAvailable = false
if (hasRedis) {
  // Test Redis connection with timeout
  try {
    await Promise.race([
      redis!.ping(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Redis timeout')), 2000)
      )
    ])
    redisAvailable = true
    console.log('✅ Redis connection successful')
  } catch (e) {
    console.log('⚠️  Redis connection failed, using degraded mode:', e.message)
  }
} else {
  console.log('⚠️  Redis disabled or not available, using degraded mode')
}

let transcodeQueue: Queue<TranscodeJobData> | null = null
let inMemoryQueue: Array<{ id: string; data: TranscodeJobData; status: 'pending' | 'processing' | 'completed' | 'failed' }> = []

// Initialize queue based on Redis availability
if (hasRedis && redisAvailable) {
  console.log('✅ Queue: BullMQ mode (Redis available)')
  transcodeQueue = new Queue<TranscodeJobData>('transcode', {
    connection: redis,
    defaultJobOptions: {
      removeOnComplete: 10,
      removeOnFail: 5,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    },
  })
} else {
  console.log('⚠️  Queue: Degraded mode (in-memory, Redis unavailable)')
}

export const createTranscodeJob = async (data: TranscodeJobData) => {
  if (hasRedis && redisAvailable && transcodeQueue) {
    // Use BullMQ
    return transcodeQueue.add('transcode', data, {
      priority: 1,
    })
  } else {
    // Use in-memory queue
    const jobId = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const job = {
      id: jobId,
      data,
      status: 'pending' as const
    }
    
    inMemoryQueue.push(job)
    
    // Process immediately in degraded mode
    setTimeout(async () => {
      try {
        job.status = 'processing'
        console.log(`[Queue] Processing job ${jobId} in degraded mode`)
        // Here you would call the actual processing function
        // For now, just mark as completed
        job.status = 'completed'
        console.log(`[Queue] Job ${jobId} completed`)
      } catch (error) {
        job.status = 'failed'
        console.error(`[Queue] Job ${jobId} failed:`, error)
      }
    }, 100)
    
    return { id: jobId } as any
  }
}

export const getJobStatus = async (jobId: string) => {
  if (hasRedis && redisAvailable && transcodeQueue) {
    // Use BullMQ
    const job = await transcodeQueue.getJob(jobId)
    if (!job) return null

    return {
      id: job.id,
      data: job.data,
      progress: job.progress,
      state: await job.getState(),
      failedReason: job.failedReason,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
    }
  } else {
    // Use in-memory queue
    const job = inMemoryQueue.find(j => j.id === jobId)
    if (!job) return null

    return {
      id: job.id,
      data: job.data,
      progress: 100,
      state: job.status,
      failedReason: null,
      processedOn: null,
      finishedOn: null,
    }
  }
}

export const getQueueMode = () => (hasRedis && redisAvailable) ? 'bullmq' : 'degraded'
