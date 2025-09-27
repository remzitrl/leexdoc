import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { StorageManager } from '@/lib/storage-manager'
import { unlink } from 'fs/promises'
import { join } from 'path'
import { offlineManager } from '@/lib/offline/manager'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const documentId = params.id

    // Get document from database
    const document = await db.document.findFirst({
      where: {
        id: documentId,
        ownerId: session.user.id,
      },
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    return NextResponse.json(document)
  } catch (error) {
    console.error('Error fetching document:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const documentId = params.id

    // Get document from database to verify ownership and get file info
    const document = await db.document.findFirst({
      where: {
        id: documentId,
        ownerId: session.user.id,
      },
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Delete file from storage
    try {
      // Check if using local disk storage (based on fileKey format)
      if (document.fileKey.startsWith('documents/')) {
        // Local disk storage - delete from file system
        const storageDir = join(process.cwd(), 'storage', 'documents', session.user.id)
        const fileName = document.fileKey.split('/').pop()
        const filePath = join(storageDir, fileName || '')
        
        try {
          await unlink(filePath)
          console.log(`File deleted from disk: ${filePath}`)
        } catch (fileError) {
          console.warn(`Could not delete file from disk: ${fileError}`)
          // Continue with database deletion even if file deletion fails
        }
      } else {
        // S3 or other storage - use StorageManager
        await StorageManager.deleteFile(session.user.id, document.fileKey)
        console.log(`File deleted from storage: ${document.fileKey}`)
      }

      // Delete thumbnail if it exists
      if (document.thumbnailKey) {
        try {
          if (document.thumbnailKey.startsWith('documents/')) {
            // Local disk storage for thumbnail
            const storageDir = join(process.cwd(), 'storage', 'documents', session.user.id)
            const thumbnailFileName = document.thumbnailKey.split('/').pop()
            const thumbnailPath = join(storageDir, thumbnailFileName || '')
            await unlink(thumbnailPath)
            console.log(`Thumbnail deleted from disk: ${thumbnailPath}`)
          } else {
            // S3 or other storage for thumbnail
            await StorageManager.deleteFile(session.user.id, document.thumbnailKey)
            console.log(`Thumbnail deleted from storage: ${document.thumbnailKey}`)
          }
        } catch (thumbnailError) {
          console.warn(`Could not delete thumbnail: ${thumbnailError}`)
          // Continue even if thumbnail deletion fails
        }
      }
    } catch (storageError) {
      console.error('Error deleting file from storage:', storageError)
      // Continue with database deletion even if storage deletion fails
    }

    // Remove from offline storage if it exists
    try {
      await offlineManager.removeDocumentOffline(documentId)
      console.log(`Document ${documentId} removed from offline storage`)
    } catch (offlineError) {
      console.warn(`Could not remove document from offline storage: ${offlineError}`)
      // Continue with database deletion even if offline removal fails
    }

    // Delete document record from database
    await db.document.delete({
      where: {
        id: documentId,
        ownerId: session.user.id,
      },
    })

    console.log(`Document ${documentId} deleted successfully`)

    return NextResponse.json({ 
      success: true, 
      message: 'Document deleted successfully' 
    })
  } catch (error) {
    console.error('Error deleting document:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}