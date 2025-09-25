import { Worker, Job } from 'bullmq'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegStatic from 'ffmpeg-static'
import { existsSync, unlinkSync } from 'fs'
import { join } from 'path'
import { db } from '../lib/db'
import { storage } from '../lib/storage'
import { redis } from '../lib/redis'
import { 
  createTempDir, 
  analyzeAudio, 
  generateWaveform, 
  extractCoverImage, 
  transcodeToMP3, 
  generateWaveformJson,
  getFileExtension,
  type AudioAnalysis 
} from '../lib/audio-processing'
import { TranscodeJobData } from '../lib/queue'

ffmpeg.setFfmpegPath(ffmpegStatic!)

function logWorkerStep(
  uploadId: string, 
  userId: string, 
  step: string, 
  ms: number, 
  jobId?: string,
  extra?: any
) {
}

const worker = new Worker<TranscodeJobData>('transcode', async (job: Job<TranscodeJobData>) => {
  const { uploadId, userId, tempPath, tempFileName, yearMonth, requestId } = job.data
  const jobId = job.id
  const startTime = Date.now()

  try {
    logWorkerStep(uploadId, userId, 'worker-started', Date.now() - startTime, jobId, {
      tempPath,
      tempFileName,
      yearMonth
    })
    
    job.updateProgress(5)

    await db.upload.update({
      where: { id: uploadId },
      data: { 
        status: 'Processing',
        updatedAt: new Date()
      }
    })

    logWorkerStep(uploadId, userId, 'status-updated-processing', Date.now() - startTime, jobId)

    if (!existsSync(tempPath)) {
      throw new Error(`Temp file not found: ${tempPath}`)
    }

    logWorkerStep(uploadId, userId, 'temp-file-verified', Date.now() - startTime, jobId, {
      tempPath,
      fileSize: require('fs').statSync(tempPath).size
    })

    job.updateProgress(10)

    logWorkerStep(uploadId, userId, 'analyzing-audio', Date.now() - startTime, jobId)
    const analysis = await analyzeAudio(tempPath)
    
    job.updateProgress(20)

    logWorkerStep(uploadId, userId, 'generating-waveform', Date.now() - startTime, jobId)
    const waveform = await generateWaveform(tempPath)
    analysis.waveform = waveform

    job.updateProgress(30)

    logWorkerStep(uploadId, userId, 'extracting-cover', Date.now() - startTime, jobId)
    const coverImage = await extractCoverImage(tempPath)
    if (coverImage) {
      analysis.coverImage = coverImage
    }

    job.updateProgress(40)

    const processingTempDir = createTempDir(userId, uploadId)
    
    logWorkerStep(uploadId, userId, 'generating-128kbps', Date.now() - startTime, jobId)
    const mp3_128_path = join(processingTempDir, `track_${uploadId}_128.mp3`)
    await transcodeToMP3(tempPath, mp3_128_path, 128, job, 40, 60)

    logWorkerStep(uploadId, userId, 'generating-320kbps', Date.now() - startTime, jobId)
    const mp3_320_path = join(processingTempDir, `track_${uploadId}_320.mp3`)
    await transcodeToMP3(tempPath, mp3_320_path, 320, job, 60, 80)

    job.updateProgress(80)

    logWorkerStep(uploadId, userId, 'uploading-to-storage', Date.now() - startTime, jobId)
    const audio128Key = `${userId}/transcoded/${uploadId}/audio_128.mp3`
    const audio320Key = `${userId}/transcoded/${uploadId}/audio_320.mp3`
    const waveformKey = `${userId}/transcoded/${uploadId}/waveform.json`
    const coverKey = analysis.coverImage ? `${userId}/transcoded/${uploadId}/cover.jpg` : null

    const mp3_128_buffer = await require('fs').promises.readFile(mp3_128_path)
    const mp3_320_buffer = await require('fs').promises.readFile(mp3_320_path)
    
    await storage.putObject(audio128Key, mp3_128_buffer, { contentType: 'audio/mpeg' })
    await storage.putObject(audio320Key, mp3_320_buffer, { contentType: 'audio/mpeg' })

    const waveformData = generateWaveformJson(analysis.waveform, analysis.duration)
    const waveformJson = JSON.stringify(waveformData)
    await storage.putObject(waveformKey, Buffer.from(waveformJson), { contentType: 'application/json' })

    if (analysis.coverImage && coverKey) {
      await storage.putObject(coverKey, analysis.coverImage, { contentType: 'image/jpeg' })
    }

    logWorkerStep(uploadId, userId, 'storage-upload-complete', Date.now() - startTime, jobId, {
      audio128Key,
      audio320Key,
      waveformKey,
      coverKey
    })

    job.updateProgress(90)

    logWorkerStep(uploadId, userId, 'creating-track', Date.now() - startTime, jobId)
    const track = await db.track.create({
      data: {
        id: uploadId, // Use uploadId as trackId
        ownerId: userId,
        title: analysis.metadata.title || tempFileName.replace(/\.[^/.]+$/, ""),
        artist: analysis.metadata.artist || 'Unknown Artist',
        album: analysis.metadata.album || 'Unknown Album',
        genre: analysis.metadata.genre || 'Unknown',
        durationSec: Math.round(analysis.duration),
        bpm: analysis.bpm,
        loudnessI: analysis.loudness,
        sourceType: 'File',
        status: 'Ready',
        originalFileKey: `uploads/${yearMonth}/${tempFileName}`,
        audio128Key,
        audio320Key,
        waveformJsonKey: waveformKey,
        coverImageKey: coverKey,
      }
    })

    logWorkerStep(uploadId, userId, 'track-created', Date.now() - startTime, jobId, {
      trackId: track.id,
      title: track.title,
      artist: track.artist
    })

    await db.upload.update({
      where: { id: uploadId },
      data: {
        status: 'Completed',
        updatedAt: new Date(),
      },
    })

    logWorkerStep(uploadId, userId, 'upload-completed', Date.now() - startTime, jobId)

    try {
      if (existsSync(tempPath)) {
        unlinkSync(tempPath)
        logWorkerStep(uploadId, userId, 'temp-file-deleted', Date.now() - startTime, jobId, {
          tempPath
        })
      }
      
      if (existsSync(mp3_128_path)) {
        unlinkSync(mp3_128_path)
      }
      if (existsSync(mp3_320_path)) {
        unlinkSync(mp3_320_path)
      }
      
      logWorkerStep(uploadId, userId, 'processing-temp-cleaned', Date.now() - startTime, jobId)
    } catch (cleanupError) {
      logWorkerStep(uploadId, userId, 'cleanup-warning', Date.now() - startTime, jobId, {
        error: cleanupError instanceof Error ? cleanupError.message : 'Unknown cleanup error'
      })
    }

    job.updateProgress(100)

    logWorkerStep(uploadId, userId, 'worker-completed', Date.now() - startTime, jobId, {
      totalMs: Date.now() - startTime,
      trackId: track.id
    })

    return { 
      success: true, 
      trackId: track.id, 
      audio128Key, 
      audio320Key, 
      waveformKey, 
      coverKey 
    }

  } catch (error) {
    const errorTime = Date.now()
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    logWorkerStep(uploadId, userId, 'worker-failed', errorTime - startTime, jobId, {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      tempPath
    })
    
    // Update upload status to Failed
    await db.upload.update({
      where: { id: uploadId },
      data: { 
        status: 'Failed',
        error: errorMessage,
        updatedAt: new Date(),
      },
    })

 on error
    try {
      if (existsSync(tempPath)) {
        unlinkSync(tempPath)
        logWorkerStep(uploadId, userId, 'temp-file-deleted-on-error', Date.now() - errorTime, jobId, {
          tempPath
        })
      }
    } catch (cleanupError) {
      logWorkerStep(uploadId, userId, 'cleanup-error-failed', Date.now() - errorTime, jobId, {
        cleanupError: cleanupError instanceof Error ? cleanupError.message : 'Unknown cleanup error'
      })
    }

    throw error
  }
}, {
  connection: redis,
  concurrency: 2,
})

worker.on('completed', (job) => {
})

worker.on('failed', (job, err) => {
})

worker.on('error', (err) => {
})
