import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const { id } = resolvedParams
    
    console.log('Test document download for ID:', id)
    
    // Get document from database
    const document = await prisma.document.findFirst({
      where: {
        id: id
      }
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    console.log('Document found:', {
      id: document.id,
      title: document.title,
      originalName: document.originalName,
      fileKey: document.fileKey,
      mimeType: document.mimeType
    })

    // Get file from storage
    const fileKey = document.fileKey
    if (!fileKey) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    try {
      // Read file from filesystem
      const fullPath = join(process.cwd(), 'storage', fileKey)
      console.log('Attempting to read file:', {
        fileKey,
        fullPath,
        documentId: document.id,
        fileName: document.originalName
      })
      
      // Check if file exists first
      try {
        await readFile(fullPath)
      } catch (accessError) {
        console.error('File does not exist:', {
          fullPath,
          fileKey,
          error: accessError
        })
        return NextResponse.json({ 
          error: 'File not found on disk',
          details: `File path: ${fullPath}`,
          fileKey 
        }, { status: 404 })
      }
      
      const fileBuffer = await readFile(fullPath)
      console.log('File read successfully:', {
        size: fileBuffer.length,
        expectedSize: document.fileSize,
        mimeType: document.mimeType
      })
      
      // Return file with proper headers
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': document.mimeType,
          'Content-Length': fileBuffer.length.toString(),
          'Content-Disposition': `inline; filename="${document.originalName}"`,
          'Cache-Control': 'public, max-age=31536000',
        },
      })
    } catch (fileError) {
      console.error('Error reading file:', {
        error: fileError,
        fileKey,
        fullPath: join(process.cwd(), 'storage', fileKey),
        documentId: document.id
      })
      return NextResponse.json({ 
        error: 'File read error',
        details: fileError instanceof Error ? fileError.message : 'Unknown file error',
        fileKey 
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Error downloading document:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}



