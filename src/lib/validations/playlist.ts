import { z } from 'zod'

// Create playlist schema
export const createPlaylistSchema = z.object({
  name: z.string().min(1, 'Playlist name is required').max(100, 'Playlist name too long'),
  description: z.string().max(500, 'Description too long').optional(),
})

// Update playlist schema
export const updatePlaylistSchema = z.object({
  name: z.string().min(1, 'Playlist name is required').max(100, 'Playlist name too long').optional(),
  description: z.string().max(500, 'Description too long').optional(),
})

// Add track to playlist schema
export const addTrackToPlaylistSchema = z.object({
  trackId: z.string().cuid('Invalid track ID'),
  position: z.number().int().min(0, 'Position must be non-negative').optional(),
})

// Reorder playlist items schema
export const reorderPlaylistItemsSchema = z.object({
  items: z.array(z.object({
    id: z.string().cuid('Invalid item ID'),
    position: z.number().int().min(0, 'Position must be non-negative'),
  })).min(1, 'At least one item required'),
})

// Library tracks query schema
export const libraryTracksQuerySchema = z.object({
  query: z.string().optional(),
  sort: z.enum(['title', 'artist', 'album', 'createdAt', 'duration']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
})

// Download track schema
export const downloadTrackSchema = z.object({
  quality: z.enum(['128', '320']).optional().default('128'),
})

export type CreatePlaylistInput = z.infer<typeof createPlaylistSchema>
export type UpdatePlaylistInput = z.infer<typeof updatePlaylistSchema>
export type AddTrackToPlaylistInput = z.infer<typeof addTrackToPlaylistSchema>
export type ReorderPlaylistItemsInput = z.infer<typeof reorderPlaylistItemsSchema>
export type LibraryTracksQuery = z.infer<typeof libraryTracksQuerySchema>
export type DownloadTrackInput = z.infer<typeof downloadTrackSchema>
