import { 
  ValidationError, 
  FileSizeError, 
  UnsupportedFileTypeError 
} from './types'

// Allowed MIME types for audio and images
export const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  // Audio formats
  'audio/mpeg': ['.mp3'],
  'audio/wav': ['.wav'],
  'audio/ogg': ['.ogg'],
  'audio/mp4': ['.m4a', '.mp4'],
  'audio/aac': ['.aac'],
  'audio/flac': ['.flac'],
  'audio/webm': ['.webm'],
  
  // Image formats
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/gif': ['.gif'],
  'image/svg+xml': ['.svg'],
  'image/avif': ['.avif'],
}

// Maximum file size in bytes (512MB)
export const MAX_FILE_SIZE = 512 * 1024 * 1024

// Allowed file extensions
export const ALLOWED_EXTENSIONS = Object.values(ALLOWED_MIME_TYPES).flat() as string[]

export function validateFileType(filename: string, contentType?: string): void {
  const extension = getFileExtension(filename)
  
  // Check if extension is allowed
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    throw new UnsupportedFileTypeError(`File extension ${extension} is not allowed`)
  }
  
  // If contentType is provided, validate it matches the extension
  if (contentType) {
    const expectedExtensions = ALLOWED_MIME_TYPES[contentType]
    if (!expectedExtensions || !expectedExtensions.includes(extension)) {
      throw new ValidationError(`Content type ${contentType} does not match file extension ${extension}`)
    }
  }
}

export function validateFileSize(size: number): void {
  if (size > MAX_FILE_SIZE) {
    throw new FileSizeError(MAX_FILE_SIZE / (1024 * 1024)) // Convert to MB
  }
}

export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.')
  if (lastDot === -1) return ''
  return filename.substring(lastDot).toLowerCase()
}

export function getMimeTypeFromExtension(extension: string): string | null {
  for (const [mimeType, extensions] of Object.entries(ALLOWED_MIME_TYPES)) {
    if (extensions.includes(extension)) {
      return mimeType
    }
  }
  return null
}

export function sanitizeFilename(filename: string): string {
  // Remove path traversal attempts
  const sanitized = filename
    .replace(/\.\./g, '') // Remove parent directory references
    .replace(/[\/\\]/g, '_') // Replace path separators with underscores
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace invalid characters
    .replace(/_+/g, '_') // Replace multiple underscores with single
    .replace(/^_|_$/g, '') // Remove leading/trailing underscores
  
  if (!sanitized || sanitized.length === 0) {
    throw new ValidationError('Invalid filename')
  }
  
  return sanitized
}

export function generateUniqueKey(originalFilename: string, prefix?: string): string {
  const sanitized = sanitizeFilename(originalFilename)
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  
  const key = `${timestamp}-${random}-${sanitized}`
  return prefix ? `${prefix}/${key}` : key
}
