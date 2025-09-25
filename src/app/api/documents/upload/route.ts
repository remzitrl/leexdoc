import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const category = formData.get('category') as string
    const tags = formData.get('tags') as string

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const documents = []

    for (const file of files) {
      try {
        const timestamp = Date.now()
        const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const fileKey = `documents/${session.user.id}/${timestamp}-${safeFileName}`
        
        const storageDir = join(process.cwd(), 'storage', 'documents', session.user.id)
        await mkdir(storageDir, { recursive: true })
        
        const filePath = join(storageDir, `${timestamp}-${safeFileName}`)
        const arrayBuffer = await file.arrayBuffer()
        await writeFile(filePath, Buffer.from(arrayBuffer))
        
        
        const document = await db.document.create({
          data: {
            ownerId: session.user.id,
            title: files.length === 1 ? title : `${title} - ${file.name}`,
            originalName: file.name,
            mimeType: file.type,
            fileSize: file.size,
            fileKey,
            category: category as any,
            tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
            description: description || null,
            status: 'Ready'
          }
        })

        documents.push(document)
      } catch (fileError) {
      }
    }

    return NextResponse.json({ documents })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
