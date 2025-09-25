import { NextRequest, NextResponse } from 'next/server'
import { passwordResetRequestSchema } from '@/lib/validations/auth'
import { getUserByEmail, createPasswordResetToken } from '@/lib/auth-utils'
import { checkRateLimit, RATE_LIMITS, getClientIP } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const { email } = passwordResetRequestSchema.parse(body)

    // Rate limiting
    const ip = getClientIP(request)
    const rateLimitKey = RATE_LIMITS.PASSWORD_RESET.keyGenerator(request, email)
    const rateLimit = await checkRateLimit(
      rateLimitKey,
      RATE_LIMITS.PASSWORD_RESET.windowMs,
      RATE_LIMITS.PASSWORD_RESET.maxAttempts
    )

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Too many password reset attempts. Please try again later.',
          retryAfter: rateLimit.retryAfter 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': rateLimit.retryAfter?.toString() || '3600',
            'X-RateLimit-Limit': RATE_LIMITS.PASSWORD_RESET.maxAttempts.toString(),
            'X-RateLimit-Remaining': rateLimit.remainingAttempts.toString(),
          }
        }
      )
    }

    // Check if user exists
    const user = await getUserByEmail(email)
    if (!user) {
      // Return success even if user doesn't exist (security best practice)
      return NextResponse.json(
        { message: 'If an account with that email exists, a password reset link has been sent.' },
        { status: 200 }
      )
    }

    // Create password reset token
    const resetToken = await createPasswordResetToken(user.id)

    // In a real application, you would send an email here
    // For development, we'll just return the token
    console.log(`Password reset token for ${email}: ${resetToken.token}`)
    console.log(`Reset URL: ${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken.token}`)

    return NextResponse.json(
      { 
        message: 'If an account with that email exists, a password reset link has been sent.',
        // Only include token in development
        ...(process.env.NODE_ENV === 'development' && {
          token: resetToken.token,
          resetUrl: `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken.token}`
        })
      },
      { status: 200 }
    )

  } catch (error: any) {
    console.error('Password reset request error:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: error.errors 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
