import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { transcodeQueue } from '@/lib/queue'
import { logger } from '@/lib/security/logging'

// POST /api/admin/retry-failed-jobs - Retry all failed jobs
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
        description: 'Non-admin user attempted to retry failed jobs',
        userId: session.user.id,
        ip: request.ip || 'unknown'
      })
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get failed jobs
    const failedJobs = await transcodeQueue.getFailed()
    let retriedCount = 0

    // Retry each failed job
    for (const job of failedJobs) {
      try {
        await job.retry()
        retriedCount++
      } catch (error) {
        console.error(`Failed to retry job ${job.id}:`, error)
      }
    }

    // Log admin action
    logger.logAdminAction(
      crypto.randomUUID(),
      session.user.id,
      'retry_failed_jobs',
      undefined,
      { retriedCount, totalFailed: failedJobs.length }
    )

    return NextResponse.json({ 
      message: `Retried ${retriedCount} failed jobs`,
      retriedCount,
      totalFailed: failedJobs.length
    })
  } catch (error) {
    console.error('Retry failed jobs error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
