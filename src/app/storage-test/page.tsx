'use client'

import { useState, useRef } from 'react'
import { useSession } from 'next-auth/react'

export default function StorageTestPage() {
  const { data: session, status } = useSession()
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<any>(null)
  const [error, setError] = useState('')
  const [files, setFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError('')
    setUploadResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'test')

      const response = await fetch('/api/storage/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }

      setUploadResult(result)
      loadFiles() // Refresh file list
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const loadFiles = async () => {
    if (!session?.user?.id) return

    setLoading(true)
    try {
      // This would need to be implemented as an API endpoint
      // For now, we'll just show a placeholder
      setFiles([])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getSignedUrl = async (key: string) => {
    try {
      const response = await fetch('/api/storage/signed-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key }),
      })

      const result = await response.json()
      if (result.url) {
        window.open(result.url, '_blank')
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  const deleteFile = async (key: string) => {
    try {
      const response = await fetch(`/api/storage/${encodeURIComponent(key)}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        loadFiles() // Refresh file list
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="text-gray-400">Please sign in to access the storage test page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Storage Test Page</h1>
        
        {/* Upload Section */}
        <div className="bg-gray-900 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">Upload File</h2>
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,image/*"
              onChange={handleFileUpload}
              disabled={uploading}
              className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
            />
            
            {uploading && (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Uploading...</span>
              </div>
            )}
            
            {uploadResult && (
              <div className="bg-green-900 p-4 rounded">
                <h3 className="font-semibold text-green-400 mb-2">Upload Successful!</h3>
                <div className="text-sm space-y-1">
                  <p><strong>Key:</strong> {uploadResult.key}</p>
                  <p><strong>Size:</strong> {(uploadResult.size / 1024).toFixed(2)} KB</p>
                  <p><strong>Type:</strong> {uploadResult.contentType}</p>
                  <p><strong>URL:</strong> <a href={uploadResult.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{uploadResult.url}</a></p>
                </div>
              </div>
            )}
            
            {error && (
              <div className="bg-red-900 p-4 rounded">
                <p className="text-red-400">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* File List Section */}
        <div className="bg-gray-900 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Your Files</h2>
          
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Loading files...</span>
            </div>
          ) : files.length === 0 ? (
            <p className="text-gray-400">No files uploaded yet.</p>
          ) : (
            <div className="space-y-2">
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded">
                  <div>
                    <p className="font-medium">{file.key}</p>
                    <p className="text-sm text-gray-400">
                      {(file.size / 1024).toFixed(2)} KB • {file.contentType}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => getSignedUrl(file.key)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                    >
                      View
                    </button>
                    <button
                      onClick={() => deleteFile(file.key)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Storage Info */}
        <div className="mt-8 bg-gray-900 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Storage Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Provider</p>
              <p className="font-medium">{process.env.NODE_ENV === 'development' ? 'Local Disk' : 'S3/MinIO'}</p>
            </div>
            <div>
              <p className="text-gray-400">Max File Size</p>
              <p className="font-medium">512 MB</p>
            </div>
            <div>
              <p className="text-gray-400">Allowed Types</p>
              <p className="font-medium">Audio & Images</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
