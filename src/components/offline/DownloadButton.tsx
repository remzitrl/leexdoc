'use client'

import { useState, useEffect } from 'react'
import { offlineManager, type DownloadProgress } from '@/lib/offline/manager'
import DownloadConfirmationDialog from '@/components/ui/download-confirmation-dialog'

interface DownloadButtonProps {
  trackId: string
  trackTitle: string
  quality?: '128' | '320'
  className?: string
}

export default function DownloadButton({ 
  trackId, 
  trackTitle, 
  quality = '128',
  className = '' 
}: DownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  const [connectionInfo, setConnectionInfo] = useState(offlineManager.getConnectionInfo())
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  useEffect(() => {
    // Check if track is already offline
    offlineManager.isTrackOffline(trackId).then(setIsOffline)
    
    // Set up progress tracking for global popup
    const handleProgress = (progress: DownloadProgress) => {
      if (typeof window !== 'undefined' && (window as any).updateDownloadProgress) {
        (window as any).updateDownloadProgress(progress)
      }
      
      if (progress.status === 'completed') {
        setIsDownloading(false)
        setIsOffline(true)
      } else if (progress.status === 'error') {
        setIsDownloading(false)
        if (typeof window !== 'undefined' && (window as any).setDownloadError) {
          (window as any).setDownloadError('Download failed')
        }
      }
    }
    
    offlineManager.onDownloadProgress(trackId, handleProgress)
    
    // Update connection info periodically
    const interval = setInterval(() => {
      setConnectionInfo(offlineManager.getConnectionInfo())
    }, 5000)
    
    return () => {
      offlineManager.offDownloadProgress(trackId)
      clearInterval(interval)
    }
  }, [trackId])

  const handleDownload = async () => {
    if (isOffline) {
      // Remove from offline storage
      try {
        await offlineManager.removeOffline(trackId)
        setIsOffline(false)
      } catch (err) {
        if (typeof window !== 'undefined' && (window as any).setDownloadError) {
          (window as any).setDownloadError('Failed to remove offline track')
        }
      }
      return
    }

    if (!connectionInfo.canDownload) {
      if (typeof window !== 'undefined' && (window as any).setDownloadError) {
        (window as any).setDownloadError('Cannot download while offline')
      }
      return
    }

    // Show confirmation dialog for mobile data usage
    if (!connectionInfo.isWiFi) {
      setShowConfirmDialog(true)
      return
    }

    // Proceed with download if on WiFi
    proceedWithDownload()
  }

  const proceedWithDownload = async () => {
    setIsDownloading(true)
    
    // Show download popup
    if (typeof window !== 'undefined' && (window as any).showDownloadPopup) {
      (window as any).showDownloadPopup(trackTitle, `${quality}kbps quality`)
    }

    try {
      await offlineManager.saveForOffline(trackId, quality)
    } catch (err) {
      setIsDownloading(false)
      if (typeof window !== 'undefined' && (window as any).setDownloadError) {
        (window as any).setDownloadError(err instanceof Error ? err.message : 'Download failed')
      }
    }
  }

  const getButtonText = () => {
    if (isOffline) return 'Remove Offline'
    if (isDownloading) return 'Downloading...'
    return 'Save Offline'
  }

  const getButtonColor = () => {
    if (isOffline) return 'bg-red-600 hover:bg-red-700'
    if (isDownloading) return 'bg-yellow-600 hover:bg-yellow-700'
    return 'bg-green-600 hover:bg-green-700'
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <button
        onClick={handleDownload}
        disabled={isDownloading}
        className={`px-4 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50 ${getButtonColor()}`}
        title={isOffline ? 'Remove from offline storage' : 'Download for offline playback'}
      >
        {getButtonText()}
      </button>
      
      {!connectionInfo.isOnline && (
        <div className="text-yellow-400 text-xs">
          Offline mode
        </div>
      )}

      <DownloadConfirmationDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={proceedWithDownload}
        title="Download Confirmation"
        description="This download may use your mobile data. Do you want to continue?"
        fileName={trackTitle}
        isMobileData={!connectionInfo.isWiFi}
      />
    </div>
  )
}
