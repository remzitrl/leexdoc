import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { transcodeQueue } from '@/lib/queue'
import { logger } from '@/lib/security/logging'

// POST /api/admin/clear-failed-jobs - Clear all failed jobs
export async function POST(request: NextRequest) {
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
        description: 'Non-admin user attempted to clear failed jobs',
        userId: session.user.id,
        ip: request.ip || 'unknown'
      })
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get failed jobs count before clearing
    const failedJobs = await transcodeQueue.getFailed()
    const clearedCount = failedJobs.length

    // Clear failed jobs
    await transcodeQueue.clean(0, 100, 'failed')

    // Log admin action
    logger.logAdminAction(
      crypto.randomUUID(),
      session.user.id,
      'clear_failed_jobs',
      undefined,
      { clearedCount }
    )

    return NextResponse.json({ 
      message: `Cleared ${clearedCount} failed jobs`,
      clearedCount
    })
  } catch (error) {
    console.error('Clear failed jobs error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
