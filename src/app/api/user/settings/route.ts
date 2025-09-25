import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/user/settings - Get user settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settings = await db.userSetting.findUnique({
      where: { userId: session.user.id },
    })

    if (!settings) {
      // Return default settings
      return NextResponse.json({
        theme: 'dark',
        language: 'en',
        autoplay: true,
        defaultQuality: 'q128',
        downloadOverWifiOnly: true,
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Get user settings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/user/settings - Update user settings
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { theme, language, autoplay, defaultQuality, downloadOverWifiOnly } = body

    const settings = await db.userSetting.upsert({
      where: { userId: session.user.id },
      update: {
        ...(theme !== undefined && { theme }),
        ...(language !== undefined && { language }),
        ...(autoplay !== undefined && { autoplay }),
        ...(defaultQuality !== undefined && { defaultQuality }),
        ...(downloadOverWifiOnly !== undefined && { downloadOverWifiOnly }),
      },
      create: {
        userId: session.user.id,
        theme: theme || 'dark',
        language: language || 'en',
        autoplay: autoplay !== undefined ? autoplay : true,
        defaultQuality: defaultQuality || 'q128',
        downloadOverWifiOnly: downloadOverWifiOnly !== undefined ? downloadOverWifiOnly : true,
      },
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Update user settings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
