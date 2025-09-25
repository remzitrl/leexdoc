'use client'

import { useState, useEffect } from 'react'
import { Document } from '@/lib/document-store'
import { DocumentType } from '@/lib/document-store'
import PDFViewer from './PDFViewer'
import AudioPlayer from './AudioPlayer'
import VideoPlayer from './VideoPlayer'
import ImageViewer from './ImageViewer'
import TextViewer from './TextViewer'
import ArchiveViewer from './ArchiveViewer'
import { X, Download, Maximize2, Minimize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DocumentViewerProps {
  document: Document
  isOpen: boolean
  onClose: () => void
}

export default function DocumentViewer({ document, isOpen, onClose }: DocumentViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true)
      // Simulate loading time
      const timer = setTimeout(() => setIsLoading(false), 500)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/documents/${document.id}/download`)
      if (!response.ok) throw new Error('Download failed')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = document.title
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download error:', error)
    }
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const renderViewer = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      )
    }

    switch (document.category) {
      case 'PDF':
        return <PDFViewer document={document} />
      case 'Audio':
        return <AudioPlayer document={document} />
      case 'Video':
        return <VideoPlayer document={document} />
      case 'Image':
        return <ImageViewer document={document} />
      case 'Document':
        return <TextViewer document={document} />
      case 'Archive':
        return <ArchiveViewer document={document} />
      default:
        return (
          <div className="flex items-center justify-center h-96 text-gray-400">
            <div className="text-center">
              <p className="text-lg mb-2">Unsupported file type</p>
              <p className="text-sm">This file type cannot be previewed</p>
              <p className="text-xs mt-2 text-gray-500">Category: {document.category}</p>
            </div>
          </div>
        )
    }
  }

  if (!isOpen) return null

  return (
    <div className={`fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 ${isFullscreen ? 'p-0' : ''}`}>
      <div className={`bg-slate-900 rounded-lg shadow-2xl flex flex-col ${isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-6xl h-full max-h-[90vh]'}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-semibold text-white truncate max-w-md">
              {document.title}
            </h2>
            <span className="px-2 py-1 bg-blue-600 text-xs rounded text-white">
              {document.documentType}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="text-gray-400 hover:text-white"
            >
              {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownload}
              className="text-gray-400 hover:text-white"
            >
              <Download className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {renderViewer()}
        </div>
      </div>
    </div>
  )
}
