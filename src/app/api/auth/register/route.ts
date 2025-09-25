import { NextRequest, NextResponse } from 'next/server'
import { registerSchema } from '@/lib/validations/auth'
import { createUser, isEmailUnique } from '@/lib/auth-utils'
import { checkRateLimit, RATE_LIMITS, getClientIP } from '@/lib/rate-limit'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = registerSchema.parse(body)
    const { email, password, displayName } = validatedData

    // Rate limiting - temporarily disabled for debugging
    // const ip = getClientIP(request)
    // const rateLimit = await checkRateLimit('register', 'anonymous', ip)

    // if (!rateLimit.success) {
    //   return NextResponse.json(
    //     { 
    //       error: 'Too many registration attempts. Please try again later.',
    //       retryAfter: rateLimit.retryAfter 
    //     },
    //     { 
    //       status: 429,
    //       headers: {
    //         'Retry-After': rateLimit.retryAfter?.toString() || '3600',
    //         'X-RateLimit-Limit': '3',
    //         'X-RateLimit-Remaining': rateLimit.remainingAttempts.toString(),
    //       }
    //     }
    //   )
    // }

    // Check if email is unique
    const isUnique = await isEmailUnique(email)
    if (!isUnique) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      )
    }

    // Create user
    const user = await createUser({
      email,
      password,
      displayName,
    })

    // Create default user settings
    await db.userSetting.create({
      data: {
        userId: user.id,
        theme: 'dark',
        language: 'en',
        downloadOverWifiOnly: false,
        autoDownload: false,
      },
    })

    return NextResponse.json(
      { 
        message: 'User created successfully',
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
        }
      },
      { status: 201 }
    )

  } catch (error: any) {
    console.error('Registration error:', error)
    console.error('Error stack:', error.stack)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: error.errors 
        },
        { status: 400 }
      )
    }

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message,
        code: error.code
      },
      { status: 500 }
    )
  }
}
