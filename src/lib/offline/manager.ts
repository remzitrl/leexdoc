import { 
  openOfflineDB, 
  saveOfflineTrack, 
  removeOfflineTrack, 
  getStorageUsage, 
  saveOfflineDocument,
  removeOfflineDocument,
  getDocumentStorageUsage,
  type OfflineTrack,
  type OfflineDocument 
} from './database'

export interface DownloadProgress {
  trackId?: string
  documentId?: string
  quality?: '128' | '320'
  bytesTotal: number
  bytesDownloaded: number
  percentage: number
  status: 'downloading' | 'completed' | 'error' | 'paused'
  type: 'track' | 'document'
}

export class OfflineManager {
  private progressCallbacks: Map<string, (progress: DownloadProgress) => void> = new Map()
  private isOnline: boolean = typeof window !== 'undefined' ? navigator.onLine : true
  private isWiFi: boolean = false

  constructor() {
    if (typeof window !== 'undefined') {
      this.setupEventListeners()
      this.detectConnectionType()
    }
  }

  private setupEventListeners() {
    if (typeof window === 'undefined') return
    
    // Online/offline detection
    window.addEventListener('online', () => {
      this.isOnline = true
      this.resumeDownloads()
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
      this.pauseDownloads()
    })

    // Connection type detection
    if (typeof window !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection
      this.isWiFi = connection.effectiveType === 'wifi' || connection.type === 'wifi'
      
      connection.addEventListener('change', () => {
        this.isWiFi = connection.effectiveType === 'wifi' || connection.type === 'wifi'
      })
    }
  }

  private async detectConnectionType() {
    if (typeof window === 'undefined') return
    
    try {
      // Try to detect WiFi by checking connection speed/type
      if ('connection' in navigator) {
        const connection = (navigator as any).connection
        this.isWiFi = connection.effectiveType === 'wifi' || connection.type === 'wifi'
      }
    } catch (error) {
    }
  }

  async saveForOffline(trackId: string, quality: '128' | '320' = '128'): Promise<void> {
    if (!this.isOnline) {
      throw new Error('Cannot download while offline')
    }

    // Check if already downloaded
    const existing = await this.getOfflineTrack(trackId)
    if (existing) {
      throw new Error('Track already downloaded for offline use')
    }

    // Get track metadata from API
    const trackMetadata = await this.getTrackMetadata(trackId)
    if (!trackMetadata) {
      throw new Error('Track not found')
    }

    // Get audio URL
    const audioUrl = await this.getAudioUrl(trackId, quality)
    if (!audioUrl) {
      throw new Error('Audio URL not available')
    }

    // Start download
    await this.startDownload(trackId, quality, audioUrl, trackMetadata)
  }

  async removeOffline(trackId: string): Promise<void> {
    await removeOfflineTrack(trackId)
    
    // Clear from cache
    if ('caches' in window) {
      const cache = await caches.open('audio-cache')
      const keys = await cache.keys()
      const audioKeys = keys.filter(key => key.url.includes(trackId))
      await Promise.all(audioKeys.map(key => cache.delete(key)))
    }
  }

  async getOfflineTrack(trackId: string): Promise<OfflineTrack | undefined> {
    const db = await openOfflineDB()
    return db.get('downloads', trackId)
  }

  async getAllOfflineTracks(): Promise<OfflineTrack[]> {
    const db = await openOfflineDB()
    return db.getAll('downloads')
  }

  async getStorageUsage() {
    return getStorageUsage()
  }

  async isTrackOffline(trackId: string): Promise<boolean> {
    const track = await this.getOfflineTrack(trackId)
    return !!track
  }

  onDownloadProgress(trackId: string, callback: (progress: DownloadProgress) => void) {
    this.progressCallbacks.set(trackId, callback)
  }

  offDownloadProgress(trackId: string) {
    this.progressCallbacks.delete(trackId)
  }

  private async getTrackMetadata(trackId: string) {
    try {
      const response = await fetch(`/api/tracks/${trackId}`)
      if (!response.ok) return null
      return response.json()
    } catch (error) {
      return null
    }
  }

