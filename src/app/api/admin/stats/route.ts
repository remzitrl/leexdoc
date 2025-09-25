import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { transcodeQueue } from '@/lib/queue'
import { logger } from '@/lib/security/logging'

// GET /api/admin/stats - Get admin dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (user?.role !== 'admin') {
      logger.logSecurityEvent({
        type: 'admin_access_denied',
        severity: 'high',
        description: 'Non-admin user attempted to access admin stats',
        userId: session.user.id,
        ip: request.ip || 'unknown'
      })
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get system statistics
    const [
      totalUsers,
      totalTracks,
      totalUploads,
      storageStats,
      queueStats,
      recentSecurityEvents
    ] = await Promise.all([
      // Total users
      db.user.count(),
      
      // Total tracks
      db.track.count(),
      
      // Total uploads
      db.upload.count(),
      
      // Storage usage (approximate)
      db.track.aggregate({
        _sum: {
          // This would need to be calculated based on actual file sizes
          // For now, we'll use a placeholder
        }
      }),
      
      // Queue statistics
      getQueueStats(),
      
      // Recent security events
      logger.getSecurityEvents(50)
    ])

    // Calculate storage usage (placeholder - would need actual file size tracking)
    const totalStorageUsed = 0 // This would be calculated from actual file sizes

    const stats = {
      totalUsers,
      totalTracks,
      totalUploads,
      totalStorageUsed,
      queueStats,
      recentSecurityEvents
    }

    // Log admin access
    logger.logAdminAction(
      crypto.randomUUID(),
      session.user.id,
      'view_admin_stats',
      undefined,
      { stats }
    )

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function getQueueStats() {
  try {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      transcodeQueue.getWaiting(),
      transcodeQueue.getActive(),
      transcodeQueue.getCompleted(),
      transcodeQueue.getFailed(),
      transcodeQueue.getDelayed()
    ])

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length
    }
  } catch (error) {
    console.error('Queue stats error:', error)
    return {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0
    }
  }
}
