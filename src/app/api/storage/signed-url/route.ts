import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { storage } from '@/lib/storage'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { key, expiresIn = 3600 } = await request.json()

    if (!key) {
      return NextResponse.json(
        { error: 'Key is required' },
        { status: 400 }
      )
    }

    // Check if user owns the file (basic check by prefix)
    if (!key.startsWith(session.user.id)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Check if file exists
    const objectInfo = await storage.headObject(key)
    if (!objectInfo) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    // Generate signed URL
    const signedUrl = await storage.getSignedUrl(key, {
      expiresIn: Math.min(expiresIn, 86400), // Max 24 hours
    })

    return NextResponse.json({
      url: signedUrl,
      expiresIn,
      objectInfo: {
        key: objectInfo.key,
        size: objectInfo.size,
        contentType: objectInfo.contentType,
        lastModified: objectInfo.lastModified,
      },
    })

  } catch (error: any) {
    console.error('Signed URL error:', error)
    return NextResponse.json(
      { error: 'Failed to generate signed URL' },
      { status: 500 }
    )
  }
}