  private async getAudioUrl(trackId: string, quality: '128' | '320'): Promise<string | null> {
    try {
      const response = await fetch(`/api/tracks/stream/${trackId}?quality=${quality}`)
      if (!response.ok) return null
      return response.url
    } catch (error) {
      return null
    }
  }

  private async startDownload(
    trackId: string,
    quality: '128' | '320',
    audioUrl: string,
    metadata: any
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      
      xhr.open('GET', audioUrl, true)
      xhr.responseType = 'blob'
      
      xhr.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress: DownloadProgress = {
            trackId,
            quality,
            bytesTotal: event.total,
            bytesDownloaded: event.loaded,
            percentage: Math.round((event.loaded / event.total) * 100),
            status: 'downloading',
            type: 'track',
          }
          
          const callback = this.progressCallbacks.get(trackId)
          if (callback) {
            callback(progress)
          }
        }
      }
      
      xhr.onload = async () => {
        if (xhr.status === 200) {
          try {
            // Store in IndexedDB
            const offlineTrack: OfflineTrack = {
              trackId,
              quality,
              bytesTotal: xhr.response.size,
              bytesStored: xhr.response.size,
              updatedAt: new Date().toISOString(),
              metadata: {
                title: metadata.title,
                artist: metadata.artist,
                album: metadata.album,
                duration: metadata.durationSec,
                coverImageKey: metadata.coverImageKey,
              },
            }
            
            await saveOfflineTrack(offlineTrack)
            
            // Store in cache
            if ('caches' in window) {
              const cache = await caches.open('audio-cache')
              // Convert Blob to Response object for cache storage
              const response = new Response(xhr.response, {
                status: 200,
                statusText: 'OK',
                headers: {
                  'Content-Type': xhr.getResponseHeader('Content-Type') || 'audio/mpeg',
                  'Content-Length': xhr.response.size.toString(),
                }
              })
              await cache.put(audioUrl, response)
            }
            
            // Notify completion
            const callback = this.progressCallbacks.get(trackId)
            if (callback) {
              callback({
                trackId,
                quality,
                bytesTotal: xhr.response.size,
                bytesDownloaded: xhr.response.size,
                percentage: 100,
                status: 'completed',
                type: 'track',
              })
            }
            
            resolve()
          } catch (error) {
            reject(error)
          }
        } else {
          reject(new Error(`Download failed with status ${xhr.status}`))
        }
      }
      
      xhr.onerror = () => {
        reject(new Error('Download failed'))
      }
      
      xhr.send()
    })
  }

  private async resumeDownloads() {
    // Resume any paused downloads
    const tracks = await this.getAllOfflineTracks()
    for (const track of tracks) {
      // Check if download was incomplete
      if (track.bytesStored < track.bytesTotal) {
        // Resume download
        try {
          await this.saveForOffline(track.trackId, track.quality)
        } catch (error) {
        }
      }
    }
  }

  private async pauseDownloads() {
    // Pause any active downloads
    // This would require tracking active downloads
  }

  getConnectionInfo() {
    return {
      isOnline: this.isOnline,
      isWiFi: this.isWiFi,
      canDownload: this.isOnline && (this.isWiFi || !this.isWiFi), // Allow downloads on any connection
    }
  }

  async clearAllOfflineData(): Promise<void> {
    const db = await openOfflineDB()
    await db.clear('downloads')
    await db.clear('documents')
    
    // Clear caches
    if ('caches' in window) {
      const cacheNames = await caches.keys()
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      )
    }
  }

  // Document methods
  async saveDocumentForOffline(documentId: string): Promise<void> {
    if (!this.isOnline) {
      throw new Error('Cannot download while offline')
    }

    // Check if already downloaded
    const existing = await this.getOfflineDocument(documentId)
    if (existing) {
      throw new Error('Document already downloaded for offline use')
    }

    // Get document metadata from API
    const documentMetadata = await this.getDocumentMetadata(documentId)
    if (!documentMetadata) {
      throw new Error('Document not found')
    }

    // Get document URL
    const documentUrl = await this.getDocumentUrl(documentId)
    if (!documentUrl) {
      throw new Error('Document URL not available')
    }

    // Start download
    await this.startDocumentDownload(documentId, documentUrl, documentMetadata)
  }

  async removeDocumentOffline(documentId: string): Promise<void> {
    await removeOfflineDocument(documentId)
    
    // Clear from cache
    if ('caches' in window) {
      const cache = await caches.open('document-cache')
      const keys = await cache.keys()
      const documentKeys = keys.filter(key => key.url.includes(documentId))
      await Promise.all(documentKeys.map(key => cache.delete(key)))
    }
  }

  async getOfflineDocument(documentId: string): Promise<OfflineDocument | undefined> {
    const db = await openOfflineDB()
    return db.get('documents', documentId)
  }

  async getAllOfflineDocuments(): Promise<OfflineDocument[]> {
    const db = await openOfflineDB()
    return db.getAll('documents')
  }

  async isDocumentOffline(documentId: string): Promise<boolean> {
    const document = await this.getOfflineDocument(documentId)
    return !!document
  }

  async getDocumentStorageUsage() {
    return getDocumentStorageUsage()
  }

  private async getDocumentMetadata(documentId: string) {
    try {
      const response = await fetch(`/api/documents/${documentId}`)
      if (!response.ok) return null
      return response.json()
    } catch (error) {
      return null
    }
  }

  private async getDocumentUrl(documentId: string): Promise<string | null> {
    try {
      const response = await fetch(`/api/documents/download/${documentId}`)
      if (!response.ok) return null
      return response.url
    } catch (error) {
      return null
    }
  }

  private async startDocumentDownload(
    documentId: string,
    documentUrl: string,
    metadata: any
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      
      xhr.open('GET', documentUrl, true)
      xhr.responseType = 'blob'
      
      xhr.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress: DownloadProgress = {
            documentId,
            bytesTotal: event.total,
            bytesDownloaded: event.loaded,
            percentage: Math.round((event.loaded / event.total) * 100),
            status: 'downloading',
            type: 'document',
          }
          
          const callback = this.progressCallbacks.get(documentId)
          if (callback) {
            callback(progress)
          }
        }
      }
      
      xhr.onload = async () => {
        if (xhr.status === 200) {
          try {
            // Store in IndexedDB
            const offlineDocument: OfflineDocument = {
              documentId,
              title: metadata.title,
              originalName: metadata.originalName,
              mimeType: metadata.mimeType,
              fileSize: metadata.fileSize,
              bytesStored: xhr.response.size,
              category: metadata.category,
              tags: metadata.tags || [],
              description: metadata.description,
              downloadedAt: new Date().toISOString(),
              fileKey: metadata.fileKey,
              thumbnailKey: metadata.thumbnailKey,
            }
            
            await saveOfflineDocument(offlineDocument)
            
            // Store in cache
            if ('caches' in window) {
              const cache = await caches.open('document-cache')
              // Convert Blob to Response object for cache storage
              const response = new Response(xhr.response, {
                status: 200,
                statusText: 'OK',
                headers: {
                  'Content-Type': metadata.mimeType || 'application/octet-stream',
                  'Content-Length': xhr.response.size.toString(),
                }
              })
              await cache.put(documentUrl, response)
            }
            
            // Notify completion
            const callback = this.progressCallbacks.get(documentId)
            if (callback) {
              callback({
                documentId,
                bytesTotal: xhr.response.size,
                bytesDownloaded: xhr.response.size,
                percentage: 100,
                status: 'completed',
                type: 'document',
              })
            }
            
            resolve()
          } catch (error) {
            reject(error)
          }
        } else {
          reject(new Error(`Download failed with status ${xhr.status}`))
        }
      }
      
      xhr.onerror = () => {
        reject(new Error('Download failed'))
      }
      
      xhr.send()
    })
  }
}

// Singleton instance
export const offlineManager = new OfflineManager()
