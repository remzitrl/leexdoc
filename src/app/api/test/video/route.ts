import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET(request: NextRequest) {
  try {
    // Test video file path
    const videoPath = join(process.cwd(), 'storage', '2025', '09', 'test-video.mp4')
    
    console.log('Test video path:', videoPath)
    
    // Check if file exists
    try {
      await readFile(videoPath)
    } catch (error) {
      console.error('Test video file not found:', error)
      return NextResponse.json({ 
        error: 'Test video file not found',
        path: videoPath 
      }, { status: 404 })
    }
    
    // Read the video file
    const fileBuffer = await readFile(videoPath)
    
    console.log('Test video file read successfully:', {
      size: fileBuffer.length,
      path: videoPath
    })
    
    // Return the video file
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': fileBuffer.length.toString(),
        'Content-Disposition': 'inline; filename="test-video.mp4"',
        'Cache-Control': 'public, max-age=31536000',
      },
    })
  } catch (error) {
    console.error('Error serving test video:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}



