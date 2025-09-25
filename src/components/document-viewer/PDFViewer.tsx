'use client'

import { useState, useEffect, useRef } from 'react'
import { Document } from '@/lib/document-store'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw } from 'lucide-react'

interface PDFViewerProps {
  document: Document
}

export default function PDFViewer({ document }: PDFViewerProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [scale, setScale] = useState(1.0)
  const [rotation, setRotation] = useState(0)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const loadPDF = async () => {
      try {
        const response = await fetch(`/api/documents/${document.id}/download`)
        if (!response.ok) throw new Error('Failed to load PDF')
        
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        setPdfUrl(url)
      } catch (error) {
      }
    }

    loadPDF()

    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl)
      }
    }
  }, [document.id])

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3.0))
  }

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5))
  }

  const rotate = () => {
    setRotation(prev => (prev + 90) % 360)
  }

  if (!pdfUrl) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading PDF...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="text-gray-400 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-gray-300">
            Page {currentPage} of {totalPages || '?'}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="text-gray-400 hover:text-white"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={zoomOut}
            className="text-gray-400 hover:text-white"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm text-gray-300 min-w-[60px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={zoomIn}
            className="text-gray-400 hover:text-white"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={rotate}
            className="text-gray-400 hover:text-white"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex-1 overflow-auto bg-gray-100">
        <div 
          className="flex justify-center p-4"
          style={{ 
            transform: `scale(${scale}) rotate(${rotation}deg)`,
            transformOrigin: 'center top'
          }}
        >
          <iframe
            ref={iframeRef}
            src={pdfUrl}
            className="w-full h-full min-h-[600px] border-0"
            title={document.title}
            onLoad={() => {
              // Try to get total pages from PDF.js if available
              try {
                const iframe = iframeRef.current
                if (iframe?.contentWindow) {
                  // This would work if PDF.js is loaded
                  // For now, we'll estimate based on file size
                  const estimatedPages = Math.max(1, Math.floor(document.fileSize / 50000))
                  setTotalPages(estimatedPages)
                }
              } catch (error) {
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}
