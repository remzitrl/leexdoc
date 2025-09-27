import { StorageProvider, StorageConfig } from './types'
import { LocalDiskStorage } from './local-disk-storage'
import { S3Storage } from './s3-storage'

// Get storage provider from environment
const provider = process.env.STORAGE_PROVIDER || 'local'

// Create storage provider instance
let storageProvider: StorageProvider

if (provider === 's3') {
  const s3Config = {
    endpoint: process.env.S3_ENDPOINT || '',
    bucket: process.env.S3_BUCKET || '',
    accessKeyId: process.env.S3_ACCESS_KEY || '',
    secretAccessKey: process.env.S3_SECRET_KEY || '',
    region: process.env.S3_REGION || 'us-east-1',
    forcePathStyle: true,
  }
  
  if (!s3Config.endpoint || !s3Config.bucket) {
    throw new Error('S3 configuration is required when using S3 storage provider')
  }
  
  storageProvider = new S3Storage(s3Config)
} else {
  storageProvider = new LocalDiskStorage('/storage')
}

// Export the storage provider
export { storageProvider as storage }

// Export types and classes
export * from './types'
export * from './validation'
export { LocalDiskStorage } from './local-disk-storage'
export { S3Storage } from './s3-storage'

// Export convenience functions
export const putObject = storageProvider.putObject.bind(storageProvider)
export const getSignedUrl = storageProvider.getSignedUrl.bind(storageProvider)
export const headObject = storageProvider.headObject.bind(storageProvider)
export const deleteObject = storageProvider.deleteObject.bind(storageProvider)
export const listObjects = storageProvider.listObjects.bind(storageProvider)