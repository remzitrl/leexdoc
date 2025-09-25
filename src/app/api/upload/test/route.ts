import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const requestId = Math.random().toString(36).substring(7)
  
  try {
    console.log(`[${requestId}] Upload test started`)
    
    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      console.log(`[${requestId}] No file provided`)
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    
    console.log(`[${requestId}] File received: ${file.name}, ${file.size} bytes`)
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const responseTime = Date.now() - startTime
    console.log(`[${requestId}] Upload test completed in ${responseTime}ms`)
    
    return NextResponse.json({ 
      success: true, 
      message: 'File received successfully',
      uploadId: requestId,
      fileName: file.name,
      fileSize: file.size,
      responseTime: `${responseTime}ms`
    }, { status: 201 })
    
  } catch (error) {
    const responseTime = Date.now() - startTime
    console.error(`[${requestId}] Upload test error:`, error)
    
    return NextResponse.json({ 
      error: 'Upload failed',
      responseTime: `${responseTime}ms`
    }, { status: 500 })
  }
}
