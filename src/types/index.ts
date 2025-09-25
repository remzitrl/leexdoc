export interface Track {
  id: string
  title: string
  artist: string
  album?: string
  duration: number
  filePath: string
  quality: 'low' | 'medium' | 'high'
  size: number
  mimeType: string
  userId: string
  createdAt: Date
  updatedAt: Date
}

export interface Playlist {
  id: string
  name: string
  userId: string
  createdAt: Date
  updatedAt: Date
  tracks: PlaylistTrack[]
}

export interface PlaylistTrack {
  id: string
  playlistId: string
  trackId: string
  order: number
  track: Track
}

export interface TranscodeJob {
  id: string
  trackId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  quality: 'low' | 'medium' | 'high'
  inputPath: string
  outputPath?: string
  error?: string
  createdAt: Date
  updatedAt: Date
}

export interface User {
  id: string
  email: string
  name?: string
  image?: string
  createdAt: Date
  updatedAt: Date
}

export interface AudioPlayerState {
  currentTrack: Track | null
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
  isShuffled: boolean
  repeatMode: 'none' | 'one' | 'all'
  queue: Track[]
  currentIndex: number
}

export interface StorageConfig {
  provider: 'local' | 's3'
  s3?: {
    endpoint: string
    bucket: string
    accessKey: string
    secretKey: string
    region: string
  }
}
