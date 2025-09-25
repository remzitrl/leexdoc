import {
  ERR_DANGEROUS_PATH,
  ERR_MALICIOUS_FILE,
  WARN_NON_STRICT,
  ERR_INVALID_EXTENSION,
  ERR_INVALID_MIME_TYPE,
  ERR_FILE_TOO_LARGE,
  ERR_FILE_TOO_SMALL,
  ERR_INVALID_FILENAME,
  ERR_FILENAME_TOO_LONG,
  ERR_TOO_MANY_FILES,
  ERR_TOTAL_SIZE_EXCEEDED,
  WARN_MIME_NOT_WHITELISTED,
  ERR_SIZE_REQUIRED,
} from './messages'
import { assertSafeRelativePath } from './fs'
import { sanitizeFilename } from './filename'

// MIME type whitelist for audio files
export const ALLOWED_MIME_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/flac',
  'audio/x-flac',
  'audio/aac',
  'audio/mp4',
  'audio/x-m4a',
  'audio/ogg',
  'audio/vorbis',
  'audio/webm',
  'audio/x-ms-wma',
  'audio/x-ms-wax',
  'audio/x-ms-wvx',
] as const

// File extension whitelist
export const ALLOWED_EXTENSIONS = [
  '.mp3',
  '.wav',
  '.flac',
  '.aac',
  '.m4a',
  '.ogg',
  '.webm',
  '.wma',
] as const

// File size limits (in bytes)
export const FILE_SIZE_LIMITS = {
  MAX_FILE_SIZE: 512 * 1024 * 1024, // 512MB
  MAX_TOTAL_SIZE: 2 * 1024 * 1024 * 1024, // 2GB per user
  MAX_FILES_PER_UPLOAD: 10,
} as const

// Dangerous file patterns to block
export const DANGEROUS_PATTERNS = [
  /\.exe$/i,
  /\.bat$/i,
  /\.cmd$/i,
  /\.scr$/i,
  /\.pif$/i,
  /\.com$/i,
  /\.vbs$/i,
  /\.js$/i,
  /\.jar$/i,
  /\.php$/i,
  /\.asp$/i,
  /\.jsp$/i,
  /\.py$/i,
  /\.sh$/i,
  /\.ps1$/i,
  /\.dll$/i,
  /\.sys$/i,
  /\.drv$/i,
  /\.ocx$/i,
  /\.cpl$/i,
  /\.msi$/i,
  /\.msp$/i,
  /\.mst$/i,
] as const

export interface FileValidationResult {
  isValid: boolean
  error?: string
  warnings?: string[]
}

export interface FileValidationOptions {
  maxFileSize?: number
  maxTotalSize?: number
  maxFiles?: number
  strictMimeCheck?: boolean
}

export function validateFileExtension(filename: string): FileValidationResult {
  try {
    // Validate path security first
    assertSafeRelativePath(filename)
  } catch (error: any) {
    return {
      isValid: false,
      error: error.message
    }
  }

  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'))
  
  if (!ALLOWED_EXTENSIONS.includes(extension as any)) {
    return {
      isValid: false,
      error: `${ERR_INVALID_EXTENSION}. Allowed extensions: ${ALLOWED_EXTENSIONS.join(', ')}`
    }
  }

  // Check for dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(filename)) {
      return {
        isValid: false,
        error: `${ERR_DANGEROUS_PATH}: ${filename}`
      }
    }
  }

  return { isValid: true }
}

export function validateMimeType(mimeType: string, strict: boolean = true): FileValidationResult {
  if (!mimeType) {
    return {
      isValid: false,
      error: ERR_SIZE_REQUIRED
    }
  }

  const normalizedMimeType = mimeType.toLowerCase().trim()
  
  if (!ALLOWED_MIME_TYPES.includes(normalizedMimeType as any)) {
    if (strict) {
      return {
        isValid: false,
        error: `${ERR_INVALID_MIME_TYPE}. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`
      }
    } else {
      return {
        isValid: true,
        warnings: [WARN_MIME_NOT_WHITELISTED]
      }
    }
  }

  return { isValid: true }
}

