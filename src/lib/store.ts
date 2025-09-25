import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AudioPlayerState, Track } from '@/types'

interface AudioPlayerStore extends AudioPlayerState {
  // Actions
  setCurrentTrack: (track: Track | null) => void
  play: () => void
  pause: () => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  setVolume: (volume: number) => void
  toggleMute: () => void
  toggleShuffle: () => void
  setRepeatMode: (mode: 'none' | 'one' | 'all') => void
  setQueue: (tracks: Track[]) => void
  addToQueue: (track: Track) => void
  removeFromQueue: (index: number) => void
  nextTrack: () => void
  previousTrack: () => void
  clearQueue: () => void
}

export const useAudioPlayerStore = create<AudioPlayerStore>()(
  persist(
    (set, get) => ({
      // Initial state
      currentTrack: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: 1,
      isMuted: false,
      isShuffled: false,
      repeatMode: 'none',
      queue: [],
      currentIndex: 0,

      // Actions
      setCurrentTrack: (track) => set({ currentTrack: track }),
      
      play: () => set({ isPlaying: true }),
      
      pause: () => set({ isPlaying: false }),
      
      setCurrentTime: (time) => set({ currentTime: time }),
      
      setDuration: (duration) => set({ duration }),
      
      setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),
      
      toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
      
      toggleShuffle: () => set((state) => ({ isShuffled: !state.isShuffled })),
      
      setRepeatMode: (mode) => set({ repeatMode: mode }),
      
      setQueue: (tracks) => set({ queue: tracks, currentIndex: 0 }),
      
      addToQueue: (track) => set((state) => ({ 
        queue: [...state.queue, track] 
      })),
      
      removeFromQueue: (index) => set((state) => {
        const newQueue = state.queue.filter((_, i) => i !== index)
        const newIndex = index < state.currentIndex 
          ? state.currentIndex - 1 
          : state.currentIndex
        return { 
          queue: newQueue, 
          currentIndex: Math.min(newIndex, newQueue.length - 1)
        }
      }),
      
      nextTrack: () => set((state) => {
        if (state.queue.length === 0) return state
        
        let nextIndex = state.currentIndex + 1
        
        if (state.repeatMode === 'one') {
          nextIndex = state.currentIndex
        } else if (state.repeatMode === 'all' && nextIndex >= state.queue.length) {
          nextIndex = 0
        } else if (nextIndex >= state.queue.length) {
          nextIndex = state.currentIndex
        }
        
        return { 
          currentIndex: nextIndex,
          currentTrack: state.queue[nextIndex] || null
        }
      }),
      
      previousTrack: () => set((state) => {
        if (state.queue.length === 0) return state
        
        let prevIndex = state.currentIndex - 1
        
        if (state.repeatMode === 'one') {
          prevIndex = state.currentIndex
        } else if (state.repeatMode === 'all' && prevIndex < 0) {
          prevIndex = state.queue.length - 1
        } else if (prevIndex < 0) {
          prevIndex = state.currentIndex
        }
        
        return { 
          currentIndex: prevIndex,
          currentTrack: state.queue[prevIndex] || null
        }
      }),
      
      clearQueue: () => set({ 
        queue: [], 
        currentIndex: 0, 
        currentTrack: null 
      }),
    }),
    {
      name: 'audio-player-storage',
      partialize: (state) => ({
        volume: state.volume,
        isMuted: state.isMuted,
        isShuffled: state.isShuffled,
        repeatMode: state.repeatMode,
      }),
    }
  )
)
