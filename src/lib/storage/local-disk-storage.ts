import * as fs from 'fs/promises'
import * as path from 'path'
import { createReadStream, createWriteStream } from 'fs'
import { pipeline } from 'stream/promises'
import { 
  StorageProvider, 
  StorageObject, 
  PutObjectOptions, 
  GetSignedUrlOptions,
  StorageError 
} from './types'
import { 
  validateFileType, 
  validateFileSize, 
  getFileExtension,
  getMimeTypeFromExtension 
} from './validation'
import { assertSafeRelativePath } from '../security/fs'

export class LocalDiskStorage implements StorageProvider {
  private basePath: string

  constructor(basePath: string = '/storage') {
    this.basePath = path.resolve(basePath)
  }

  async putObject(
    key: string, 
    data: Buffer | NodeJS.ReadableStream, 
    options: PutObjectOptions = {}
  ): Promise<StorageObject> {
    try {
      // Validate path security
      assertSafeRelativePath(key)
      
      // Validate file type
      const extension = getFileExtension(key)
      const contentType = options.contentType || getMimeTypeFromExtension(extension)
      
      if (contentType) {
        validateFileType(key, contentType)
      }

      const filePath = path.join(this.basePath, key)
      const dir = path.dirname(filePath)

      // Ensure directory exists
      await fs.mkdir(dir, { recursive: true })

      // Handle different data types
      if (Buffer.isBuffer(data)) {
        // Validate file size for buffers
        validateFileSize(data.length)
        await fs.writeFile(filePath, data)
      } else {
        // For streams, we need to check size as we write
        const writeStream = createWriteStream(filePath)
        let totalSize = 0

        const sizeCheckStream = new (require('stream').Transform)({
          transform(chunk: Buffer, encoding: string, callback: Function) {
            totalSize += chunk.length
            if (totalSize > 512 * 1024 * 1024) { // 512MB
              callback(new Error('File size exceeds maximum allowed size'))
              return
            }
            callback(null, chunk)
          }
        })

        await pipeline(data, sizeCheckStream, writeStream)
      }

      // Get file stats
      const stats = await fs.stat(filePath)
      
      return {
        key,
        size: stats.size,
        lastModified: stats.mtime,
        contentType: contentType || 'application/octet-stream',
        etag: `"${stats.mtime.getTime()}-${stats.size}"`
      }
    } catch (error: any) {
      if (error.message.includes('File size exceeds')) {
        throw new StorageError('File size exceeds maximum allowed size', 'FILE_SIZE_ERROR', 413)
      }
      throw new StorageError(`Failed to store object: ${error.message}`, 'PUT_ERROR', 500)
    }
  }

  async getSignedUrl(
    key: string, 
    options: GetSignedUrlOptions = {}
  ): Promise<string> {
    // Validate path security
    assertSafeRelativePath(key)
    
    const filePath = path.join(this.basePath, key)
    
    try {
      // Check if file exists
      await fs.access(filePath)
      
      // For local storage, return a direct file URL
      // In production, you might want to serve files through a CDN or file server
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
      return `${baseUrl}/api/storage/${encodeURIComponent(key)}`
    } catch (error) {
      throw new StorageError(`File not found: ${key}`, 'NOT_FOUND', 404)
    }
  }

  async headObject(key: string): Promise<StorageObject | null> {
    try {
      // Validate path security
      assertSafeRelativePath(key)
      
      const filePath = path.join(this.basePath, key)
      const stats = await fs.stat(filePath)
      
      const extension = getFileExtension(key)
      const contentType = getMimeTypeFromExtension(extension) || 'application/octet-stream'
      
      return {
        key,
        size: stats.size,
        lastModified: stats.mtime,
        contentType,
        etag: `"${stats.mtime.getTime()}-${stats.size}"`
      }
    } catch (error) {
      return null
    }
  }

  async deleteObject(key: string): Promise<boolean> {
    try {
      // Validate path security
      assertSafeRelativePath(key)
      
      const filePath = path.join(this.basePath, key)
      await fs.unlink(filePath)
      return true
    } catch (error) {
      return false
    }
  }

  async listObjects(prefix: string = '', maxKeys: number = 1000): Promise<StorageObject[]> {
    try {
      // Validate path security for prefix
      if (prefix) {
        assertSafeRelativePath(prefix)
      }
      
      const dirPath = path.join(this.basePath, prefix)
      const entries = await fs.readdir(dirPath, { withFileTypes: true })
      
      const objects: StorageObject[] = []
      
      for (const entry of entries.slice(0, maxKeys)) {
        if (entry.isFile()) {
          const key = prefix ? `${prefix}/${entry.name}` : entry.name
          const stats = await fs.stat(path.join(dirPath, entry.name))
          const extension = getFileExtension(entry.name)
          const contentType = getMimeTypeFromExtension(extension) || 'application/octet-stream'
          
          objects.push({
            key,
            size: stats.size,
            lastModified: stats.mtime,
            contentType,
            etag: `"${stats.mtime.getTime()}-${stats.size}"`
          })
        }
      }
      
      return objects
    } catch (error) {
      return []
    }
  }

  // Helper method to get file stream
  async getObjectStream(key: string): Promise<NodeJS.ReadableStream> {
    // Validate path security
    assertSafeRelativePath(key)
    
    const filePath = path.join(this.basePath, key)
    return createReadStream(filePath)
  }

  // Helper method to get file buffer
  async getObjectBuffer(key: string): Promise<Buffer> {
    // Validate path security
    assertSafeRelativePath(key)
    
    const filePath = path.join(this.basePath, key)
    return fs.readFile(filePath)
  }
}