export function validateFileSize(fileSize: number, maxSize: number = FILE_SIZE_LIMITS.MAX_FILE_SIZE): FileValidationResult {
  if (fileSize <= 0) {
    return {
      isValid: false,
      error: ERR_FILE_TOO_SMALL
    }
  }

  if (fileSize > maxSize) {
    return {
      isValid: false,
      error: `${ERR_FILE_TOO_LARGE}: ${formatBytes(fileSize)} > ${formatBytes(maxSize)}`
    }
  }

  return { isValid: true }
}

export function validateFile(
  file: File,
  options: FileValidationOptions = {}
): FileValidationResult {
  const {
    maxFileSize = FILE_SIZE_LIMITS.MAX_FILE_SIZE,
    strictMimeCheck = true
  } = options

  const errors: string[] = []
  const warnings: string[] = []

  // Validate file extension
  const extensionResult = validateFileExtension(file.name)
  if (!extensionResult.isValid) {
    errors.push(extensionResult.error!)
  }
  if (extensionResult.warnings) {
    warnings.push(...extensionResult.warnings)
  }

  // Validate MIME type
  const mimeResult = validateMimeType(file.type, strictMimeCheck)
  if (!mimeResult.isValid) {
    errors.push(mimeResult.error!)
  }
  if (mimeResult.warnings) {
    warnings.push(...mimeResult.warnings)
  }

  // Validate file size
  const sizeResult = validateFileSize(file.size, maxFileSize)
  if (!sizeResult.isValid) {
    errors.push(sizeResult.error!)
  }

  // Additional security checks
  if (file.name.length > 255) {
    errors.push(ERR_FILENAME_TOO_LONG)
  }

  if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
    errors.push(ERR_INVALID_FILENAME)
  }

  return {
    isValid: errors.length === 0,
    error: errors.length > 0 ? errors.join('; ') : undefined,
    warnings: warnings.length > 0 ? warnings : undefined
  }
}

export function validateMultipleFiles(
  files: File[],
  options: FileValidationOptions = {}
): FileValidationResult {
  const {
    maxFiles = FILE_SIZE_LIMITS.MAX_FILES_PER_UPLOAD,
    maxTotalSize = FILE_SIZE_LIMITS.MAX_TOTAL_SIZE
  } = options

  const errors: string[] = []
  const warnings: string[] = []

  // Check file count
  if (files.length > maxFiles) {
    errors.push(`${ERR_TOO_MANY_FILES}. Maximum ${maxFiles} files allowed per upload`)
  }

  // Check total size
  const totalSize = files.reduce((sum, file) => sum + file.size, 0)
  if (totalSize > maxTotalSize) {
    errors.push(`${ERR_TOTAL_SIZE_EXCEEDED}: ${formatBytes(totalSize)} > ${formatBytes(maxTotalSize)}`)
  }

  // Validate each file
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const fileResult = validateFile(file, options)
    
    if (!fileResult.isValid) {
      errors.push(`File ${i + 1} (${file.name}): ${fileResult.error}`)
    }
    
    if (fileResult.warnings) {
      warnings.push(`File ${i + 1} (${file.name}): ${fileResult.warnings.join('; ')}`)
    }
  }

  return {
    isValid: errors.length === 0,
    error: errors.length > 0 ? errors.join('; ') : undefined,
    warnings: warnings.length > 0 ? warnings : undefined
  }
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Re-export sanitizeFilename from filename.ts
export { sanitizeFilename } from './filename'

// Check if file is potentially malicious
export function isPotentiallyMalicious(file: File): boolean {
  // Check for suspicious file names
  const suspiciousPatterns = [
    /\.(exe|bat|cmd|scr|pif|com|vbs|js|jar|php|asp|jsp|py|sh|ps1)$/i,
    /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i,
    /[<>:"|?*]/,
    /\.\./,
    /^\./
  ]

  return suspiciousPatterns.some(pattern => pattern.test(file.name))
}
