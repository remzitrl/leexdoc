import { NextRequest, NextResponse } from 'next/server'
import { passwordResetSchema } from '@/lib/validations/auth'
import { 
  verifyPasswordResetTokenFromDB, 
  markPasswordResetTokenAsUsed, 
  updateUserPassword 
} from '@/lib/auth-utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const { token, password } = passwordResetSchema.parse(body)

    // Verify reset token
    const tokenRecord = await verifyPasswordResetTokenFromDB(token)

    // Update password
    await updateUserPassword(tokenRecord.userId, password)

    // Mark token as used
    await markPasswordResetTokenAsUsed(token)

    return NextResponse.json(
      { message: 'Password reset successfully' },
      { status: 200 }
    )

  } catch (error: any) {
    console.error('Password reset error:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: error.errors 
        },
        { status: 400 }
      )
    }

    if (error.name === 'AuthError') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
