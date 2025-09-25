'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { Youtube, Music, ExternalLink } from 'lucide-react'

interface MetadataUploadProps {
  platform: 'youtube' | 'spotify'
}

export default function MetadataUpload({ platform }: MetadataUploadProps) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [metadata, setMetadata] = useState<any>(null)

  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    setLoading(true)
    setError('')
    setMetadata(null)

    try {
      const endpoint = platform === 'youtube' ? '/api/upload/youtube' : '/api/upload/spotify'
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to extract metadata')
      }

      setMetadata(data)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to extract metadata')
    } finally {
      setLoading(false)
    }
  }

  const getPlatformIcon = () => {
    return platform === 'youtube' ? (
      <Youtube className="w-5 h-5 text-red-500" />
    ) : (
      <Music className="w-5 h-5 text-green-500" />
    )
  }

  const getPlatformName = () => {
    return platform === 'youtube' ? 'YouTube' : 'Spotify'
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleExtract} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="url">{getPlatformName()} URL</Label>
          <div className="flex gap-2">
            <Input
              id="url"
              type="url"
              placeholder={`https://${platform}.com/...`}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
              className="flex-1"
            />
            <Button type="submit" disabled={loading || !url.trim()}>
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                getPlatformIcon()
              )}
            </Button>
          </div>
          <p className="text-sm text-gray-400">
            Enter a {getPlatformName()} URL to extract metadata
          </p>
        </div>
      </form>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {metadata && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              {metadata.coverUrl && (
                <img
                  src={metadata.coverUrl}
                  alt={metadata.title}
                  className="w-16 h-16 rounded object-cover"
                />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-lg truncate">{metadata.title}</h3>
                <p className="text-gray-400 truncate">{metadata.artist}</p>
                {metadata.album && (
                  <p className="text-sm text-gray-500 truncate">{metadata.album}</p>
                )}
                {metadata.duration && (
                  <p className="text-sm text-gray-500">
                    {Math.floor(metadata.duration / 60)}:{(metadata.duration % 60).toString().padStart(2, '0')}
                  </p>
                )}
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded">
              <p className="text-sm text-yellow-200">
                <strong>Note:</strong> Audio file not downloaded due to legal restrictions. 
                Please upload the audio file separately for offline playback.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
