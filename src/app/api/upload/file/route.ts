import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { parseFile } from 'music-metadata'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const requestId = randomUUID()
  
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id || 'test-user-id'
    
    if (!session?.user?.id) {
    } else {
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }


    if (file.size === 0) {
      return NextResponse.json({ error: 'File is empty' }, { status: 400 })
    }

    if (file.size > 100 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 100MB)' }, { status: 413 })
    }

    const uploadId = randomUUID()
    const now = new Date()
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const tempFileName = `${uploadId}-${safeName}`
    
    
    const uploadRecord = await db.upload.create({
      data: {
        id: uploadId,
        userId: userId,
        method: 'File',
        originalName: file.name,
        safeName: safeName,
        mimeType: file.type,
        size: file.size,
        status: 'Queued',
        tempPath: `tmp/uploads/${yearMonth}/${tempFileName}`,
      }
    })


    const tempDir = join(process.cwd(), 'tmp', 'uploads', yearMonth)
    await mkdir(tempDir, { recursive: true })
    const tempPath = join(tempDir, tempFileName)
    
    
    const arrayBuffer = await file.arrayBuffer()
    await writeFile(tempPath, Buffer.from(arrayBuffer))
    

    let durationSec = 0
    try {
      const metadata = await parseFile(tempPath)
      durationSec = Math.round(metadata.format.duration || 0)
    } catch (error) {
    }

    const trackId = randomUUID()
    const trackRecord = await db.track.create({
      data: {
        id: trackId,
        ownerId: userId,
        title: file.name.replace(/\.[^/.]+$/, ''),
        artist: 'Unknown Artist',
        album: 'Unknown Album',
        genre: 'Unknown',
        durationSec: durationSec,
        bpm: 0,
        loudnessI: 0,
        coverImageKey: null,
        sourceType: 'File',
        sourceUrl: tempPath,
        status: 'Ready',
      }
    })


    await db.upload.update({
      where: { id: uploadId },
      data: { 
        status: 'Completed'
      }
    })


    const response = NextResponse.json({
      uploadId: uploadId,
      trackId: trackId,
      message: 'File uploaded and processed successfully',
      filename: file.name,
      size: file.size,
      type: file.type
    }, { status: 201 })
    
    
    return response
    
  } catch (error) {
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}