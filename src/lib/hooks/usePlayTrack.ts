import { useAudioPlayerStore } from '@/lib/audio-player-store'

export function usePlayTrack() {
  const { setCurrentTrack, setQueue, addToQueue, queue } = useAudioPlayerStore()

  const playTrack = (track: any, playNow: boolean = true) => {
    const audioTrack = {
      id: track.id,
      title: track.title,
      artist: track.artist,
      album: track.album,
      duration: track.durationSec || 0,
      coverImageKey: track.coverImageKey,
      audio128Key: track.audio128Key,
      audio320Key: track.audio320Key,
      waveformJsonKey: track.waveformJsonKey,
    }

    if (playNow) {
      // Play immediately and add to queue
      setCurrentTrack(audioTrack, 0)
      if (queue.length === 0) {
        setQueue([audioTrack])
      } else {
        addToQueue(audioTrack)
      }
    } else {
      // Just add to queue
      addToQueue(audioTrack)
    }
  }

  const playPlaylist = (tracks: any[]) => {
    const audioTracks = tracks.map(track => ({
      id: track.id,
      title: track.title,
      artist: track.artist,
      album: track.album,
      duration: track.durationSec || 0,
      coverImageKey: track.coverImageKey,
      audio128Key: track.audio128Key,
      audio320Key: track.audio320Key,
      waveformJsonKey: track.waveformJsonKey,
    }))

    setQueue(audioTracks)
    if (audioTracks.length > 0) {
      setCurrentTrack(audioTracks[0], 0)
    }
  }

  return { playTrack, playPlaylist }
}
