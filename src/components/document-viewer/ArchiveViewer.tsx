'use client'

import { useState, useEffect } from 'react'
import { Document } from '@/lib/document-store'
import { Button } from '@/components/ui/button'
import { 
  Download,
  File,
  Folder,
  Archive,
  Eye,
  FileText,
  Image,
  Music,
  Video
} from 'lucide-react'

interface ArchiveFile {
  name: string
  size: number
  type: 'file' | 'folder'
  extension: string
}

interface ArchiveViewerProps {
  document: Document
}

export default function ArchiveViewer({ document }: ArchiveViewerProps) {
  const [files, setFiles] = useState<ArchiveFile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)

  useEffect(() => {
    const loadArchive = async () => {
      try {
        // For now, we'll simulate archive contents
        // In a real implementation, you'd use a library like JSZip to read the archive
        const mockFiles: ArchiveFile[] = [
          { name: 'documents/', size: 0, type: 'folder', extension: '' },
          { name: 'documents/readme.txt', size: 1024, type: 'file', extension: 'txt' },
          { name: 'documents/image.jpg', size: 2048000, type: 'file', extension: 'jpg' },
          { name: 'documents/video.mp4', size: 15728640, type: 'file', extension: 'mp4' },
          { name: 'documents/audio.mp3', size: 5120000, type: 'file', extension: 'mp3' },
          { name: 'documents/report.pdf', size: 1024000, type: 'file', extension: 'pdf' },
          { name: 'data.json', size: 512, type: 'file', extension: 'json' },
          { name: 'config.xml', size: 256, type: 'file', extension: 'xml' }
        ]
        
        setFiles(mockFiles)
        setIsLoading(false)
      } catch (error) {
        console.error('Error loading archive:', error)
        setError('Failed to load archive contents')
        setIsLoading(false)
      }
    }

    loadArchive()
  }, [document.id])

  const getFileIcon = (file: ArchiveFile) => {
    if (file.type === 'folder') {
      return <Folder className="h-4 w-4 text-blue-400" />
    }

    switch (file.extension.toLowerCase()) {
      case 'pdf':
        return <FileText className="h-4 w-4 text-red-400" />
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return <Image className="h-4 w-4 text-green-400" />
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'mkv':
        return <Video className="h-4 w-4 text-purple-400" />
      case 'mp3':
      case 'wav':
      case 'flac':
      case 'aac':
        return <Music className="h-4 w-4 text-orange-400" />
      default:
        return <File className="h-4 w-4 text-gray-400" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleFileClick = (file: ArchiveFile) => {
    if (file.type === 'folder') {
      // In a real implementation, you'd navigate into the folder
      return
    }
    setSelectedFile(file.name)
  }

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading archive...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="text-gray-400 hover:text-white"
          >
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <Archive className="h-6 w-6 text-orange-400" />
          <div>
            <h3 className="text-lg font-semibold text-white">{document.title}</h3>
            <p className="text-sm text-gray-400">
              {files.length} items • {formatFileSize(document.fileSize)}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDownload}
          className="text-gray-400 hover:text-white"
        >
          <Download className="h-4 w-4 mr-2" />
          Download Archive
        </Button>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-auto">
        <div className="p-4">
          <div className="bg-slate-800 rounded-lg overflow-hidden">
            <div className="grid grid-cols-12 gap-4 p-3 text-sm font-medium text-gray-400 border-b border-slate-700">
              <div className="col-span-6">Name</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-2">Size</div>
              <div className="col-span-2">Actions</div>
            </div>
            
            {files.map((file, index) => (
              <div
                key={index}
                className={`grid grid-cols-12 gap-4 p-3 text-sm border-b border-slate-700 last:border-b-0 hover:bg-slate-700/50 cursor-pointer ${
                  selectedFile === file.name ? 'bg-blue-600/20' : ''
                }`}
                onClick={() => handleFileClick(file)}
              >
                <div className="col-span-6 flex items-center space-x-2">
                  {getFileIcon(file)}
                  <span className="text-white truncate">{file.name}</span>
                </div>
                <div className="col-span-2 text-gray-400">
                  {file.type === 'folder' ? 'Folder' : file.extension.toUpperCase()}
                </div>
                <div className="col-span-2 text-gray-400">
                  {file.type === 'folder' ? '-' : formatFileSize(file.size)}
                </div>
                <div className="col-span-2">
                  {file.type === 'file' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-white p-1 h-auto"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 bg-slate-800 border-t border-slate-700">
        <div className="text-sm text-gray-400 text-center">
          Archive contents are read-only. Download the archive to extract files.
        </div>
      </div>
    </div>
  )
}
