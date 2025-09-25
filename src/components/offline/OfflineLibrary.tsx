'use client'

import { useState, useEffect } from 'react'
import { offlineManager } from '@/lib/offline/manager'
import { type OfflineTrack } from '@/lib/offline/database'
import { type OfflineDocument } from '@/lib/offline/database'

export default function OfflineLibrary() {
  const [tracks, setTracks] = useState<OfflineTrack[]>([])
  const [documents, setDocuments] = useState<OfflineDocument[]>([])
  const [activeTab, setActiveTab] = useState<'tracks' | 'documents'>('documents')
  const [storageUsage, setStorageUsage] = useState({
    totalBytes: 0,
    trackCount: 0,
    documentCount: 0,
    byQuality: { '128': 0, '320': 0 },
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOfflineTracks()
    loadOfflineDocuments()
    loadStorageUsage()
  }, [])

  const loadOfflineTracks = async () => {
    try {
      const offlineTracks = await offlineManager.getAllOfflineTracks()
      setTracks(offlineTracks)
    } catch (error) {
      console.error('Failed to load offline tracks:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadOfflineDocuments = async () => {
    try {
      const offlineDocuments = await offlineManager.getAllOfflineDocuments()
      setDocuments(offlineDocuments)
    } catch (error) {
      console.error('Failed to load offline documents:', error)
    }
  }

  const loadStorageUsage = async () => {
    try {
      const [trackUsage, documentUsage] = await Promise.all([
        offlineManager.getStorageUsage(),
        offlineManager.getDocumentStorageUsage()
      ])
      
      setStorageUsage({
        totalBytes: trackUsage.totalBytes + documentUsage.totalBytes,
        trackCount: trackUsage.trackCount,
        documentCount: documentUsage.documentCount,
        byQuality: trackUsage.byQuality,
      })
    } catch (error) {
      console.error('Failed to load storage usage:', error)
    }
  }

  const handleRemoveTrack = async (trackId: string) => {
    try {
      await offlineManager.removeOffline(trackId)
      await loadOfflineTracks()
      await loadStorageUsage()
    } catch (error) {
      console.error('Failed to remove track:', error)
    }
  }

  const handleRemoveDocument = async (documentId: string) => {
    try {
      await offlineManager.removeDocumentOffline(documentId)
      await loadOfflineDocuments()
      await loadStorageUsage()
    } catch (error) {
      console.error('Failed to remove document:', error)
    }
  }

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear all offline data?')) {
      try {
        await offlineManager.clearAllOfflineData()
        await loadOfflineTracks()
        await loadOfflineDocuments()
        await loadStorageUsage()
      } catch (error) {
        console.error('Failed to clear offline data:', error)
      }
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading offline library...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Offline Library</h1>
          <button
            onClick={handleClearAll}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm"
          >
            Clear All
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-8">
          <button
            onClick={() => setActiveTab('documents')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'documents'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Documents ({documents.length})
          </button>
          <button
            onClick={() => setActiveTab('tracks')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'tracks'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Tracks ({tracks.length})
          </button>
        </div>

        {/* Storage Usage */}
        <div className="bg-gray-900 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">Storage Usage</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {formatBytes(storageUsage.totalBytes)}
              </div>
              <div className="text-gray-400">Total Storage</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {storageUsage.documentCount}
              </div>
              <div className="text-gray-400">Documents</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {storageUsage.trackCount}
              </div>
              <div className="text-gray-400">Tracks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                {storageUsage.byQuality['320']}
              </div>
              <div className="text-gray-400">320kbps</div>
            </div>
          </div>
        </div>

        {/* Content based on active tab */}
        <div className="bg-gray-900 p-6 rounded-lg">
          {activeTab === 'documents' ? (
            <>
              <h2 className="text-xl font-semibold mb-4">Offline Documents</h2>
              
              {documents.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-lg mb-4">No offline documents</div>
                  <p className="text-gray-500">
                    Upload files and they will be automatically downloaded for offline access
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {documents.map((document) => (
                    <div
                      key={document.documentId}
                      className="flex items-center justify-between p-4 bg-gray-800 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{document.title}</div>
                        <div className="text-gray-400 text-sm">
                          {document.originalName} • {document.category}
                        </div>
                        <div className="text-gray-500 text-xs mt-1">
                          {formatBytes(document.bytesStored)} • {document.mimeType}
                        </div>
                        {document.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {document.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-sm text-gray-400">
                          {new Date(document.downloadedAt).toLocaleDateString()}
                        </div>
                        
                        <button
                          onClick={() => handleRemoveDocument(document.documentId)}
                          className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold mb-4">Offline Tracks</h2>
              
              {tracks.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-lg mb-4">No offline tracks</div>
                  <p className="text-gray-500">
                    Download tracks for offline playback by clicking &quot;Save Offline&quot; on any track
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tracks.map((track) => (
                    <div
                      key={track.trackId}
                      className="flex items-center justify-between p-4 bg-gray-800 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{track.metadata?.title || 'Unknown Title'}</div>
                        <div className="text-gray-400 text-sm">
                          {track.metadata?.artist || 'Unknown Artist'} • {track.metadata?.album || 'Unknown Album'}
                        </div>
                        <div className="text-gray-500 text-xs mt-1">
                          {track.metadata?.duration && formatDuration(track.metadata.duration)} • 
                          {track.quality}kbps • 
                          {formatBytes(track.bytesStored)}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-sm text-gray-400">
                          {new Date(track.updatedAt).toLocaleDateString()}
                        </div>
                        
                        <button
                          onClick={() => handleRemoveTrack(track.trackId)}
                          className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
