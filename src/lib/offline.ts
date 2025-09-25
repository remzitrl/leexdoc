import { openDB, DBSchema, IDBPDatabase } from 'idb'
import { Workbox } from 'workbox-window'

export interface TrackDB extends DBSchema {
  tracks: {
    key: string
    value: {
      id: string
      title: string
      artist: string
      album?: string
      duration: number
      filePath: string
      quality: 'low' | 'medium' | 'high'
      size: number
      createdAt: Date
    }
    indexes: {
      'by-artist': string
      'by-album': string
      'by-quality': string
    }
  }
  playlists: {
    key: string
    value: {
      id: string
      name: string
      trackIds: string[]
      createdAt: Date
    }
  }
}

let db: IDBPDatabase<TrackDB> | null = null

export const getOfflineDB = async (): Promise<IDBPDatabase<TrackDB>> => {
  if (db) return db

  db = await openDB<TrackDB>('offline-music', 1, {
    upgrade(db) {
      const trackStore = db.createObjectStore('tracks', { keyPath: 'id' })
      trackStore.createIndex('by-artist', 'artist')
      trackStore.createIndex('by-album', 'album')
      trackStore.createIndex('by-quality', 'quality')

      db.createObjectStore('playlists', { keyPath: 'id' })
    },
  })

  return db
}

export const registerServiceWorker = async (): Promise<void> => {
  if ('serviceWorker' in navigator) {
    const wb = new Workbox('/sw.js')
    
    wb.addEventListener('controlling', () => {
      window.location.reload()
    })

    await wb.register()
  }
}

export const isOnline = (): boolean => {
  return navigator.onLine
}

export const addOnlineListener = (callback: () => void): void => {
  window.addEventListener('online', callback)
}

export const addOfflineListener = (callback: () => void): void => {
  window.addEventListener('offline', callback)
}
