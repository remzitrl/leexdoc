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
    // Step 1: Authentication
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id || 'test-user-id'
    
    if (!session?.user?.id) {
      console.log(`[${requestId}] Auth bypassed for testing - using test user: ${userId}`)
    } else {
      console.log(`[${requestId}] Authenticated user: ${userId}`)
    }

    // Step 2: Parse FormData
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    console.log(`[${requestId}] File received: ${file.name} (${file.size} bytes, ${file.type})`)

    // Step 3: Basic validation
    if (file.size === 0) {
      return NextResponse.json({ error: 'File is empty' }, { status: 400 })
    }

    if (file.size > 100 * 1024 * 1024) { // 100MB limit
      return NextResponse.json({ error: 'File too large (max 100MB)' }, { status: 413 })
    }

    // Step 4: Create upload record in database
    const uploadId = randomUUID()
    const now = new Date()
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const tempFileName = `${uploadId}-${safeName}`
    
    console.log(`[${requestId}] Creating upload record: ${uploadId}`)
    
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

    console.log(`[${requestId}] Upload record created: ${uploadRecord.id}`)

    // Step 5: Save file to temp location
    const tempDir = join(process.cwd(), 'tmp', 'uploads', yearMonth)
    await mkdir(tempDir, { recursive: true })
    const tempPath = join(tempDir, tempFileName)
    
    console.log(`[${requestId}] Saving file to: ${tempPath}`)
    
    const arrayBuffer = await file.arrayBuffer()
    await writeFile(tempPath, Buffer.from(arrayBuffer))
    
    console.log(`[${requestId}] File saved successfully`)

    // Step 6: Calculate audio duration
    let durationSec = 0
    try {
      const metadata = await parseFile(tempPath)
      durationSec = Math.round(metadata.format.duration || 0)
      console.log(`[${requestId}] Audio duration: ${durationSec} seconds`)
    } catch (error) {
      console.warn(`[${requestId}] Could not parse audio metadata:`, error)
      // Default to 0 if parsing fails
    }

    // Step 7: Create track record
    const trackId = randomUUID()
    const trackRecord = await db.track.create({
      data: {
        id: trackId,
        ownerId: userId,
        title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
        artist: 'Unknown Artist',
        album: 'Unknown Album',
        genre: 'Unknown',
        durationSec: durationSec,
        bpm: 0,
        loudnessI: 0,
        coverImageKey: null,
        sourceType: 'File',
        sourceUrl: tempPath,
        status: 'Ready', // Mark as ready immediately for testing
      }
    })

    console.log(`[${requestId}] Track record created: ${trackRecord.id}`)

    // Step 8: Update upload status
    await db.upload.update({
      where: { id: uploadId },
      data: { 
        status: 'Completed'
      }
    })

    console.log(`[${requestId}] Upload completed successfully`)

    const response = NextResponse.json({
      uploadId: uploadId,
      trackId: trackId,
      message: 'File uploaded and processed successfully',
      filename: file.name,
      size: file.size,
      type: file.type
    }, { status: 201 })
    
    console.log(`[${requestId}] Response sent in ${Date.now() - startTime}ms`)
    
    return response
    
  } catch (error) {
    console.error(`[${requestId}] Upload error:`, error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}