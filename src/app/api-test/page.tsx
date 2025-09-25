'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'

export default function APITestPage() {
  const { data: session } = useSession()
  const [results, setResults] = useState<any>({})
  const [loading, setLoading] = useState<string | null>(null)

  if (!session) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to test API routes</h1>
          <a href="/login" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">
            Sign In
          </a>
        </div>
      </div>
    )
  }

  const testAPI = async (endpoint: string, method: string = 'GET', body?: any) => {
    setLoading(endpoint)
    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      })
      
      const data = await response.json()
      setResults(prev => ({ ...prev, [endpoint]: { status: response.status, data } }))
    } catch (error) {
      setResults(prev => ({ ...prev, [endpoint]: { error: error.message } }))
    } finally {
      setLoading(null)
    }
  }

  const createTestPlaylist = () => {
    testAPI('/api/playlists', 'POST', {
      name: 'Test Playlist',
      description: 'A test playlist for API testing'
    })
  }

  const addTrackToPlaylist = (playlistId: string) => {
    // This would need a real track ID from the user's library
    testAPI(`/api/playlists/${playlistId}/items`, 'POST', {
      trackId: 'test-track-id',
      position: 0
    })
  }

  const likeTrack = (trackId: string) => {
    testAPI(`/api/tracks/${trackId}/like`, 'POST')
  }

  const downloadTrack = (trackId: string) => {
    testAPI(`/api/tracks/${trackId}/download`, 'POST', {
      quality: '128'
    })
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">API Routes Test</h1>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Playlist Operations */}
          <div className="bg-gray-900 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Playlist Operations</h2>
            
            <div className="space-y-4">
              <button
                onClick={() => testAPI('/api/playlists')}
                disabled={loading === '/api/playlists'}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded"
              >
                {loading === '/api/playlists' ? 'Loading...' : 'GET /api/playlists'}
              </button>
              
              <button
                onClick={createTestPlaylist}
                disabled={loading === '/api/playlists'}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-2 rounded"
              >
                {loading === '/api/playlists' ? 'Creating...' : 'POST /api/playlists'}
              </button>
              
              <button
                onClick={() => testAPI('/api/playlists?includeItems=true')}
                disabled={loading === '/api/playlists?includeItems=true'}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-4 py-2 rounded"
              >
                {loading === '/api/playlists?includeItems=true' ? 'Loading...' : 'GET /api/playlists?includeItems=true'}
              </button>
            </div>
          </div>

          {/* Library Operations */}
          <div className="bg-gray-900 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Library Operations</h2>
            
            <div className="space-y-4">
              <button
                onClick={() => testAPI('/api/library/tracks')}
                disabled={loading === '/api/library/tracks'}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded"
              >
                {loading === '/api/library/tracks' ? 'Loading...' : 'GET /api/library/tracks'}
              </button>
              
              <button
                onClick={() => testAPI('/api/library/tracks?query=test&sort=title&order=asc')}
                disabled={loading === '/api/library/tracks?query=test&sort=title&order=asc'}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-2 rounded"
              >
                {loading === '/api/library/tracks?query=test&sort=title&order=asc' ? 'Loading...' : 'GET /api/library/tracks (with query)'}
              </button>
              
              <button
                onClick={() => testAPI('/api/library/downloads')}
                disabled={loading === '/api/library/downloads'}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-4 py-2 rounded"
              >
                {loading === '/api/library/downloads' ? 'Loading...' : 'GET /api/library/downloads'}
              </button>
            </div>
          </div>

          {/* Track Operations */}
          <div className="bg-gray-900 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Track Operations</h2>
            
            <div className="space-y-4">
              <button
                onClick={() => likeTrack('test-track-id')}
                disabled={loading === '/api/tracks/test-track-id/like'}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 px-4 py-2 rounded"
              >
                {loading === '/api/tracks/test-track-id/like' ? 'Processing...' : 'POST /api/tracks/:id/like'}
              </button>
              
              <button
                onClick={() => testAPI('/api/tracks/test-track-id/like', 'DELETE')}
                disabled={loading === '/api/tracks/test-track-id/like'}
                className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 px-4 py-2 rounded"
              >
                {loading === '/api/tracks/test-track-id/like' ? 'Processing...' : 'DELETE /api/tracks/:id/like'}
              </button>
              
              <button
                onClick={() => downloadTrack('test-track-id')}
                disabled={loading === '/api/tracks/test-track-id/download'}
                className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 px-4 py-2 rounded"
              >
                {loading === '/api/tracks/test-track-id/download' ? 'Processing...' : 'POST /api/tracks/:id/download'}
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="bg-gray-900 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">API Results</h2>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {Object.entries(results).map(([endpoint, result]) => (
                <div key={endpoint} className="border border-gray-700 p-3 rounded">
                  <div className="font-mono text-sm text-gray-300 mb-2">{endpoint}</div>
                  <pre className="text-xs text-gray-400 overflow-x-auto">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
