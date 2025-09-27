'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Settings, Lock, Download, HardDrive } from 'lucide-react'
import { offlineManager } from '@/lib/offline/manager'
import { type OfflineTrack } from '@/lib/offline/database'
import { type OfflineDocument } from '@/lib/offline/database'

interface PasswordChange {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [passwordData, setPasswordData] = useState<PasswordChange>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Offline library state
  const [tracks, setTracks] = useState<OfflineTrack[]>([])
  const [documents, setDocuments] = useState<OfflineDocument[]>([])
  const [activeTab, setActiveTab] = useState<'tracks' | 'documents'>('documents')
  const [storageUsage, setStorageUsage] = useState({
    totalBytes: 0,
    trackCount: 0,
    documentCount: 0,
    byQuality: { '128': 0, '320': 0 },
  })
  const [offlineLoading, setOfflineLoading] = useState(true)

  // Load offline data
  useEffect(() => {
    loadOfflineTracks()
    loadOfflineDocuments()
    loadStorageUsage()
  }, [])

  const loadOfflineTracks = async () => {
    try {
      const offlineTracks = await offlineManager.getAllOfflineTracks()
      setTracks(offlineTracks)
    } catch (error) {
      console.error('Failed to load offline tracks:', error)
    } finally {
      setOfflineLoading(false)
    }
  }

  const loadOfflineDocuments = async () => {
    try {
      const offlineDocuments = await offlineManager.getAllOfflineDocuments()
      setDocuments(offlineDocuments)
    } catch (error) {
      console.error('Failed to load offline documents:', error)
    }
  }

  const loadStorageUsage = async () => {
    try {
      const [trackUsage, documentUsage] = await Promise.all([
        offlineManager.getStorageUsage(),
        offlineManager.getDocumentStorageUsage()
      ])
      
      setStorageUsage({
        totalBytes: trackUsage.totalBytes + documentUsage.totalBytes,
        trackCount: trackUsage.trackCount,
        documentCount: documentUsage.documentCount,
        byQuality: trackUsage.byQuality,
      })
    } catch (error) {
      console.error('Failed to load storage usage:', error)
    }
  }

  const handleRemoveTrack = async (trackId: string) => {
    try {
      await offlineManager.removeOffline(trackId)
      await loadOfflineTracks()
      await loadStorageUsage()
    } catch (error) {
      console.error('Failed to remove track:', error)
    }
  }

  const handleRemoveDocument = async (documentId: string) => {
    try {
      await offlineManager.removeDocumentOffline(documentId)
      await loadOfflineDocuments()
      await loadStorageUsage()
    } catch (error) {
      console.error('Failed to remove document:', error)
    }
  }

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear all offline data?')) {
      try {
        await offlineManager.clearAllOfflineData()
        await loadOfflineTracks()
        await loadOfflineDocuments()
        await loadStorageUsage()
      } catch (error) {
        console.error('Failed to clear offline data:', error)
      }
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match')
      return
    }

    if (passwordData.newPassword.length < 6) {
      setError('New password must be at least 6 characters long')
      return
    }

    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to change password')
      }

      setSuccess('Password changed successfully')
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
          </div>
          <p className="text-lg text-slate-600 font-medium">Loading settings...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    router.push('/login')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 font-poppins mb-3">Settings</h1>
            <p className="text-gray-600 text-lg">Manage your account settings and offline library</p>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="mb-6">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Password Change Card */}
            <Card className="card-primary rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-3 text-2xl font-semibold text-gray-900">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Lock className="w-6 h-6 text-gray-700" />
                  </div>
                  Change Password
                </CardTitle>
                <CardDescription className="text-gray-600 text-base">
                  Update your account password for better security
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword" className="text-sm font-medium text-gray-700">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="h-12 text-base input-primary rounded-lg"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="h-12 text-base input-primary rounded-lg"
                      required
                      minLength={6}
                    />
                    <p className="text-sm text-gray-500">Password must be at least 6 characters long</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="h-12 text-base input-primary rounded-lg"
                      required
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button 
                      type="submit" 
                      disabled={saving} 
                      className="btn-primary px-8 py-3 h-12 text-base font-medium rounded-lg"
                    >
                      {saving ? 'Changing Password...' : 'Change Password'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Offline Library Card */}
            <Card className="card-primary rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-3 text-2xl font-semibold text-gray-900">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <HardDrive className="w-6 h-6 text-gray-700" />
                  </div>
                  Offline Library
                </CardTitle>
                <CardDescription className="text-gray-600 text-base">
                  Manage your offline documents and tracks
                </CardDescription>
              </CardHeader>
              <CardContent>
                {offlineLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading offline library...</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Storage Usage */}
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                      <h3 className="text-lg font-semibold mb-4 text-gray-900">Storage Usage</h3>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-blue-600 mb-1">
                            {formatBytes(storageUsage.totalBytes)}
                          </div>
                          <div className="text-gray-600 text-sm font-medium">Total Storage</div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-green-600 mb-1">
                            {storageUsage.documentCount + storageUsage.trackCount}
                          </div>
                          <div className="text-gray-600 text-sm font-medium">Total Items</div>
                        </div>
                      </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
                      <button
                        onClick={() => setActiveTab('documents')}
                        className={`flex-1 px-4 py-2 rounded-md font-medium transition-all duration-200 ${
                          activeTab === 'documents'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        Documents ({documents.length})
                      </button>
                      <button
                        onClick={() => setActiveTab('tracks')}
                        className={`flex-1 px-4 py-2 rounded-md font-medium transition-all duration-200 ${
                          activeTab === 'tracks'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        Tracks ({tracks.length})
                      </button>
                    </div>

                    {/* Content */}
                    <div className="max-h-80 overflow-y-auto">
                      {activeTab === 'documents' ? (
                        <>
                          {documents.length === 0 ? (
                            <div className="text-center py-12">
                              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Download className="w-8 h-8 text-gray-400" />
                              </div>
                              <div className="text-gray-600 text-lg font-medium mb-2">No offline documents</div>
                              <p className="text-gray-500 text-sm max-w-sm mx-auto">
                                Upload files and they will be automatically downloaded for offline access
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {documents.map((document) => (
                                <div
                                  key={document.documentId}
                                  className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-gray-900 truncate">{document.title}</div>
                                    <div className="text-gray-500 text-sm">
                                      {document.originalName} • {formatBytes(document.bytesStored)}
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRemoveDocument(document.documentId)}
                                    className="h-8 px-3 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 transition-colors"
                                  >
                                    Remove
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          {tracks.length === 0 ? (
                            <div className="text-center py-12">
                              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Download className="w-8 h-8 text-gray-400" />
                              </div>
                              <div className="text-gray-600 text-lg font-medium mb-2">No offline tracks</div>
                              <p className="text-gray-500 text-sm max-w-sm mx-auto">
                                Download tracks for offline playback
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {tracks.map((track) => (
                                <div
                                  key={track.trackId}
                                  className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-gray-900 truncate">
                                      {track.metadata?.title || 'Unknown Title'}
                                    </div>
                                    <div className="text-gray-500 text-sm">
                                      {track.metadata?.artist || 'Unknown Artist'} • {formatBytes(track.bytesStored)}
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRemoveTrack(track.trackId)}
                                    className="h-8 px-3 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 transition-colors"
                                  >
                                    Remove
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Clear All Button */}
                    {(documents.length > 0 || tracks.length > 0) && (
                      <div className="pt-4 border-t border-gray-200">
                        <Button
                          onClick={handleClearAll}
                          variant="outline"
                          className="w-full h-11 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 transition-colors font-medium"
                        >
                          Clear All Offline Data
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
