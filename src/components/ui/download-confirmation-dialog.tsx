'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Download } from 'lucide-react'

interface DownloadConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string
  fileName?: string
  fileSize?: string
  isMobileData?: boolean
}

export default function DownloadConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  fileName,
  fileSize,
  isMobileData = false
}: DownloadConfirmationDialogProps) {
  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              {isMobileData ? (
                <AlertTriangle className="h-6 w-6 text-orange-500" />
              ) : (
                <Download className="h-6 w-6 text-blue-500" />
              )}
            </div>
            <div>
              <DialogTitle className="text-left">{title}</DialogTitle>
              {description && (
                <DialogDescription className="text-left mt-1">
                  {description}
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3">
          {fileName && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {fileName}
              </div>
              {fileSize && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {fileSize}
                </div>
              )}
            </div>
          )}

          {isMobileData && (
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-orange-800 dark:text-orange-200">
                  <p className="font-medium">Mobile Data Usage</p>
                  <p className="text-xs mt-1">
                    This download may use your mobile data. Make sure you have sufficient data allowance.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} className="bg-blue-600 hover:bg-blue-700">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
