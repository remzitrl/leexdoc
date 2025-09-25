import { StorageManager } from './storage-manager'
import { createTranscodeJob } from './queue'
import { db } from './db'
import { checkRateLimit, RATE_LIMITS, getClientIP } from './rate-limit'
import { detectMaliciousUpload } from './security/upload'

export interface UploadResult {
  trackId: string
  uploadId: string
  status: 'Processing' | 'Ready' | 'Failed'
}

export interface MetadataResult {
  title: string
  artist: string
  album?: string
  duration?: number
  coverUrl?: string
  thumbnailUrl?: string
}

// Validate URL and get file info
export async function validateAudioUrl(url: string): Promise<{
  contentType: string
  contentLength: number
  isValid: boolean
}> {
  try {
    const response = await fetch(url, { method: 'HEAD' })
    
    if (!response.ok) {
      return { contentType: '', contentLength: 0, isValid: false }
    }

    const contentType = response.headers.get('content-type') || ''
    const contentLength = parseInt(response.headers.get('content-length') || '0')

    // Check if it's an audio file
    const isAudio = contentType.startsWith('audio/')
    
    return {
      contentType,
      contentLength,
      isValid: isAudio && contentLength > 0 && contentLength <= 512 * 1024 * 1024 // 512MB max
    }
  } catch (error) {
    return { contentType: '', contentLength: 0, isValid: false }
  }
}

// Download file from URL
export async function downloadFileFromUrl(url: string): Promise<Buffer> {
  const response = await fetch(url)
  
  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.statusText}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

// Extract YouTube metadata (mock implementation)
export async function extractYouTubeMetadata(url: string): Promise<MetadataResult> {
  // In a real implementation, you would use YouTube API or web scraping
  // For now, return mock data
  const videoId = extractYouTubeVideoId(url)
  
  return {
    title: `YouTube Video ${videoId}`,
    artist: 'Unknown Artist',
    album: 'YouTube Collection',
    duration: 180, // 3 minutes default
    thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
  }
}

// Extract Spotify metadata (mock implementation)
export async function extractSpotifyMetadata(url: string): Promise<MetadataResult> {
  // In a real implementation, you would use Spotify API
  // For now, return mock data
  const trackId = extractSpotifyTrackId(url)
  
  return {
    title: `Spotify Track ${trackId}`,
    artist: 'Unknown Artist',
    album: 'Spotify Collection',
    duration: 240, // 4 minutes default
    coverUrl: 'https://via.placeholder.com/300x300?text=Spotify+Track',
  }
}

// Helper functions
function extractYouTubeVideoId(url: string): string {
  const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/
  const match = url.match(regex)
  return match ? match[1] : 'unknown'
}

function extractSpotifyTrackId(url: string): string {
  const regex = /spotify\.com\/track\/([a-zA-Z0-9]+)/
  const match = url.match(regex)
  return match ? match[1] : 'unknown'
}

// Process file upload - DEPRECATED: Use new upload route instead
export async function processFileUpload(
  userId: string,
  file: File,
  folder: string = 'uploads'
): Promise<UploadResult> {
  // This function is deprecated - use the new upload route instead
  throw new Error('processFileUpload is deprecated. Use /api/upload/file route instead.')
}

// Process URL upload
export async function processUrlUpload(
  userId: string,
  url: string,
  metadata: {
    title: string
    artist: string
    album?: string
    genre?: string
  }
): Promise<UploadResult> {
  // Validate URL
  const urlInfo = await validateAudioUrl(url)
  if (!urlInfo.isValid) {
    throw new Error('Invalid audio URL or file too large')
  }

  // Detect malicious uploads for URL downloads
  const { safeName, ext } = detectMaliciousUpload({
    originalName: metadata.title + '.mp3', // Use title as filename
    mimeFromHeader: urlInfo.contentType,
    sizeBytes: urlInfo.contentLength,
  })

  // Create upload record
  const upload = await db.upload.create({
    data: {
      userId,
      method: 'URL',
      sourceUrl: url,
      rawSize: urlInfo.contentLength,
      mime: urlInfo.contentType,
    },
  })

  // Download file
  const fileBuffer = await downloadFileFromUrl(url)
  
  // Upload to storage
  const storageResult = await StorageManager.uploadFile(
    userId,
    fileBuffer,
    'downloads',
    { contentType: urlInfo.contentType }
  )

  // Create track record
  const track = await db.track.create({
    data: {
      ownerId: userId,
      title: metadata.title,
      artist: metadata.artist,
      album: metadata.album || 'Unknown Album',
      genre: metadata.genre || 'Unknown',
      durationSec: 0, // Will be updated after transcoding
      bpm: null,
      loudnessI: 0,
      originalFileKey: storageResult.key,
      sourceType: 'URL',
      sourceUrl: url,
      status: 'Processing',
    },
  })

  // Create transcode job
  const tempPath = `/tmp/mixora/${userId}/${track.id}`
  const job = await createTranscodeJob({
    trackId: track.id,
    uploadId: upload.id,
    userId,
    inputPath: storageResult.key,
    tempPath,
  })

  return {
    trackId: track.id,
    uploadId: upload.id,
    status: 'Processing',
  }
}

// Get track metadata
export async function getTrackMetadata(trackId: string, userId: string) {
  const track = await db.track.findFirst({
    where: {
      id: trackId,
      ownerId: userId,
    },
  })

  if (!track) {
    throw new Error('Track not found')
  }

  return track
}

// Generate stream URL
export async function generateStreamUrl(
  trackId: string,
  quality: '128' | '320',
  userId: string
): Promise<string> {
  const track = await db.track.findFirst({
    where: {
      id: trackId,
      ownerId: userId,
    },
  })

  if (!track) {
    throw new Error('Track not found')
  }

  // Determine which file to stream
  let fileKey: string | null = null
  
  if (quality === '320' && track.audio320Key) {
    fileKey = track.audio320Key
  } else if (quality === '128' && track.audio128Key) {
    fileKey = track.audio128Key
  } else if (track.originalFileKey) {
    fileKey = track.originalFileKey
  }

  if (!fileKey) {
    throw new Error('No audio file available for streaming')
  }

  // Generate signed URL
  return StorageManager.getFileUrl(userId, fileKey, 3600) // 1 hour expiration
}
