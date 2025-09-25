import ffmpeg from 'fluent-ffmpeg'
import { parseFile } from 'music-metadata'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

export interface AudioAnalysis {
  duration: number
  bpm?: number
  loudness: number
  waveform: number[]
  coverImage?: Buffer
  metadata: {
    title?: string
    artist?: string
    album?: string
    genre?: string
  }
}

export interface WaveformData {
  peaks: number[]
  duration: number
  sampleRate: number
}

// Create temporary directory
export function createTempDir(userId: string, trackId: string): string {
  const tempPath = join('/tmp', 'mixora', userId, trackId)
  mkdirSync(tempPath, { recursive: true })
  return tempPath
}

// Analyze audio file with EBU R128 normalization
export async function analyzeAudio(filePath: string): Promise<AudioAnalysis> {
  const metadata = await parseFile(filePath)
  
  // Calculate EBU R128 loudness (simplified)
  const loudness = await calculateEBUR128Loudness(filePath)
  
  return {
    duration: metadata.format.duration || 0,
    bpm: metadata.common.bpm,
    loudness,
    waveform: [], // Will be filled by generateWaveform
    coverImage: metadata.common.picture?.[0]?.data,
    metadata: {
      title: metadata.common.title,
      artist: metadata.common.artist,
      album: metadata.common.album,
      genre: metadata.common.genre?.[0],
    },
  }
}

// Calculate EBU R128 loudness using FFmpeg
async function calculateEBUR128Loudness(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    let loudness = -23 // Default EBU R128 target
    
    ffmpeg(filePath)
      .audioFilters('loudnorm=I=-23:LRA=7:TP=-2')
      .format('null')
      .on('stderr', (stderrLine) => {
        // Parse FFmpeg output for loudness information
        const match = stderrLine.match(/input_i\s+(-?\d+\.?\d*)/)
        if (match) {
          loudness = parseFloat(match[1])
        }
      })
      .on('end', () => resolve(loudness))
      .on('error', (err) => {
        console.warn('Failed to calculate EBU R128 loudness:', err.message)
        resolve(-23) // Fallback to default
      })
      .save('/dev/null')
  })
}

// Generate waveform data with downsampled peaks
export async function generateWaveform(filePath: string): Promise<number[]> {
  return new Promise((resolve, reject) => {
    const peaks: number[] = []
    const targetSamples = 1000 // Downsample to 1000 points
    
    ffmpeg(filePath)
      .audioChannels(1)
      .audioFrequency(44100)
      .format('wav')
      .on('end', () => {
        // Downsample peaks
        const downsampled = downsamplePeaks(peaks, targetSamples)
        resolve(downsampled)
      })
      .on('error', reject)
      .pipe()
      .on('data', (chunk: Buffer) => {
        // Process audio data to extract peaks
        for (let i = 0; i < chunk.length; i += 2) {
          const sample = chunk.readInt16LE(i)
          peaks.push(Math.abs(sample) / 32768) // Normalize to 0-1
        }
      })
  })
}

// Downsample peaks array
function downsamplePeaks(peaks: number[], targetLength: number): number[] {
  if (peaks.length <= targetLength) return peaks
  
  const blockSize = Math.floor(peaks.length / targetLength)
  const downsampled: number[] = []
  
  for (let i = 0; i < targetLength; i++) {
    const start = i * blockSize
    const end = Math.min(start + blockSize, peaks.length)
    const block = peaks.slice(start, end)
    const max = Math.max(...block)
    downsampled.push(max)
  }
  
  return downsampled
}

// Extract cover image from audio file
export async function extractCoverImage(filePath: string): Promise<Buffer | null> {
  try {
    const metadata = await parseFile(filePath)
    const picture = metadata.common.picture?.[0]
    
    if (picture) {
      return Buffer.from(picture.data)
    }
    
    return null
  } catch (error) {
    console.error('Failed to extract cover image:', error)
    return null
  }
}

// Transcode to MP3 with EBU R128 normalization
export async function transcodeToMP3(
  inputPath: string,
  outputPath: string,
  bitrate: number,
  job: any,
  startProgress: number,
  endProgress: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioCodec('libmp3lame')
      .audioBitrate(bitrate)
      .audioChannels(2)
      .audioFrequency(44100)
      .audioFilters('loudnorm=I=-23:LRA=7:TP=-2') // EBU R128 normalization
      .format('mp3')
      .on('progress', (progress) => {
        const currentProgress = startProgress + (progress.percent || 0) * (endProgress - startProgress) / 100
        job.updateProgress(Math.round(currentProgress))
      })
      .on('end', () => resolve())
      .on('error', reject)
      .save(outputPath)
  })
}

// Generate waveform JSON data
export function generateWaveformJson(waveform: number[], duration: number): WaveformData {
  return {
    peaks: waveform,
    duration,
    sampleRate: 44100
  }
}

// Get file extension
export function getFileExtension(filename: string): string {
  return filename.split('.').pop() || ''
}
