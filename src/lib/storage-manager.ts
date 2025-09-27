import { storage } from './storage/index'
import { generateUniqueKey } from './storage/validation'
import { StorageError } from './storage/types'
import { detectMaliciousUpload } from './security/upload'


export class StorageManager {
  /**
   * Upload a file with validation and user isolation
   */
  static async uploadFile(
    userId: string,
    file: File | Buffer,
    folder: string = 'uploads',
    options: {
      contentType?: string
      metadata?: Record<string, string>
    } = {}
  ) {
    try {
      // Convert to buffer if needed
      let buffer: Buffer
      let filename: string
      let contentType: string
      
      if (file instanceof File) {
        buffer = Buffer.from(await file.arrayBuffer())
        filename = file.name
        contentType = file.type
      } else {
        buffer = file
        filename = 'upload'
        contentType = options.contentType || 'application/octet-stream'
      }
      
      // Detect malicious uploads
      const { safeName } = detectMaliciousUpload({
        originalName: filename,
        mimeFromHeader: contentType,
        sizeBytes: buffer.length,
      })
      
      // Generate unique key with user isolation using safe name
      const key = generateUniqueKey(safeName, `${userId}/${folder}`)
      
      // Upload to storage
      const result = await storage.putObject(key, buffer, {
        contentType: contentType,
        metadata: {
          ...options.metadata,
          uploadedBy: userId,
          uploadedAt: new Date().toISOString(),
        },
      })
      
      return {
        key: result.key,
        size: result.size,
        contentType: result.contentType,
        url: await storage.getSignedUrl(result.key),
      }
    } catch (error: any) {
      throw new StorageError(`Upload failed: ${error.message}`, 'UPLOAD_ERROR', 500)
    }
  }

  /**
   * Get a signed URL for a file
   */
  static async getFileUrl(
    userId: string,
    key: string,
    expiresIn: number = 3600
  ) {
    // Verify user owns the file
    if (!key.startsWith(userId)) {
      throw new StorageError('Access denied', 'ACCESS_DENIED', 403)
    }
    
    return storage.getSignedUrl(key, { expiresIn })
  }

  /**
   * Delete a file
   */
  static async deleteFile(userId: string, key: string) {
    // Verify user owns the file
    if (!key.startsWith(userId)) {
      throw new StorageError('Access denied', 'ACCESS_DENIED', 403)
    }
    
    return storage.deleteObject(key)
  }

  /**
   * List user's files
   */
  static async listUserFiles(
    userId: string,
    folder: string = '',
    maxKeys: number = 100
  ) {
    const prefix = folder ? `${userId}/${folder}` : `${userId}/`
    return storage.listObjects(prefix, maxKeys)
  }

  /**
   * Get file info
   */
  static async getFileInfo(userId: string, key: string) {
    // Verify user owns the file
    if (!key.startsWith(userId)) {
      throw new StorageError('Access denied', 'ACCESS_DENIED', 403)
    }
    
    return storage.headObject(key)
  }

  /**
   * Clean up old files (for maintenance)
   */
  static async cleanupOldFiles(
    userId: string,
    olderThanDays: number = 30
  ) {
    const files = await this.listUserFiles(userId)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)
    
    const filesToDelete = files.filter(file => 
      file.lastModified < cutoffDate
    )
    
    const results = await Promise.allSettled(
      filesToDelete.map(file => this.deleteFile(userId, file.key))
    )
    
    return {
      totalFiles: filesToDelete.length,
      deletedFiles: results.filter(r => r.status === 'fulfilled').length,
      failedFiles: results.filter(r => r.status === 'rejected').length,
    }
  }

  /**
   * Get storage usage for a user
   */
  static async getUserStorageUsage(userId: string) {
    const files = await this.listUserFiles(userId)
    
    const totalSize = files.reduce((sum, file) => sum + file.size, 0)
    const fileCount = files.length
    
    return {
      totalSize,
      fileCount,
      totalSizeMB: Math.round(totalSize / (1024 * 1024) * 100) / 100,
      totalSizeGB: Math.round(totalSize / (1024 * 1024 * 1024) * 100) / 100,
    }
  }
}
