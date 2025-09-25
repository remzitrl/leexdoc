import { openDB, DBSchema, IDBPDatabase } from 'idb'

export interface OfflineTrack {
  trackId: string
  quality: '128' | '320'
  bytesTotal: number
  bytesStored: number
  updatedAt: string
  metadata?: {
    title: string
    artist: string
    album: string
    duration: number
    coverImageKey?: string
  }
}

export interface OfflineDocument {
  documentId: string
  title: string
  originalName: string
  mimeType: string
  fileSize: number
  bytesStored: number
  category: 'PDF' | 'Audio' | 'Video' | 'Image' | 'Document' | 'Archive' | 'Other'
  tags: string[]
  description?: string
  downloadedAt: string
  fileKey: string
  thumbnailKey?: string
}

export interface OfflineDB extends DBSchema {
  downloads: {
    key: string // trackId
    value: OfflineTrack
    indexes: {
      'by-quality': string
      'by-updated': string
    }
  }
  documents: {
    key: string // documentId
    value: OfflineDocument
    indexes: {
      'by-category': string
      'by-downloaded': string
      'by-mime-type': string
    }
  }
}

const DB_NAME = 'offline_index'
const DB_VERSION = 2

export async function openOfflineDB(): Promise<IDBPDatabase<OfflineDB>> {
  return openDB<OfflineDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create downloads store
      if (!db.objectStoreNames.contains('downloads')) {
        const store = db.createObjectStore('downloads', {
          keyPath: 'trackId',
        })
        
        // Create indexes
        store.createIndex('by-quality', 'quality', { unique: false })
        store.createIndex('by-updated', 'updatedAt', { unique: false })
      }

      // Create documents store
      if (!db.objectStoreNames.contains('documents')) {
        const store = db.createObjectStore('documents', {
          keyPath: 'documentId',
        })
        
        // Create indexes
        store.createIndex('by-category', 'category', { unique: false })
        store.createIndex('by-downloaded', 'downloadedAt', { unique: false })
        store.createIndex('by-mime-type', 'mimeType', { unique: false })
      }
    },
  })
}

export async function saveOfflineTrack(track: OfflineTrack): Promise<void> {
  const db = await openOfflineDB()
  await db.put('downloads', track)
}

export async function getOfflineTrack(trackId: string): Promise<OfflineTrack | undefined> {
  const db = await openOfflineDB()
  return db.get('downloads', trackId)
}

export async function getAllOfflineTracks(): Promise<OfflineTrack[]> {
  const db = await openOfflineDB()
  return db.getAll('downloads')
}

export async function removeOfflineTrack(trackId: string): Promise<void> {
  const db = await openOfflineDB()
  await db.delete('downloads', trackId)
}

export async function getOfflineTracksByQuality(quality: '128' | '320'): Promise<OfflineTrack[]> {
  const db = await openOfflineDB()
  return db.getAllFromIndex('downloads', 'by-quality', quality)
}

export async function getStorageUsage(): Promise<{
  totalBytes: number
  trackCount: number
  byQuality: { '128': number; '320': number }
}> {
  const tracks = await getAllOfflineTracks()
  
  const totalBytes = tracks.reduce((sum, track) => sum + track.bytesStored, 0)
  const trackCount = tracks.length
  
  const byQuality = tracks.reduce(
    (acc, track) => {
      acc[track.quality]++
      return acc
    },
    { '128': 0, '320': 0 }
  )
  
  return {
    totalBytes,
    trackCount,
    byQuality,
  }
}

export async function clearOfflineStorage(): Promise<void> {
  const db = await openOfflineDB()
  await db.clear('downloads')
  await db.clear('documents')
}

// Document functions
export async function saveOfflineDocument(document: OfflineDocument): Promise<void> {
  const db = await openOfflineDB()
  await db.put('documents', document)
}

export async function getOfflineDocument(documentId: string): Promise<OfflineDocument | undefined> {
  const db = await openOfflineDB()
  return db.get('documents', documentId)
}

export async function getAllOfflineDocuments(): Promise<OfflineDocument[]> {
  const db = await openOfflineDB()
  return db.getAll('documents')
}

export async function removeOfflineDocument(documentId: string): Promise<void> {
  const db = await openOfflineDB()
  await db.delete('documents', documentId)
}

export async function getOfflineDocumentsByCategory(category: string): Promise<OfflineDocument[]> {
  const db = await openOfflineDB()
  return db.getAllFromIndex('documents', 'by-category', category)
}

export async function getOfflineDocumentsByMimeType(mimeType: string): Promise<OfflineDocument[]> {
  const db = await openOfflineDB()
  return db.getAllFromIndex('documents', 'by-mime-type', mimeType)
}

export async function getDocumentStorageUsage(): Promise<{
  totalBytes: number
  documentCount: number
  byCategory: Record<string, number>
  byMimeType: Record<string, number>
}> {
  const documents = await getAllOfflineDocuments()
  
  const totalBytes = documents.reduce((sum, doc) => sum + doc.bytesStored, 0)
  const documentCount = documents.length
  
  const byCategory = documents.reduce(
    (acc, doc) => {
      acc[doc.category] = (acc[doc.category] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )
  
  const byMimeType = documents.reduce(
    (acc, doc) => {
      acc[doc.mimeType] = (acc[doc.mimeType] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )
  
  return {
    totalBytes,
    documentCount,
    byCategory,
    byMimeType,
  }
}
