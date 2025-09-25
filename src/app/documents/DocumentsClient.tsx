'use client'

import { useState, useEffect } from 'react'
import { useDocumentStore, Document } from '@/lib/document-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import DocumentViewer from '@/components/document-viewer/DocumentViewer'
import DocumentDownloadButton from '@/components/offline/DocumentDownloadButton'
import DeleteConfirmationDialog from '@/components/ui/delete-confirmation-dialog'
import { 
  Upload, 
  Search, 
  Grid3X3, 
  List, 
  Download, 
  Eye, 
  Trash2,
  FileText,
  Music,
  Video,
  Image,
  Archive,
  File
} from 'lucide-react'
import FileUpload from '@/components/upload/FileUpload'

const categoryIcons = {
  PDF: FileText,
  Audio: Music,
  Video: Video,
  Image: Image,
  Archive: Archive,
  Document: File,
  Other: File
}

const categoryColors = {
  PDF: 'bg-red-100 text-red-800',
  Audio: 'bg-yellow-100 text-yellow-800',
  Video: 'bg-blue-100 text-blue-800',
  Image: 'bg-green-100 text-green-800',
  Archive: 'bg-orange-100 text-orange-800',
  Document: 'bg-gray-100 text-gray-800',
  Other: 'bg-slate-100 text-slate-800'
}

