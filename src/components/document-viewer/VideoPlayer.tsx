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
  Maximize2,
  Minimize2,
  Settings
} from 'lucide-react'

interface VideoPlayerProps {
  document: Document
}

export default function VideoPlayer({ document }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [audioSyncOffset, setAudioSyncOffset] = useState(0)
  const [isBuffering, setIsBuffering] = useState(false)
  const [isAdjustingSync, setIsAdjustingSync] = useState(false)

  useEffect(() => {
    const loadVideo = async () => {
      try {
        console.log('Loading video for document:', {
          id: document.id,
          fileName: document.originalName,
          mimeType: document.mimeType,
          fileKey: document.fileKey,
          fileSize: document.fileSize
        })
        
        // Add cache control headers for better performance
        const response = await fetch(`/api/documents/${document.id}/download`, {
          headers: {
            'Cache-Control': 'max-age=3600',
            'Accept': document.mimeType || 'video/*'
          }
        })
        
        console.log('API response:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries())
        })
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error('API error response:', errorText)
          throw new Error(`Failed to load video: ${response.status} ${response.statusText} - ${errorText}`)
        }
        
        const blob = await response.blob()
        console.log('Video blob loaded:', {
          size: blob.size,
          type: blob.type,
          mimeType: document.mimeType,
          fileName: document.originalName,
          responseStatus: response.status,
          responseHeaders: Object.fromEntries(response.headers.entries())
        })
        
        if (blob.size === 0) {
          throw new Error('Empty video file')
        }
        
        // Check if blob type matches expected MIME type
        if (blob.type !== document.mimeType) {
          console.warn('MIME type mismatch:', {
            blobType: blob.type,
            expectedType: document.mimeType
          })
        }
        
        const url = URL.createObjectURL(blob)
        console.log('Video URL created:', url)
        setVideoUrl(url)
        setIsLoading(false)
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        console.error('Error loading video:', {
          error: error,
          message: errorMsg,
          document: {
            id: document.id,
            fileName: document.originalName,
            mimeType: document.mimeType,
            fileKey: document.fileKey
          }
        })
        setErrorMessage(errorMsg)
        setHasError(true)
        setIsLoading(false)
      }
    }

    loadVideo()

    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl)
      }
    }
  }, [document.id])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const updateTime = () => setCurrentTime(video.currentTime)
    const updateDuration = () => setDuration(video.duration)
    const handleEnded = () => setIsPlaying(false)
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleError = () => {
      const error = video.error
      console.error('Video playback error:', {
        code: error?.code,
        message: error?.message,
        mimeType: document.mimeType,
        fileName: document.originalName
      })
      setHasError(true)
      setIsLoading(false)
    }

    const handleWaiting = () => {
      if (!isAdjustingSync) {
        setIsBuffering(true)
      }
    }
    const handleCanPlay = () => setIsBuffering(false)
    const handleSeeking = () => {
      if (!isAdjustingSync) {
        setIsBuffering(true)
      }
    }
    const handleSeeked = () => setIsBuffering(false)

    // Audio sync correction - only apply when seeking, not during normal playback
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', updateDuration)
    video.addEventListener('ended', handleEnded)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('error', handleError)
    video.addEventListener('waiting', handleWaiting)
    video.addEventListener('canplay', handleCanPlay)
    video.addEventListener('seeking', handleSeeking)
    video.addEventListener('seeked', handleSeeked)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadedmetadata', updateDuration)
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('error', handleError)
      video.removeEventListener('waiting', handleWaiting)
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('seeking', handleSeeking)
      video.removeEventListener('seeked', handleSeeked)
    }
  }, [videoUrl, isAdjustingSync])

  const togglePlayPause = () => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.pause()
    } else {
      video.play()
    }
  }

  const handleSeek = (value: number[]) => {
    const video = videoRef.current
    if (!video) return

    video.currentTime = value[0]
    setCurrentTime(value[0])
  }

  const handleVolumeChange = (value: number[]) => {
    const video = videoRef.current
    if (!video) return

    const newVolume = value[0]
    video.volume = newVolume
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return

    if (isMuted) {
      video.volume = volume
      setIsMuted(false)
    } else {
      video.volume = 0
      setIsMuted(true)
    }
  }

  const skip = (seconds: number) => {
    const video = videoRef.current
    if (!video) return

    video.currentTime = Math.max(0, Math.min(video.currentTime + seconds, duration))
  }

  const changePlaybackRate = (rate: number) => {
    const video = videoRef.current
    if (!video) return

    video.playbackRate = rate
    setPlaybackRate(rate)
  }

  const adjustAudioSync = (offset: number) => {
    const video = videoRef.current
    if (!video || isAdjustingSync) return

    setIsAdjustingSync(true)
    
    setAudioSyncOffset(prev => {
      const newOffset = prev + offset
      console.log('Audio sync adjustment:', { 
        previousOffset: prev, 
        adjustment: offset, 
        newOffset,
        currentTime: video.currentTime
      })
      
      // Apply sync by seeking to adjusted time
      // This is the most reliable way to sync audio with video
      const currentTime = video.currentTime
      const adjustedTime = currentTime + offset
      
      if (adjustedTime >= 0 && adjustedTime <= video.duration) {
        video.currentTime = adjustedTime
      }
      
      // Reset the adjusting flag after a short delay
      setTimeout(() => {
        setIsAdjustingSync(false)
      }, 100)
      
      return newOffset
    })
  }

  const resetAudioSync = () => {
    setAudioSyncOffset(0)
    console.log('Audio sync reset')
  }

  const toggleFullscreen = () => {
    const video = videoRef.current
    if (!video) return

    if (!isFullscreen) {
      if (video.requestFullscreen) {
        video.requestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
    setIsFullscreen(!isFullscreen)
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
          <p className="text-gray-400">Loading video...</p>
        </div>
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-400 mb-2">Video playback error</p>
          <p className="text-gray-400 text-sm mb-2">
            {errorMessage?.includes('File not found') 
              ? 'The video file is missing from storage. Please try re-uploading the file.'
              : errorMessage || 'This video format is not supported or the file is corrupted'
            }
          </p>
          <p className="text-gray-500 text-xs">Format: {document.mimeType}</p>
          <p className="text-gray-500 text-xs">File: {document.originalName}</p>
          {errorMessage?.includes('File not found') && (
            <button 
              onClick={() => window.location.reload()} 
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              Refresh Page
            </button>
          )}
        </div>
      </div>
    )
  }

  if (!videoUrl) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-400">Failed to load video file</p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="relative w-full h-full bg-black group"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={videoUrl || undefined}
        className="w-full h-full object-contain"
        preload="metadata"
        crossOrigin="anonymous"
        playsInline
        webkit-playsinline="true"
        muted={false}
        controls={false}
        autoPlay={false}
        loop={false}
        onClick={togglePlayPause}
        onDoubleClick={toggleFullscreen}
        onError={(e) => {
          const target = e.target as HTMLVideoElement
          const error = target.error
          console.error('Video element error:', {
            event: e,
            error: error,
            code: error?.code,
            message: error?.message,
            networkState: target.networkState,
            readyState: target.readyState,
            src: target.src,
            mimeType: document.mimeType,
            fileName: document.originalName
          })
          setHasError(true)
          setIsLoading(false)
        }}
        onLoadStart={() => {
          console.log('Video load started')
          setIsBuffering(true)
        }}
        onCanPlay={() => {
          console.log('Video can play')
          setIsBuffering(false)
        }}
        onLoadedData={() => {
          console.log('Video data loaded')
          setIsBuffering(false)
        }}
        onWaiting={() => {
          console.log('Video waiting for data')
          setIsBuffering(true)
        }}
        onStalled={() => {
          console.log('Video stalled')
          setIsBuffering(true)
        }}
        onSuspend={() => {
          console.log('Video suspended')
          setIsBuffering(false)
        }}
      />

      {/* Buffering Indicator */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <p className="text-white text-sm">Buffering...</p>
          </div>
        </div>
      )}

      {/* Overlay Controls */}
      {showControls && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end">
          {/* Top Controls */}
          <div className="flex justify-end p-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="text-white hover:text-blue-400"
            >
              {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
            </Button>
          </div>

          {/* Bottom Controls */}
          <div className="p-4 space-y-3">
            {/* Progress Bar */}
            <div>
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={0.1}
                onValueChange={handleSeek}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-white mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Main Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => skip(-10)}
                  className="text-white hover:text-blue-400"
                >
                  <SkipBack className="h-5 w-5" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={togglePlayPause}
                  className="text-white hover:text-blue-400 w-10 h-10"
                >
                  {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => skip(10)}
                  className="text-white hover:text-blue-400"
                >
                  <SkipForward className="h-5 w-5" />
                </Button>

                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleMute}
                    className="text-white hover:text-blue-400"
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
              </div>

              <div className="flex items-center space-x-2">
                {/* Audio Sync Controls */}
                <div className="flex items-center space-x-1 border-r border-gray-600 pr-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => adjustAudioSync(-0.1)}
                    className="text-xs text-white hover:text-blue-400"
                    title="Audio earlier (-0.1s)"
                  >
                    A-
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => adjustAudioSync(0.1)}
                    className="text-xs text-white hover:text-blue-400"
                    title="Audio later (+0.1s)"
                  >
                    A+
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetAudioSync}
                    className="text-xs text-white hover:text-blue-400"
                    title="Reset audio sync"
                  >
                    A0
                  </Button>
                  {audioSyncOffset !== 0 && (
                    <span className="text-xs text-yellow-400 ml-1">
                      {audioSyncOffset > 0 ? '+' : ''}{audioSyncOffset.toFixed(1)}s
                    </span>
                  )}
                </div>

                {/* Playback Rate Controls */}
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => changePlaybackRate(0.5)}
                    className={`text-xs ${playbackRate === 0.5 ? 'text-blue-400' : 'text-white'}`}
                  >
                    0.5x
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => changePlaybackRate(1)}
                    className={`text-xs ${playbackRate === 1 ? 'text-blue-400' : 'text-white'}`}
                  >
                    1x
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => changePlaybackRate(1.25)}
                    className={`text-xs ${playbackRate === 1.25 ? 'text-blue-400' : 'text-white'}`}
                  >
                    1.25x
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => changePlaybackRate(1.5)}
                    className={`text-xs ${playbackRate === 1.5 ? 'text-blue-400' : 'text-white'}`}
                  >
                    1.5x
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
