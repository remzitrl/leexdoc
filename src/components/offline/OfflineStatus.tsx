'use client'

import { useState, useEffect } from 'react'
import { offlineManager } from '@/lib/offline/manager'

export default function OfflineStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [isWiFi, setIsWiFi] = useState(false)
  const [storageUsage, setStorageUsage] = useState({
    totalBytes: 0,
    trackCount: 0,
  })

  useEffect(() => {
    // Initial connection status
    setIsOnline(navigator.onLine)
    
    // Connection type detection
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      setIsWiFi(connection.effectiveType === 'wifi' || connection.type === 'wifi')
    }

    // Load storage usage
    loadStorageUsage()

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Update storage usage periodically
    const interval = setInterval(loadStorageUsage, 30000) // Every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [])

  const loadStorageUsage = async () => {
    try {
      const usage = await offlineManager.getStorageUsage()
      setStorageUsage(usage)
    } catch (error) {
      console.error('Failed to load storage usage:', error)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  if (!isOnline) {
    return (
      <div className="fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">Offline Mode</span>
        </div>
      </div>
    )
  }

  if (storageUsage.trackCount > 0) {
    return (
      <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-white rounded-full"></div>
          <span className="text-sm font-medium">
            {storageUsage.trackCount} offline • {formatBytes(storageUsage.totalBytes)}
          </span>
        </div>
      </div>
    )
  }

  return null
}
