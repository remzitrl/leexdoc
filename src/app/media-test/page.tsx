'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import AudioPlayer from '@/components/document-viewer/AudioPlayer'
import VideoPlayer from '@/components/document-viewer/VideoPlayer'
import ImageViewer from '@/components/document-viewer/ImageViewer'
import PDFViewer from '@/components/document-viewer/PDFViewer'

// Test document data
const testDocuments = [
  {
    id: 'test-audio-1',
    title: 'Test Audio File',
    originalName: 'test-audio.mp3',
    mimeType: 'audio/mpeg',
    category: 'Audio',
    fileSize: 1024000,
    fileKey: '2025/09/test-audio.mp3',
    uploadedAt: new Date().toISOString(),
    ownerId: 'test-user',
    tags: [],
    isPublic: false,
    status: 'Ready',
    accessCount: 0
  },
  {
    id: 'test-video-1',
    title: 'Test Video File',
    originalName: 'test-video.mp4',
    mimeType: 'video/mp4',
    category: 'Video',
    fileSize: 10240000,
    fileKey: '2025/09/test-video.mp4',
    uploadedAt: new Date().toISOString(),
    ownerId: 'test-user',
    tags: [],
    isPublic: false,
    status: 'Ready',
    accessCount: 0
  },
  {
    id: 'test-image-1',
    title: 'Test Image File',
    originalName: 'test-image.jpg',
    mimeType: 'image/jpeg',
    category: 'Image',
    fileSize: 512000,
    fileKey: 'test-image.jpg',
    uploadedAt: new Date().toISOString(),
    ownerId: 'test-user',
    tags: [],
    isPublic: false,
    status: 'Ready',
    accessCount: 0
  },
  {
    id: 'test-pdf-1',
    title: 'Test PDF File',
    originalName: 'test-document.pdf',
    mimeType: 'application/pdf',
    category: 'PDF',
    fileSize: 2048000,
    fileKey: 'test-document.pdf',
    uploadedAt: new Date().toISOString(),
    ownerId: 'test-user',
    tags: [],
    isPublic: false,
    status: 'Ready',
    accessCount: 0
  }
]

export default function MediaTestPage() {
  const [selectedDocument, setSelectedDocument] = useState<any>(null)
  const [isViewerOpen, setIsViewerOpen] = useState(false)

  const handleTestDocument = (document: any) => {
    setSelectedDocument(document)
    setIsViewerOpen(true)
  }

  const renderViewer = () => {
    if (!selectedDocument) return null

    switch (selectedDocument.category) {
      case 'Audio':
        return <AudioPlayer document={selectedDocument} isOpen={isViewerOpen} onClose={() => setIsViewerOpen(false)} />
      case 'Video':
        return <VideoPlayer document={selectedDocument} isOpen={isViewerOpen} onClose={() => setIsViewerOpen(false)} />
      case 'Image':
        return <ImageViewer document={selectedDocument} isOpen={isViewerOpen} onClose={() => setIsViewerOpen(false)} />
      case 'PDF':
        return <PDFViewer document={selectedDocument} isOpen={isViewerOpen} onClose={() => setIsViewerOpen(false)} />
      default:
        return (
          <div className="flex items-center justify-center h-96 text-gray-400">
            <div className="text-center">
              <p className="text-lg mb-2">Unsupported file type</p>
              <p className="text-sm">This file type cannot be previewed</p>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="container mx-auto px-8 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold gradient-text font-poppins mb-3">Media Player Test</h1>
          <p className="text-slate-600 text-lg">
            Test different media player components
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {testDocuments.map((document) => (
            <Card key={document.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{document.title}</h3>
                  <p className="text-sm text-slate-500 mb-2">{document.originalName}</p>
                  <p className="text-xs text-slate-400">{document.mimeType}</p>
                </div>
                <Button 
                  onClick={() => handleTestDocument(document)}
                  className="btn-primary"
                >
                  Test Player
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {isViewerOpen && selectedDocument && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-900">
                Testing {selectedDocument.category} Player
              </h2>
              <Button 
                variant="outline" 
                onClick={() => setIsViewerOpen(false)}
                className="btn-outline"
              >
                Close
              </Button>
            </div>
            <div className="h-96 border border-slate-200 rounded-lg overflow-hidden">
              {renderViewer()}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
