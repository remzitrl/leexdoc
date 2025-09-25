'use client'

import { useState, useEffect, useRef } from 'react'
import { Document } from '@/lib/document-store'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  SkipBack, 
  SkipForward,
  RotateCcw,
  Shuffle
} from 'lucide-react'

interface AudioPlayerProps {
  document: Document
}

export default function AudioPlayer({ document }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const loadAudio = async () => {
      try {
        // Check if document has a direct URL (for testing)
        if (document.url) {
          setAudioUrl(document.url)
          setIsLoading(false)
          return
        }
        
        const response = await fetch(`/api/documents/${document.id}/download`)
        if (!response.ok) throw new Error('Failed to load audio')
        
        const blob = await response.blob()
        
        if (blob.size === 0) {
          throw new Error('Empty audio file')
        }
        
        // Check if blob type matches expected MIME type
        if (blob.type !== document.mimeType) {
          // Don't treat MIME type mismatch as an error, just log it
        }
        
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        setIsLoading(false)
      } catch (error) {
        setHasError(true)
        setIsLoading(false)
      }
    }

    loadAudio()

    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [document.id, document.url])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)
    const handleEnded = () => setIsPlaying(false)
    const handleError = () => {
      const error = audio.error
      setHasError(true)
      setIsLoading(false)
    }

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
    }
  }, [audioUrl])

  const togglePlayPause = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current
    if (!audio) return

    audio.currentTime = value[0]
    setCurrentTime(value[0])
  }

  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current
    if (!audio) return

    const newVolume = value[0]
    audio.volume = newVolume
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isMuted) {
      audio.volume = volume
      setIsMuted(false)
    } else {
      audio.volume = 0
      setIsMuted(true)
    }
  }

  const skip = (seconds: number) => {
    const audio = audioRef.current
    if (!audio) return

    audio.currentTime = Math.max(0, Math.min(audio.currentTime + seconds, duration))
  }

  const changePlaybackRate = (rate: number) => {
    const audio = audioRef.current
    if (!audio) return

    audio.playbackRate = rate
    setPlaybackRate(rate)
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading audio...</p>
        </div>
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-400 mb-2">Audio playback error</p>
          <p className="text-gray-400 text-sm">This audio format is not supported or the file is corrupted</p>
          <p className="text-gray-500 text-xs mt-2">Format: {document.mimeType}</p>
        </div>
      </div>
    )
  }

  if (!audioUrl) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-400">Failed to load audio file</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-slate-800">
      {/* Audio Element */}
      <audio
        ref={audioRef}
        src={audioUrl || undefined}
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onError={(e) => {
          const target = e.target as HTMLAudioElement
          const error = target.error
          
          // Get error message based on code
          let errorMessage = 'Unknown error'
          switch (error?.code) {
            case 1: errorMessage = 'MEDIA_ERR_ABORTED - Audio loading aborted'; break
            case 2: errorMessage = 'MEDIA_ERR_NETWORK - Network error loading audio'; break
            case 3: errorMessage = 'MEDIA_ERR_DECODE - Audio decoding error'; break
            case 4: errorMessage = 'MEDIA_ERR_SRC_NOT_SUPPORTED - Audio format not supported'; break
          }
          
          
          // For code 4 (unsupported format), try to fallback
          if (error?.code === 4) {
          }
          
          setHasError(true)
          setIsLoading(false)
        }}
      />

      {/* Album Art Placeholder */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-64 h-64 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
          <div className="text-center text-white">
            <div className="text-6xl mb-2">🎵</div>
            <div className="text-lg font-semibold">{document.title}</div>
            <div className="text-sm opacity-75">{document.documentType}</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-6 bg-slate-900">
        {/* Progress Bar */}
        <div className="mb-4">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Main Controls */}
        <div className="flex items-center justify-center space-x-4 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => skip(-10)}
            className="text-gray-400 hover:text-white"
          >
            <SkipBack className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={togglePlayPause}
            className="text-white hover:text-blue-400 w-12 h-12"
          >
            {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => skip(10)}
            className="text-gray-400 hover:text-white"
          >
            <SkipForward className="h-5 w-5" />
          </Button>
        </div>

        {/* Secondary Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              className="text-gray-400 hover:text-white"
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume]}
              max={1}
              step={0.01}
              onValueChange={handleVolumeChange}
              className="w-20"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => changePlaybackRate(0.5)}
              className={`text-xs ${playbackRate === 0.5 ? 'text-blue-400' : 'text-gray-400'}`}
            >
              0.5x
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => changePlaybackRate(1)}
              className={`text-xs ${playbackRate === 1 ? 'text-blue-400' : 'text-gray-400'}`}
            >
              1x
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => changePlaybackRate(1.25)}
              className={`text-xs ${playbackRate === 1.25 ? 'text-blue-400' : 'text-gray-400'}`}
            >
              1.25x
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => changePlaybackRate(1.5)}
              className={`text-xs ${playbackRate === 1.5 ? 'text-blue-400' : 'text-gray-400'}`}
            >
              1.5x
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
