'use client'

import { useState, useEffect } from 'react'
import { offlineManager, type DownloadProgress } from '@/lib/offline/manager'
import { Button } from '@/components/ui/button'
import { Download, Trash2 } from 'lucide-react'
import DownloadConfirmationDialog from '@/components/ui/download-confirmation-dialog'

interface DocumentDownloadButtonProps {
  documentId: string
  documentTitle?: string
  className?: string
}

export default function DocumentDownloadButton({ 
  documentId, 
  documentTitle,
  className = '' 
}: DocumentDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  const [connectionInfo, setConnectionInfo] = useState(offlineManager.getConnectionInfo())
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  useEffect(() => {
    // Check if document is already offline
    offlineManager.isDocumentOffline(documentId).then(setIsOffline)
    
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
    
    offlineManager.onDownloadProgress(documentId, handleProgress)
    
    // Update connection info periodically
    const interval = setInterval(() => {
      setConnectionInfo(offlineManager.getConnectionInfo())
    }, 5000)
    
    return () => {
      offlineManager.offDownloadProgress(documentId)
      clearInterval(interval)
    }
  }, [documentId])

  const handleDownload = async () => {
    if (isOffline) {
      // Remove from offline storage
      try {
        await offlineManager.removeDocumentOffline(documentId)
        setIsOffline(false)
      } catch {
        if (typeof window !== 'undefined' && (window as any).setDownloadError) {
          (window as any).setDownloadError('Failed to remove offline document')
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
      (window as any).showDownloadPopup(documentTitle || 'Document', 'Document file')
    }

    try {
      await offlineManager.saveDocumentForOffline(documentId)
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

  const getButtonIcon = () => {
    if (isOffline) return <Trash2 className="w-4 h-4" />
    if (isDownloading) return <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
    return <Download className="w-4 h-4" />
  }

  const getButtonVariant = () => {
    if (isOffline) return 'destructive'
    if (isDownloading) return 'secondary'
    return 'default'
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <Button
        onClick={handleDownload}
        disabled={isDownloading}
        variant={getButtonVariant()}
        size="sm"
        className="flex items-center gap-2"
        title={isOffline ? 'Remove from offline storage' : 'Download for offline access'}
      >
        {getButtonIcon()}
        {getButtonText()}
      </Button>
      
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
        fileName={documentTitle}
        isMobileData={!connectionInfo.isWiFi}
      />
    </div>
  )
}
