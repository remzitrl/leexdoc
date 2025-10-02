# Storage System

A comprehensive file storage system with support for local disk and S3-compatible storage providers.

## Features

- **Dual Storage Providers**: LocalDiskStorage and S3Storage
- **Security**: MIME type validation, file size limits, extension validation
- **User Isolation**: Files are organized by user ID
- **API Integration**: RESTful API endpoints for file management
- **Type Safety**: Full TypeScript support

## Supported File Types

### Audio Formats
- MP3 (`.mp3`) - `audio/mpeg`
- WAV (`.wav`) - `audio/wav`
- OGG (`.ogg`) - `audio/ogg`
- M4A (`.m4a`) - `audio/mp4`
- AAC (`.aac`) - `audio/aac`
- FLAC (`.flac`) - `audio/flac`
- WebM (`.webm`) - `audio/webm`

### Image Formats
- JPEG (`.jpg`, `.jpeg`) - `image/jpeg`
- PNG (`.png`) - `image/png`
- WebP (`.webp`) - `image/webp`
- GIF (`.gif`) - `image/gif`
- SVG (`.svg`) - `image/svg+xml`
- AVIF (`.avif`) - `image/avif`

## File Size Limits

- **Maximum file size**: 512MB
- **Validation**: Automatic size checking on upload

## Usage

### Basic Storage Operations

```typescript
import { storage } from '@/lib/storage'

// Upload a file
const result = await storage.putObject('user123/audio/song.mp3', buffer, {
  contentType: 'audio/mpeg',
  metadata: { artist: 'Artist Name' }
})

// Get a signed URL
const url = await storage.getSignedUrl('user123/audio/song.mp3', {
  expiresIn: 3600 // 1 hour
})

// Get file info
const info = await storage.headObject('user123/audio/song.mp3')

// Delete a file
await storage.deleteObject('user123/audio/song.mp3')

// List files
const files = await storage.listObjects('user123/audio')
```

### Using StorageManager

```typescript
import { StorageManager } from '@/lib/storage-manager'

// Upload with user isolation
const result = await StorageManager.uploadFile(
  userId,
  file,
  'audio',
  { contentType: 'audio/mpeg' }
)

// Get user's files
const files = await StorageManager.listUserFiles(userId, 'audio')

// Get storage usage
const usage = await StorageManager.getUserStorageUsage(userId)
```

## API Endpoints

### Upload File
```
POST /api/storage/upload
Content-Type: multipart/form-data

Form data:
- file: File
- folder: string (optional)
```

### Get File
```
GET /api/storage/{key}
```

### Get Signed URL
```
POST /api/storage/signed-url
Content-Type: application/json

{
  "key": "user123/audio/song.mp3",
  "expiresIn": 3600
}
```

### Delete File
```
DELETE /api/storage/{key}
```

## Configuration

### Environment Variables

```env
# Storage provider (local|s3)
STORAGE_PROVIDER=local

# S3 Configuration (when using S3)
S3_ENDPOINT=http://localhost:9000
S3_BUCKET=tracks
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin123
S3_REGION=us-east-1
```

### Local Storage
- **Base path**: `/storage` (configurable)
- **File serving**: Direct file access via `/api/storage/{key}`

### S3 Storage
- **Compatible with**: AWS S3, MinIO, DigitalOcean Spaces
- **File serving**: Signed URLs with configurable expiration

## Security Features

1. **File Type Validation**: Only audio and image files allowed
2. **Extension Validation**: File extension must match MIME type
3. **Size Limits**: 512MB maximum file size
4. **User Isolation**: Files organized by user ID
5. **Access Control**: Users can only access their own files
6. **Filename Sanitization**: Prevents path traversal attacks

## Error Handling

```typescript
import { StorageError, ValidationError, FileSizeError } from '@/lib/storage/types'

try {
  await storage.putObject(key, data)
} catch (error) {
  if (error instanceof FileSizeError) {
    // Handle file size error
  } else if (error instanceof ValidationError) {
    // Handle validation error
  } else if (error instanceof StorageError) {
    // Handle general storage error
  }
}
```

## Testing

Visit `/storage-test` page to test the storage functionality with a web interface.

## File Organization

```
storage/
├── {userId}/
│   ├── audio/
│   │   ├── {timestamp}-{random}-{filename}.mp3
│   │   └── ...
│   ├── images/
│   │   ├── {timestamp}-{random}-{filename}.jpg
│   │   └── ...
│   └── uploads/
│       └── ...
```

## Performance Considerations

- **Local Storage**: Direct file system access, fastest for single-server deployments
- **S3 Storage**: Better for distributed systems, CDN integration possible
- **Caching**: Files served with appropriate cache headers
- **Cleanup**: Automatic cleanup of old files available via StorageManager
