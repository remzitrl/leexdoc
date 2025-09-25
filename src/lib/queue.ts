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

const hasRedis = redis !== null && process.env.REDIS_URL && process.env.REDIS_URL.trim() !== ''

let redisAvailable = false
if (hasRedis) {
  try {
    await Promise.race([
      redis!.ping(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Redis timeout')), 2000)
      )
    ])
    redisAvailable = true
  } catch (e) {
  }
} else {
}

let transcodeQueue: Queue<TranscodeJobData> | null = null

export { transcodeQueue }
let inMemoryQueue: Array<{ id: string; data: TranscodeJobData; status: 'pending' | 'processing' | 'completed' | 'failed' }> = []

if (hasRedis && redisAvailable) {
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
}

export const createTranscodeJob = async (data: TranscodeJobData) => {
  if (hasRedis && redisAvailable && transcodeQueue) {
    return transcodeQueue.add('transcode', data, {
      priority: 1,
    })
  } else {
    const jobId = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const job = {
      id: jobId,
      data,
      status: 'pending' as const
    }
    
    inMemoryQueue.push(job)
    
    setTimeout(async () => {
      try {
        job.status = 'processing'
        job.status = 'completed'
      } catch (error) {
        job.status = 'failed'
      }
    }, 100)
    
    return { id: jobId } as any
  }
}

export const getJobStatus = async (jobId: string) => {
  if (hasRedis && redisAvailable && transcodeQueue) {
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
