import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { storage } from '@/lib/storage'
import { existsSync } from 'fs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (user?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const uploadId = params.id

    // Get upload record
    const upload = await db.upload.findUnique({
      where: { id: uploadId },
      include: {
        user: {
          select: { id: true, email: true }
        }
      }
    })

    if (!upload) {
      return NextResponse.json({ error: 'Upload not found' }, { status: 404 })
    }

    // Check temp file existence
    const tempPath = upload.rawFilename // This should be the temp path
    const tempExists = existsSync(tempPath)

    // Check storage existence
    let storageExists = false
    let storageInfo = null
    try {
      storageInfo = await storage.headObject(upload.rawFilename)
      storageExists = true
    } catch (error) {
      storageExists = false
    }

    return NextResponse.json({
      upload: {
        id: upload.id,
        userId: upload.userId,
        userEmail: upload.user?.email,
        method: upload.method,
        rawFilename: upload.rawFilename,
        rawSize: upload.rawSize,
        mime: upload.mime,
        status: upload.status,
        createdAt: upload.createdAt,
        updatedAt: upload.updatedAt
      },
      files: {
        tempExists,
        tempPath,
        storageExists,
        storageInfo
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Debug upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
