import { z } from 'zod'

// File upload validation
export const fileUploadSchema = z.object({
  file: z.any().refine((file) => file instanceof File, {
    message: 'File is required',
  }),
  folder: z.string().optional().default('uploads'),
})

// URL upload validation
export const urlUploadSchema = z.object({
  url: z.string().url('Invalid URL format'),
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  artist: z.string().min(1, 'Artist is required').max(255, 'Artist name too long'),
  album: z.string().optional(),
  genre: z.string().optional(),
})

// YouTube metadata validation
export const youtubeMetadataSchema = z.object({
  url: z.string().url('Invalid YouTube URL').refine(
    (url) => url.includes('youtube.com') || url.includes('youtu.be'),
    'Must be a valid YouTube URL'
  ),
})

// Spotify metadata validation
export const spotifyMetadataSchema = z.object({
  url: z.string().url('Invalid Spotify URL').refine(
    (url) => url.includes('spotify.com'),
    'Must be a valid Spotify URL'
  ),
})

// Track query validation
export const trackQuerySchema = z.object({
  id: z.string().min(1, 'Track ID is required'),
})

// Stream query validation
export const streamQuerySchema = z.object({
  id: z.string().min(1, 'Track ID is required'),
  quality: z.enum(['128', '320']).default('320'),
})

// Track metadata response
export const trackMetadataSchema = z.object({
  id: z.string(),
  title: z.string(),
  artist: z.string(),
  album: z.string().optional(),
  genre: z.string(),
  durationSec: z.number(),
  bpm: z.number().optional(),
  loudnessI: z.number(),
  coverImageKey: z.string().optional(),
  originalFileKey: z.string().optional(),
  audio320Key: z.string().optional(),
  audio128Key: z.string().optional(),
  waveformJsonKey: z.string().optional(),
  sourceType: z.enum(['File', 'URL', 'YouTube', 'Spotify', 'Other']),
  sourceUrl: z.string().optional(),
  status: z.enum(['Processing', 'Ready', 'Failed']),
  createdAt: z.date(),
  updatedAt: z.date(),
})

// Upload response
export const uploadResponseSchema = z.object({
  success: z.boolean(),
  trackId: z.string(),
  uploadId: z.string(),
  status: z.enum(['Processing', 'Ready', 'Failed']),
  message: z.string(),
})

// Metadata response
export const metadataResponseSchema = z.object({
  success: z.boolean(),
  metadata: z.object({
    title: z.string(),
    artist: z.string(),
    album: z.string().optional(),
    duration: z.number().optional(),
    coverUrl: z.string().optional(),
    thumbnailUrl: z.string().optional(),
  }),
  message: z.string(),
})

export type FileUploadInput = z.infer<typeof fileUploadSchema>
export type UrlUploadInput = z.infer<typeof urlUploadSchema>
export type YouTubeMetadataInput = z.infer<typeof youtubeMetadataSchema>
export type SpotifyMetadataInput = z.infer<typeof spotifyMetadataSchema>
export type TrackQueryInput = z.infer<typeof trackQuerySchema>
export type StreamQueryInput = z.infer<typeof streamQuerySchema>
export type TrackMetadata = z.infer<typeof trackMetadataSchema>
export type UploadResponse = z.infer<typeof uploadResponseSchema>
export type MetadataResponse = z.infer<typeof metadataResponseSchema>
