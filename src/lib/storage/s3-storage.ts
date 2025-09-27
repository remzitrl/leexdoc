import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
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

export class S3Storage implements StorageProvider {
  private client: S3Client
  private bucket: string

  constructor(config: {
    endpoint: string
    bucket: string
    accessKeyId: string
    secretAccessKey: string
    region: string
    forcePathStyle?: boolean
  }) {
    this.bucket = config.bucket
    this.client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: config.forcePathStyle ?? true,
    })
  }

  async putObject(
    key: string, 
    data: Buffer | NodeJS.ReadableStream, 
    options: PutObjectOptions = {}
  ): Promise<StorageObject> {
    try {
      // Validate file type
      const extension = getFileExtension(key)
      const contentType = options.contentType || getMimeTypeFromExtension(extension)
      
      if (contentType) {
        validateFileType(key, contentType)
      }

      // For streams, we need to collect the data to check size
      let buffer: Buffer
      if (Buffer.isBuffer(data)) {
        validateFileSize(data.length)
        buffer = data
      } else {
        // Convert stream to buffer for size validation
        const chunks: Buffer[] = []
        for await (const chunk of data) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
        }
        buffer = Buffer.concat(chunks)
        validateFileSize(buffer.length)
      }

      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType || 'application/octet-stream',
        Metadata: options.metadata,
        ACL: options.acl,
      })

      const result = await this.client.send(command)

      // Get object info after upload
      const headResult = await this.headObject(key)
      if (!headResult) {
        throw new StorageError('Failed to verify upload', 'UPLOAD_ERROR', 500)
      }

      return headResult
    } catch (error: any) {
      if (error.name === 'FileSizeError' || error.message.includes('size')) {
        throw new StorageError('File size exceeds maximum allowed size', 'FILE_SIZE_ERROR', 413)
      }
      if (error.name === 'UnsupportedFileTypeError') {
        throw new StorageError(error.message, 'UNSUPPORTED_FILE_TYPE', 415)
      }
      throw new StorageError(`Failed to store object: ${error.message}`, 'PUT_ERROR', 500)
    }
  }

  async getSignedUrl(
    key: string, 
    options: GetSignedUrlOptions = {}
  ): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ResponseContentDisposition: options.responseContentDisposition,
        ResponseContentType: options.responseContentType,
      })

      const expiresIn = options.expiresIn || 3600 // Default 1 hour
      return await getSignedUrl(this.client, command, { expiresIn })
    } catch (error: any) {
      throw new StorageError(`Failed to generate signed URL: ${error.message}`, 'SIGNED_URL_ERROR', 500)
    }
  }

  async headObject(key: string): Promise<StorageObject | null> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })

      const result = await this.client.send(command)
      
      return {
        key,
        size: result.ContentLength || 0,
        lastModified: result.LastModified || new Date(),
        contentType: result.ContentType || 'application/octet-stream',
        etag: result.ETag,
      }
    } catch (error: any) {
      if (error.name === 'NotFound') {
        return null
      }
      throw new StorageError(`Failed to get object info: ${error.message}`, 'HEAD_ERROR', 500)
    }
  }

  async deleteObject(key: string): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })

      await this.client.send(command)
      return true
    } catch (error: any) {
      return false
    }
  }

  async listObjects(prefix: string = '', maxKeys: number = 1000): Promise<StorageObject[]> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix,
        MaxKeys: maxKeys,
      })

      const result = await this.client.send(command)
      
      return (result.Contents || []).map(obj => ({
        key: obj.Key || '',
        size: obj.Size || 0,
        lastModified: obj.LastModified || new Date(),
        contentType: 'application/octet-stream', // S3 doesn't always return content type in list
        etag: obj.ETag,
      }))
    } catch (error: any) {
      throw new StorageError(`Failed to list objects: ${error.message}`, 'LIST_ERROR', 500)
    }
  }

  // Helper method to get object stream
  async getObjectStream(key: string): Promise<NodeJS.ReadableStream> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })

      const result = await this.client.send(command)
      return result.Body as NodeJS.ReadableStream
    } catch (error: any) {
      throw new StorageError(`Failed to get object stream: ${error.message}`, 'GET_STREAM_ERROR', 500)
    }
  }

  // Helper method to get object buffer
  async getObjectBuffer(key: string): Promise<Buffer> {
    try {
      const stream = await this.getObjectStream(key)
      const chunks: Buffer[] = []
      
      for await (const chunk of stream) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
      }
      
      return Buffer.concat(chunks)
    } catch (error: any) {
      throw new StorageError(`Failed to get object buffer: ${error.message}`, 'GET_BUFFER_ERROR', 500)
    }
  }
}
