import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { storage } from '@/lib/storage'

export async function GET(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const key = decodeURIComponent(params.key)
    
    // Check if file exists
    const objectInfo = await storage.headObject(key)
    if (!objectInfo) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    // For local storage, serve the file directly
    if (storage.constructor.name === 'LocalDiskStorage') {
      const { getObjectStream } = await import('@/lib/storage/local-disk-storage')
      const localStorage = storage as any
      const stream = await localStorage.getObjectStream(key)
      
      return new NextResponse(stream as any, {
        headers: {
          'Content-Type': objectInfo.contentType,
          'Content-Length': objectInfo.size.toString(),
          'Cache-Control': 'public, max-age=31536000', // 1 year cache
        },
      })
    }

    // For S3, redirect to signed URL
    const signedUrl = await storage.getSignedUrl(key, {
      expiresIn: 3600, // 1 hour
    })

    return NextResponse.redirect(signedUrl)

  } catch (error: any) {
    console.error('File serving error:', error)
    return NextResponse.json(
      { error: 'Failed to serve file' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const key = decodeURIComponent(params.key)
    
    // Check if user owns the file (basic check by prefix)
    if (!key.startsWith(session.user.id)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const success = await storage.deleteObject(key)
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete file' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    )
  }
}
