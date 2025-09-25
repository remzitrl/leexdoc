'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'

export default function UploadTestPage() {
  const { data: session, status } = useSession()
  const [activeTab, setActiveTab] = useState<'file' | 'url' | 'youtube' | 'spotify'>('file')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  // File upload state
  const [file, setFile] = useState<File | null>(null)
  const [folder, setFolder] = useState('uploads')

  // URL upload state
  const [urlData, setUrlData] = useState({
    url: '',
    title: '',
    artist: '',
    album: '',
    genre: '',
  })

  // YouTube/Spotify state
  const [platformUrl, setPlatformUrl] = useState('')

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', folder)

      const response = await fetch('/api/upload/file', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      setResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUrlUpload = async (e: React.FormEvent) => {
    e.preventDefault()

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/upload/url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(urlData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'URL upload failed')
      }

      setResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePlatformMetadata = async (e: React.FormEvent) => {
    e.preventDefault()

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const endpoint = activeTab === 'youtube' ? '/api/upload/youtube' : '/api/upload/spotify'
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: platformUrl }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Metadata extraction failed')
      }

      setResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
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
          <p className="text-gray-400">Please sign in to access the upload test page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Upload Test Page</h1>
        
        {/* Tab Navigation */}
        <div className="flex space-x-4 mb-8">
          {[
            { id: 'file', label: 'File Upload' },
            { id: 'url', label: 'URL Upload' },
            { id: 'youtube', label: 'YouTube Metadata' },
            { id: 'spotify', label: 'Spotify Metadata' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* File Upload Tab */}
        {activeTab === 'file' && (
          <div className="bg-gray-900 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">File Upload</h2>
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">File</label>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full p-2 border border-gray-600 bg-gray-800 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Folder</label>
                <input
                  type="text"
                  value={folder}
                  onChange={(e) => setFolder(e.target.value)}
                  className="w-full p-2 border border-gray-600 bg-gray-800 rounded"
                  placeholder="uploads"
                />
              </div>
              <button
                type="submit"
                disabled={!file || loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded"
              >
                {loading ? 'Uploading...' : 'Upload File'}
              </button>
            </form>
          </div>
        )}

        {/* URL Upload Tab */}
        {activeTab === 'url' && (
          <div className="bg-gray-900 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">URL Upload</h2>
            <form onSubmit={handleUrlUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Audio URL</label>
                <input
                  type="url"
                  value={urlData.url}
                  onChange={(e) => setUrlData({ ...urlData, url: e.target.value })}
                  className="w-full p-2 border border-gray-600 bg-gray-800 rounded"
                  placeholder="https://example.com/audio.mp3"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title</label>
                  <input
                    type="text"
                    value={urlData.title}
                    onChange={(e) => setUrlData({ ...urlData, title: e.target.value })}
                    className="w-full p-2 border border-gray-600 bg-gray-800 rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Artist</label>
                  <input
                    type="text"
                    value={urlData.artist}
                    onChange={(e) => setUrlData({ ...urlData, artist: e.target.value })}
                    className="w-full p-2 border border-gray-600 bg-gray-800 rounded"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Album (optional)</label>
                  <input
                    type="text"
                    value={urlData.album}
                    onChange={(e) => setUrlData({ ...urlData, album: e.target.value })}
                    className="w-full p-2 border border-gray-600 bg-gray-800 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Genre (optional)</label>
                  <input
                    type="text"
                    value={urlData.genre}
                    onChange={(e) => setUrlData({ ...urlData, genre: e.target.value })}
                    className="w-full p-2 border border-gray-600 bg-gray-800 rounded"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={!urlData.url || !urlData.title || !urlData.artist || loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded"
              >
                {loading ? 'Processing...' : 'Upload from URL'}
              </button>
            </form>
          </div>
        )}

        {/* YouTube Metadata Tab */}
        {activeTab === 'youtube' && (
          <div className="bg-gray-900 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">YouTube Metadata</h2>
            <form onSubmit={handlePlatformMetadata} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">YouTube URL</label>
                <input
                  type="url"
                  value={platformUrl}
                  onChange={(e) => setPlatformUrl(e.target.value)}
                  className="w-full p-2 border border-gray-600 bg-gray-800 rounded"
                  placeholder="https://www.youtube.com/watch?v=..."
                  required
                />
              </div>
              <button
                type="submit"
                disabled={!platformUrl || loading}
                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded"
              >
                {loading ? 'Extracting...' : 'Extract Metadata'}
              </button>
            </form>
          </div>
        )}

        {/* Spotify Metadata Tab */}
        {activeTab === 'spotify' && (
          <div className="bg-gray-900 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Spotify Metadata</h2>
            <form onSubmit={handlePlatformMetadata} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Spotify URL</label>
                <input
                  type="url"
                  value={platformUrl}
                  onChange={(e) => setPlatformUrl(e.target.value)}
                  className="w-full p-2 border border-gray-600 bg-gray-800 rounded"
                  placeholder="https://open.spotify.com/track/..."
                  required
                />
              </div>
              <button
                type="submit"
                disabled={!platformUrl || loading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded"
              >
                {loading ? 'Extracting...' : 'Extract Metadata'}
              </button>
            </form>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="mt-8 bg-green-900 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-green-400 mb-4">Success!</h3>
            <pre className="text-sm text-green-300 overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-8 bg-red-900 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-red-400 mb-2">Error</h3>
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Info */}
        <div className="mt-8 bg-gray-900 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Upload Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Max File Size</p>
              <p className="font-medium">512 MB</p>
            </div>
            <div>
              <p className="text-gray-400">Allowed Types</p>
              <p className="font-medium">Audio files only</p>
            </div>
            <div>
              <p className="text-gray-400">Rate Limits</p>
              <p className="font-medium">File: 10/5min, URL: 5/5min</p>
            </div>
            <div>
              <p className="text-gray-400">Processing</p>
              <p className="font-medium">Automatic transcoding</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
