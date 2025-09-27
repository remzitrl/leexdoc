export interface StorageObject {
  key: string
  size: number
  lastModified: Date
  contentType: string
  etag?: string
}

export interface PutObjectOptions {
  contentType?: string
  metadata?: Record<string, string>
  acl?: 'private' | 'public-read'
}

export interface GetSignedUrlOptions {
  expiresIn?: number // seconds
  responseContentDisposition?: string
  responseContentType?: string
}

export interface StorageProvider {
  putObject(
    key: string, 
    data: Buffer | NodeJS.ReadableStream, 
    options?: PutObjectOptions
  ): Promise<StorageObject>
  
  getSignedUrl(
    key: string, 
    options?: GetSignedUrlOptions
  ): Promise<string>
  
  headObject(key: string): Promise<StorageObject | null>
  
  deleteObject(key: string): Promise<boolean>
  
  listObjects(prefix?: string, maxKeys?: number): Promise<StorageObject[]>
}

export interface StorageConfig {
  provider: 'local' | 's3'
  local?: {
    basePath: string
  }
  s3?: {
    endpoint: string
    bucket: string
    accessKeyId: string
    secretAccessKey: string
    region: string
    forcePathStyle?: boolean
  }
}

export class StorageError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message)
    this.name = 'StorageError'
  }
}

export class ValidationError extends StorageError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400)
  }
}

export class FileSizeError extends StorageError {
  constructor(maxSize: number) {
    super(`File size exceeds maximum allowed size of ${maxSize}MB`, 'FILE_SIZE_ERROR', 413)
  }
}

export class UnsupportedFileTypeError extends StorageError {
  constructor(fileType: string) {
    super(`Unsupported file type: ${fileType}`, 'UNSUPPORTED_FILE_TYPE', 415)
  }
}
