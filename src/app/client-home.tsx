'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Music, Upload, Library, Play, Headphones, Download } from 'lucide-react'

export default function ClientHome() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (session) {
    // Authenticated user content
    return (
      <div className="space-y-8">
        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:bg-gray-900/50 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Library className="w-5 h-5 text-blue-400" />
                Library
              </CardTitle>
              <CardDescription>
                Browse your document collection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/documents">View Documents</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:bg-gray-900/50 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Upload className="w-5 h-5 text-green-400" />
                Upload
              </CardTitle>
              <CardDescription>
                Add new music to your library
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/upload">Upload Music</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:bg-gray-900/50 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Music className="w-5 h-5 text-purple-400" />
                Playlists
              </CardTitle>
              <CardDescription>
                Create and manage playlists
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/playlists">Manage Playlists</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:bg-gray-900/50 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Play className="w-5 h-5 text-orange-400" />
                Player
              </CardTitle>
              <CardDescription>
                Control your music playback
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/player">Open Player</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Headphones className="w-5 h-5 text-blue-400" />
                Offline Playback
              </CardTitle>
              <CardDescription>
                Download your music for offline listening
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-gray-300">
                <li>• Download tracks for offline use</li>
                <li>• Works without internet connection</li>
                <li>• Multiple quality options</li>
                <li>• Storage usage tracking</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5 text-green-400" />
                Smart Features
              </CardTitle>
              <CardDescription>
                Advanced music management capabilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-gray-300">
                <li>• Automatic audio transcoding</li>
                <li>• Waveform visualization</li>
                <li>• Drag & drop playlist reordering</li>
                <li>• PWA support for mobile</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Guest user content
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-4">Welcome to Mixora</h2>
        <p className="text-xl text-gray-400 mb-8">
          Your personal offline music player with advanced features
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/register">Get Started</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-400" />
              Upload & Transcode
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300">
              Upload your music files and let Mixora automatically transcode them 
              to multiple quality levels for optimal playback.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Headphones className="w-5 h-5 text-green-400" />
              Offline Listening
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300">
              Download your favorite tracks for offline listening. 
              Perfect for commutes, flights, or areas with poor connectivity.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="w-5 h-5 text-purple-400" />
              Smart Playlists
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300">
              Create and manage playlists with drag & drop reordering. 
              Organize your music exactly how you want it.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
