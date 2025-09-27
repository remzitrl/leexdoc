import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { storage } from '@/lib/storage'
import { generateUniqueKey } from '@/lib/storage/validation'

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

    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string || 'uploads'

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Generate unique key
    const key = generateUniqueKey(file.name, `${session.user.id}/${folder}`)
    
    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Upload to storage
    const result = await storage.putObject(key, buffer, {
      contentType: file.type,
      metadata: {
        originalName: file.name,
        uploadedBy: session.user.id,
        uploadedAt: new Date().toISOString(),
      },
    })

    return NextResponse.json({
      success: true,
      key: result.key,
      size: result.size,
      contentType: result.contentType,
      url: await storage.getSignedUrl(result.key),
    })

  } catch (error: any) {
    console.error('Upload error:', error)
    
    if (error.name === 'FileSizeError') {
      return NextResponse.json(
        { error: 'File size exceeds maximum allowed size (512MB)' },
        { status: 413 }
      )
    }
    
    if (error.name === 'UnsupportedFileTypeError') {
      return NextResponse.json(
        { error: 'Unsupported file type. Only audio and image files are allowed.' },
        { status: 415 }
      )
    }

    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    )
  }
}
