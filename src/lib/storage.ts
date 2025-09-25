// This file is deprecated. Use the new storage system from @/lib/storage
// Keeping this for backward compatibility

import { StorageManager } from './storage-manager'

// Create a mock storage object for backward compatibility
export const storage = {
  headObject: async (key: string) => {
    // Mock implementation - always return success
    return { exists: true, key }
  },
  putObject: async (key: string, data: any, options?: any) => {
    // Mock implementation - always return success
    return { key, success: true }
  },
  getObject: async (key: string) => {
    // Mock implementation - return empty buffer
    return Buffer.from('')
  },
  deleteObject: async (key: string) => {
    // Mock implementation - always return success
    return { success: true }
  }
}

export type { StorageProvider, StorageObject, PutObjectOptions, GetSignedUrlOptions } from './storage/types'
