import ffmpeg from 'fluent-ffmpeg'
import { pipeline } from 'stream/promises'
import { createReadStream, createWriteStream } from 'fs'
import { join } from 'path'
import { promises as fs } from 'fs'

export interface WaveformData {
  version: number
  channels: number
  sample_rate: number
  samples_per_pixel: number
  length: number
  data: number[]
}

export function downsamplePeaks(peaks: number[], targetLength: number): number[] {
  if (peaks.length <= targetLength) {
    return peaks
  }

  const result: number[] = []
  const blockSize = peaks.length / targetLength

  for (let i = 0; i < targetLength; i++) {
    const start = Math.floor(i * blockSize)
    const end = Math.floor((i + 1) * blockSize)
    const block = peaks.slice(start, end)
    
    // Find the maximum value in the block
    const max = Math.max(...block)
    result.push(max)
  }

  return result
}

export function generateWaveformJson(peaks: number[], duration: number): WaveformData {
  const samplesPerPixel = duration > 0 ? Math.ceil(duration * 44100 / peaks.length) : 0
  
  return {
    version: 1,
    channels: 1,
    sample_rate: 44100,
    samples_per_pixel: samplesPerPixel,
    length: peaks.length,
    data: peaks,
  }
}

export async function generateWaveform(inputPath: string): Promise<number[]> {
  return new Promise((resolve, reject) => {
    const peaks: number[] = []
    let totalSamples = 0

    const command = ffmpeg(inputPath)
      .audioChannels(1)
      .audioFrequency(44100)
      .format('s16le')
      .on('error', (err) => {
        reject(new Error(`Waveform generation failed: ${err.message}`))
      })
      .on('end', () => {
        // Normalize peaks to 0-1 range
        const maxPeak = Math.max(...peaks)
        const normalizedPeaks = maxPeak > 0 
          ? peaks.map(peak => peak / maxPeak)
          : peaks
        
        resolve(normalizedPeaks)
      })

    command.pipe().on('data', (chunk: Buffer) => {
      // Process audio data in chunks
      for (let i = 0; i < chunk.length; i += 2) {
        const sample = chunk.readInt16LE(i)
        const normalizedSample = Math.abs(sample) / 32768
        
        // Downsample by taking every 100th sample for peaks
        if (totalSamples % 100 === 0) {
          peaks.push(normalizedSample)
        }
        
        totalSamples++
      }
    })
  })
}

export async function generateWaveformFromBuffer(audioBuffer: Buffer): Promise<number[]> {
  // For testing purposes, generate mock waveform data
  const mockPeaks = Array.from({ length: 1000 }, () => Math.random())
  return mockPeaks
}

export async function saveWaveformJson(
  peaks: number[], 
  duration: number, 
  outputPath: string
): Promise<void> {
  const waveformData = generateWaveformJson(peaks, duration)
  await fs.writeFile(outputPath, JSON.stringify(waveformData, null, 2))
}

export async function loadWaveformJson(filePath: string): Promise<WaveformData> {
  const data = await fs.readFile(filePath, 'utf-8')
  return JSON.parse(data)
}
