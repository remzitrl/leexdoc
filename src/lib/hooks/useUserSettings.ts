import { useEffect } from 'react'
import { useAudioPlayerStore } from '@/lib/audio-player-store'

export function useUserSettings() {
  const { setQuality } = useAudioPlayerStore()

  useEffect(() => {
    // Load user settings from API
    const loadUserSettings = async () => {
      try {
        const response = await fetch('/api/user/settings')
        if (response.ok) {
          const settings = await response.json()
          
          // Apply quality setting
          if (settings.defaultQuality) {
            const quality = settings.defaultQuality === 'q128' ? '128' : '320'
            setQuality(quality)
          }
        }
      } catch (error) {
        console.warn('Failed to load user settings:', error)
      }
    }

    loadUserSettings()
  }, [setQuality])
}
