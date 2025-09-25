'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Shield, 
  Users, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock,
  Activity,
  Database,
  Server
} from 'lucide-react'

interface QueueStats {
  waiting: number
  active: number
  completed: number
  failed: number
  delayed: number
}

interface SecurityEvent {
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  requestId: string
  userId?: string
  ip: string
  timestamp: string
  additionalData?: Record<string, any>
}

interface SystemStats {
  totalUsers: number
  totalTracks: number
  totalUploads: number
  totalStorageUsed: number
  queueStats: QueueStats
  recentSecurityEvents: SecurityEvent[]
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/login')
      return
    }

    if (session.user?.role !== 'admin') {
      router.push('/')
      return
    }

    loadStats()
  }, [session, status, router])

  const loadStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/stats')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load admin stats')
      }

      setStats(data)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load stats')
    } finally {
      setLoading(false)
    }
  }

  const refreshStats = async () => {
    setRefreshing(true)
    await loadStats()
    setRefreshing(false)
  }

  const retryFailedJobs = async () => {
    try {
      const response = await fetch('/api/admin/retry-failed-jobs', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to retry failed jobs')
      }

      await loadStats()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to retry jobs')
    }
  }

  const clearFailedJobs = async () => {
    if (!confirm('Are you sure you want to clear all failed jobs? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch('/api/admin/clear-failed-jobs', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to clear failed jobs')
      }

      await loadStats()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to clear jobs')
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive'
      case 'high': return 'destructive'
      case 'medium': return 'default'
      case 'low': return 'secondary'
      default: return 'secondary'
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  if (!session || session.user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-gray-400">Admin access required</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-gray-400">System monitoring and management</p>
          </div>
          <Button onClick={refreshStats} disabled={refreshing}>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-8 w-16" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : stats ? (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="queue">Queue Status</TabsTrigger>
              <TabsTrigger value="security">Security Events</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* System Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-400">Total Users</p>
                        <p className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</p>
                      </div>
                      <Users className="h-8 w-8 text-blue-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-400">Total Tracks</p>
                        <p className="text-2xl font-bold">{stats.totalTracks.toLocaleString()}</p>
                      </div>
                      <FileText className="h-8 w-8 text-green-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-400">Total Uploads</p>
                        <p className="text-2xl font-bold">{stats.totalUploads.toLocaleString()}</p>
                      </div>
                      <Database className="h-8 w-8 text-purple-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-400">Storage Used</p>
                        <p className="text-2xl font-bold">{formatBytes(stats.totalStorageUsed)}</p>
                      </div>
                      <Server className="h-8 w-8 text-orange-400" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Queue Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Queue Status
                  </CardTitle>
                  <CardDescription>
                    Current processing queue status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-400">{stats.queueStats.waiting}</div>
                      <div className="text-sm text-gray-400">Waiting</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">{stats.queueStats.active}</div>
                      <div className="text-sm text-gray-400">Active</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">{stats.queueStats.completed}</div>
                      <div className="text-sm text-gray-400">Completed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-400">{stats.queueStats.failed}</div>
                      <div className="text-sm text-gray-400">Failed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-400">{stats.queueStats.delayed}</div>
                      <div className="text-sm text-gray-400">Delayed</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="queue" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Queue Management</CardTitle>
                  <CardDescription>
                    Manage processing queue and failed jobs
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4">
                    <Button onClick={retryFailedJobs} disabled={stats.queueStats.failed === 0}>
                      Retry Failed Jobs ({stats.queueStats.failed})
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={clearFailedJobs}
                      disabled={stats.queueStats.failed === 0}
                    >
                      Clear Failed Jobs
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">Queue Statistics</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Waiting:</span>
                          <span className="text-yellow-400">{stats.queueStats.waiting}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Active:</span>
                          <span className="text-blue-400">{stats.queueStats.active}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Completed:</span>
                          <span className="text-green-400">{stats.queueStats.completed}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Failed:</span>
                          <span className="text-red-400">{stats.queueStats.failed}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Delayed:</span>
                          <span className="text-orange-400">{stats.queueStats.delayed}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Security Events</CardTitle>
                  <CardDescription>
                    Latest security events and potential threats
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {stats.recentSecurityEvents.length === 0 ? (
                    <div className="text-center py-8">
                      <Shield className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-400">No recent security events</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {stats.recentSecurityEvents.map((event, index) => (
                        <div key={index} className="flex items-start gap-4 p-4 border border-gray-700 rounded-lg">
                          <div className="flex-shrink-0">
                            {event.severity === 'critical' ? (
                              <XCircle className="w-5 h-5 text-red-400" />
                            ) : event.severity === 'high' ? (
                              <AlertTriangle className="w-5 h-5 text-orange-400" />
                            ) : (
                              <CheckCircle className="w-5 h-5 text-green-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={getSeverityColor(event.severity)}>
                                {event.severity.toUpperCase()}
                              </Badge>
                              <span className="text-sm text-gray-400">
                                {formatDate(event.timestamp)}
                              </span>
                            </div>
                            <p className="font-medium">{event.description}</p>
                            <div className="text-sm text-gray-400 mt-1">
                              <span>IP: {event.ip}</span>
                              {event.userId && <span> • User: {event.userId}</span>}
                              <span> • ID: {event.requestId}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : null}
      </div>
    </div>
  )
}
