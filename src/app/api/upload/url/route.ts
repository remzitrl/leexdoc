import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { urlUploadSchema } from '@/lib/validations/upload'
import { processUrlUpload } from '@/lib/upload-utils'
import { checkRateLimit, RATE_LIMITS, getClientIP } from '@/lib/rate-limit'

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

    // Rate limiting
    const ip = getClientIP(request)
    const rateLimitKey = `rate_limit:upload:url:${ip}:${session.user.id}`
    const rateLimit = await checkRateLimit(
      rateLimitKey,
      5 * 60 * 1000, // 5 minutes
      5 // 5 URL uploads per 5 minutes
    )

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Too many URL upload attempts. Please try again later.',
          retryAfter: rateLimit.retryAfter 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': rateLimit.retryAfter?.toString() || '300',
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': rateLimit.remainingAttempts.toString(),
          }
        }
      )
    }

    // Parse request body
    const body = await request.json()

    // Validate input
    const validationResult = urlUploadSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationResult.error.errors 
        },
        { status: 400 }
      )
    }

    const { url, title, artist, album, genre } = validationResult.data

    // Process URL upload
    const result = await processUrlUpload(
      session.user.id,
      url,
      { title, artist, album, genre }
    )

    return NextResponse.json({
      success: true,
      trackId: result.trackId,
      uploadId: result.uploadId,
      status: result.status,
      message: 'URL processed successfully. Download and transcoding in progress.',
    })

  } catch (error: any) {
    console.error('URL upload error:', error)

    if (error.message.includes('Invalid audio URL')) {
      return NextResponse.json(
        { error: 'Invalid audio URL or file too large' },
        { status: 400 }
      )
    }

    if (error.message.includes('Failed to download')) {
      return NextResponse.json(
        { error: 'Failed to download file from URL' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'URL upload failed' },
      { status: 500 }
    )
  }
}