export default function DocumentsClient() {
  const {
    documents,
    downloads,
    viewMode,
    sortBy,
    sortOrder,
    filterCategory,
    searchQuery,
    setViewMode,
    setSortBy,
    setSortOrder,
    setFilterCategory,
    setSearchQuery,
    getFilteredDocuments,
    setCurrentDocument,
    deleteDocument
  } = useDocumentStore()

  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [isViewerOpen, setIsViewerOpen] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean
    document: Document | null
  }>({ isOpen: false, document: null })

  // Load documents on mount
  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const response = await fetch('/api/documents')
        if (response.ok) {
          const data = await response.json()
          useDocumentStore.getState().setDocuments(data.documents)
        }
      } catch (error) {
        console.error('Failed to load documents:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadDocuments()
  }, [])

  const filteredDocuments = getFilteredDocuments()

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const truncateTitle = (title: string, maxLength: number = 30) => {
    if (title.length <= maxLength) return title
    return title.substring(0, maxLength) + '...'
  }

  const handleDocumentClick = (document: any) => {
    setCurrentDocument(document)
    // Open document viewer
    if (typeof window !== 'undefined') {
      window.open(`/viewer/${document.id}`, '_blank')
    }
  }

  const handleDownload = async (document: any) => {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        console.error('Download failed: Not in browser environment')
        return
      }

      const response = await fetch(`/api/documents/${document.id}/download`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = document.originalName
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  const handleDelete = async (document: any) => {
    setDeleteDialog({ isOpen: true, document })
  }

  const confirmDelete = async () => {
    if (!deleteDialog.document) return

    try {
      const response = await fetch(`/api/documents/${deleteDialog.document.id}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        deleteDocument(deleteDialog.document.id)
      }
    } catch (error) {
      console.error('Delete failed:', error)
    }
  }

  const handleViewDocument = (document: Document) => {
    setSelectedDocument(document)
    setIsViewerOpen(true)
  }

  const handleCloseViewer = () => {
    setIsViewerOpen(false)
    setSelectedDocument(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
          </div>
          <p className="text-lg text-slate-600 font-medium">Loading documents...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white font-poppins">Documents</h1>
          <p className="text-gray-300 mt-2 text-lg">Access all your documents offline - PDFs, videos, audio files, and more</p>
        </div>
        <Button onClick={() => setIsUploadOpen(true)} className="btn-primary flex items-center gap-3 px-8 py-4 h-14 text-lg">
          <Upload className="w-5 h-5" />
          Upload Files
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-700 mb-8">
        <div className="flex flex-col xl:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1 min-w-0">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search documents, files, and more..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400 focus:bg-gray-700 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 h-12 text-lg rounded-xl w-full"
              />
            </div>
          </div>
          
          {/* Filter Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Category Filter */}
            <div className="flex-shrink-0">
              <Select value={filterCategory || 'all'} onValueChange={(value) => setFilterCategory(value === 'all' ? null : value)}>
                <SelectTrigger className="w-40 h-12 rounded-xl border-gray-600 bg-gray-700 text-gray-100">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="PDF">PDF</SelectItem>
                  <SelectItem value="Audio">Audio</SelectItem>
                  <SelectItem value="Video">Video</SelectItem>
                  <SelectItem value="Image">Image</SelectItem>
                  <SelectItem value="Document">Document</SelectItem>
                  <SelectItem value="Archive">Archive</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort By Filter */}
            <div className="flex-shrink-0">
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-32 h-12 rounded-xl border-gray-600 bg-gray-700 text-gray-100">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="size">Size</SelectItem>
                  <SelectItem value="type">Type</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort Order Button */}
            <div className="flex-shrink-0">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="h-12 w-12 rounded-xl border-gray-600 bg-gray-700 text-gray-100 hover:bg-gray-600"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex-shrink-0">
              <div className="flex border border-gray-600 rounded-xl overflow-hidden">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                  className="h-12 w-12 rounded-none hover:bg-gray-600 text-gray-100"
                >
                  <Grid3X3 className="w-5 h-5" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                  className="h-12 w-12 rounded-none hover:bg-gray-600 text-gray-100"
                >
                  <List className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Documents Grid/List */}
      {filteredDocuments.length === 0 ? (
        <div className="text-center py-20 bg-gray-800 rounded-2xl shadow-sm border border-gray-700">
          <div className="w-24 h-24 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FileText className="w-12 h-12 text-yellow-600" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">No documents yet</h3>
          <p className="text-gray-300 mb-8 text-lg max-w-md mx-auto">Upload your first document to get started with offline access to all your files</p>
          <Button onClick={() => setIsUploadOpen(true)} className="btn-primary px-8 py-4 h-14 text-lg">
            <Upload className="w-5 h-5 mr-3" />
            Upload Files
          </Button>
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-fr'
          : 'space-y-2'
        }>
          {filteredDocuments.map((document) => {
            const IconComponent = categoryIcons[document.category]
            return (
              <Card key={document.id} className={`card-primary cursor-pointer ${viewMode === 'list' ? 'p-4' : ''}`}>
                {viewMode === 'list' ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="p-2 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg flex-shrink-0">
                        <IconComponent className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm font-semibold text-white break-words truncate">
                          {document.title}
                        </CardTitle>
                        <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                          <span>{formatFileSize(document.fileSize)}</span>
                          <span>{formatDate(document.uploadedAt)}</span>
                          <span>{document.accessCount} views</span>
                        </div>
                      </div>
                      <Badge className={`${categoryColors[document.category]} text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0`}>
                        {document.category}
                      </Badge>
                    </div>
                    <div className="flex gap-1 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 rounded-lg border-gray-600 bg-gray-700 text-gray-100 hover:bg-yellow-500 hover:border-yellow-500 hover:text-white transition-all duration-200 cursor-pointer"
                        onClick={() => handleViewDocument(document)}
                      >
                        <Eye className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 rounded-lg border-gray-600 bg-gray-700 text-gray-100 hover:bg-blue-500 hover:border-blue-500 hover:text-white transition-all duration-200"
                        onClick={() => handleDownload(document)}
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                      <DocumentDownloadButton
                        documentId={document.id}
                        documentTitle={document.title}
                        className="h-8"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(document)}
                        className="h-8 w-8 rounded-lg border-gray-600 bg-gray-700 text-gray-100 hover:bg-red-500 hover:border-red-500 hover:text-white transition-all duration-200"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col h-full p-4">
                    <div className="flex items-start justify-between mb-4 flex-shrink-0">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="p-2 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg flex-shrink-0">
                          <IconComponent className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-white leading-tight" title={document.title}>
                            {truncateTitle(document.title, 25)}
                          </h3>
                          <p className="text-xs text-gray-400 mt-1 font-medium">
                            {formatFileSize(document.fileSize)}
                          </p>
                        </div>
                      </div>
                      <Badge className={`${categoryColors[document.category]} text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 ml-2`}>
                        {document.category}
                      </Badge>
                    </div>
                    
                    <div className="flex-1 flex flex-col">
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-4 flex-shrink-0">
                        <span className="font-medium">{formatDate(document.uploadedAt)}</span>
                        <span className="font-medium">{document.accessCount} views</span>
                      </div>
                      
                      <div className="flex gap-2 mt-auto">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 h-8 rounded-lg border-gray-600 bg-gray-700 text-gray-100 hover:bg-yellow-500 hover:border-yellow-500 hover:text-white transition-all duration-200 text-xs cursor-pointer"
                          onClick={() => handleViewDocument(document)}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 rounded-lg border-gray-600 bg-gray-700 text-gray-100 hover:bg-blue-500 hover:border-blue-500 hover:text-white transition-all duration-200"
                          onClick={() => handleDownload(document)}
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                        <DocumentDownloadButton
                          documentId={document.id}
                          documentTitle={document.title}
                          className="h-8"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(document)}
                          className="h-8 w-8 rounded-lg border-gray-600 bg-gray-700 text-gray-100 hover:bg-red-500 hover:border-red-500 hover:text-white transition-all duration-200"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Upload Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-lg mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Upload Files</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsUploadOpen(false)}
                className="text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded-xl"
              >
                ×
              </Button>
            </div>
            <FileUpload onClose={() => setIsUploadOpen(false)} />
          </div>
        </div>
      )}

      {/* Document Viewer */}
      {selectedDocument && (
        <DocumentViewer
          document={selectedDocument}
          isOpen={isViewerOpen}
          onClose={handleCloseViewer}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, document: null })}
        onConfirm={confirmDelete}
        title="Delete Document"
        description="Are you sure you want to delete this document? This action cannot be undone."
        itemName={deleteDialog.document?.title}
      />
    </div>
  )
}
