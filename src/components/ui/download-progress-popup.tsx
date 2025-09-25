'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Download, X, CheckCircle, AlertCircle } from 'lucide-react'
import { type DownloadProgress } from '@/lib/offline/manager'

interface DownloadProgressPopupProps {
  isOpen: boolean
  onClose: () => void
  progress: DownloadProgress | null
  fileName: string
  fileSize?: string
  error?: string | null
}

export default function DownloadProgressPopup({
  isOpen,
  onClose,
  progress,
  fileName,
  fileSize,
  error
}: DownloadProgressPopupProps) {
  const [canClose, setCanClose] = useState(false)

  useEffect(() => {
    // Allow closing only when download is completed, failed, or no progress
    if (progress?.status === 'completed' || progress?.status === 'error' || !progress) {
      setCanClose(true)
    } else {
      setCanClose(false)
    }
  }, [progress])

  const handleClose = () => {
    if (canClose) {
      onClose()
    }
  }

  const getStatusIcon = () => {
    if (error || progress?.status === 'error') {
      return <AlertCircle className="h-6 w-6 text-red-500" />
    }
    if (progress?.status === 'completed') {
      return <CheckCircle className="h-6 w-6 text-green-500" />
    }
    return <Download className="h-6 w-6 text-blue-500" />
  }

  const getStatusText = () => {
    if (error || progress?.status === 'error') {
      return 'Download Failed'
    }
    if (progress?.status === 'completed') {
      return 'Download Complete'
    }
    if (progress?.status === 'downloading') {
      return 'Downloading...'
    }
    return 'Preparing Download...'
  }

  const getStatusColor = () => {
    if (error || progress?.status === 'error') {
      return 'text-red-500'
    }
    if (progress?.status === 'completed') {
      return 'text-green-500'
    }
    return 'text-blue-500'
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                {getStatusIcon()}
              </div>
              <div>
                <DialogTitle className="text-left">{getStatusText()}</DialogTitle>
              </div>
            </div>
            {canClose && (
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Info */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {fileName}
            </div>
            {fileSize && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {fileSize}
              </div>
            )}
          </div>

          {/* Progress Section */}
          {progress && (
            <div className="space-y-3">
              {/* Progress Bar */}
              <div className="space-y-2">
                <Progress 
                  value={progress.percentage} 
                  className="h-3"
                />
                <div className="flex justify-between text-sm">
                  <span className={`font-medium ${getStatusColor()}`}>
                    {Math.round(progress.percentage)}%
                  </span>
                  <span className="text-gray-500">
                    {Math.round(progress.bytesDownloaded / 1024 / 1024)}MB / {Math.round(progress.bytesTotal / 1024 / 1024)}MB
                  </span>
                </div>
              </div>

              {/* Download Speed */}
              {progress.bytesPerSecond > 0 && (
                <div className="text-xs text-gray-500 text-center">
                  {Math.round(progress.bytesPerSecond / 1024)} KB/s
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <div className="text-sm text-red-800 dark:text-red-200">
                {error}
              </div>
            </div>
          )}

          {/* Success Message */}
          {progress?.status === 'completed' && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <div className="text-sm text-green-800 dark:text-green-200">
                File has been successfully downloaded and is now available offline.
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
