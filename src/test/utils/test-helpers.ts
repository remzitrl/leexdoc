import { vi } from 'vitest'
import { db } from '@/lib/db'
import { storage } from '@/lib/storage'
import { createTranscodeJob } from '@/lib/queue'

export interface TestUser {
  id: string
  email: string
  displayName: string
  role: string
}

export interface TestTrack {
  id: string
  title: string
  artist: string
  album: string
  durationSec: number
  status: 'Processing' | 'Ready' | 'Failed'
  ownerId: string
}

export interface TestUpload {
  id: string
  userId: string
  originalFilename: string
  fileSize: number
  mimeType: string
  status: 'Processing' | 'Completed' | 'Failed'
}

export class TestDataFactory {
  static createUser(overrides: Partial<TestUser> = {}): TestUser {
    return {
      id: 'test-user-' + Math.random().toString(36).substr(2, 9),
      email: 'test@example.com',
      displayName: 'Test User',
      role: 'user',
      ...overrides,
    }
  }

  static createTrack(overrides: Partial<TestTrack> = {}): TestTrack {
    return {
      id: 'test-track-' + Math.random().toString(36).substr(2, 9),
      title: 'Test Track',
      artist: 'Test Artist',
      album: 'Test Album',
      durationSec: 180,
      status: 'Ready',
      ownerId: 'test-user-123',
      ...overrides,
    }
  }

  static createUpload(overrides: Partial<TestUpload> = {}): TestUpload {
    return {
      id: 'test-upload-' + Math.random().toString(36).substr(2, 9),
      userId: 'test-user-123',
      originalFilename: 'test.mp3',
      fileSize: 1024 * 1024, // 1MB
      mimeType: 'audio/mpeg',
      status: 'Processing',
      ...overrides,
    }
  }

  static createAudioFile(
    name: string = 'test.mp3',
    size: number = 1024,
    type: string = 'audio/mpeg'
  ): File {
    const data = new Array(size).fill('a').join('')
    return new File([data], name, { type })
  }
}

export class MockDatabase {
  static setupMocks() {
    vi.mocked(db.user.findUnique).mockResolvedValue(null)
    vi.mocked(db.user.create).mockResolvedValue(TestDataFactory.createUser() as any)
    vi.mocked(db.user.update).mockResolvedValue(TestDataFactory.createUser() as any)
    vi.mocked(db.user.delete).mockResolvedValue(TestDataFactory.createUser() as any)
    vi.mocked(db.user.count).mockResolvedValue(1)

    vi.mocked(db.track.findUnique).mockResolvedValue(null)
    vi.mocked(db.track.findMany).mockResolvedValue([])
    vi.mocked(db.track.create).mockResolvedValue(TestDataFactory.createTrack() as any)
    vi.mocked(db.track.update).mockResolvedValue(TestDataFactory.createTrack() as any)
    vi.mocked(db.track.delete).mockResolvedValue(TestDataFactory.createTrack() as any)
    vi.mocked(db.track.count).mockResolvedValue(1)
    vi.mocked(db.track.aggregate).mockResolvedValue({ _sum: { durationSec: 180 } } as any)

    vi.mocked(db.upload.findUnique).mockResolvedValue(null)
    vi.mocked(db.upload.findMany).mockResolvedValue([])
    vi.mocked(db.upload.create).mockResolvedValue(TestDataFactory.createUpload() as any)
    vi.mocked(db.upload.update).mockResolvedValue(TestDataFactory.createUpload() as any)
    vi.mocked(db.upload.delete).mockResolvedValue(TestDataFactory.createUpload() as any)
    vi.mocked(db.upload.count).mockResolvedValue(1)

    vi.mocked(db.playlist.findUnique).mockResolvedValue(null)
    vi.mocked(db.playlist.findMany).mockResolvedValue([])
    vi.mocked(db.playlist.create).mockResolvedValue({
      id: 'test-playlist-123',
      name: 'Test Playlist',
      description: 'Test Description',
      userId: 'test-user-123',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any)
    vi.mocked(db.playlist.update).mockResolvedValue({
      id: 'test-playlist-123',
      name: 'Updated Playlist',
      description: 'Updated Description',
      userId: 'test-user-123',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any)
    vi.mocked(db.playlist.delete).mockResolvedValue({
      id: 'test-playlist-123',
      name: 'Test Playlist',
      description: 'Test Description',
      userId: 'test-user-123',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any)
    vi.mocked(db.playlist.count).mockResolvedValue(1)

    vi.mocked(db.userSetting.findUnique).mockResolvedValue(null)
    vi.mocked(db.userSetting.upsert).mockResolvedValue({
      id: 'test-setting-123',
      userId: 'test-user-123',
      theme: 'dark',
      language: 'en',
      autoplay: true,
      defaultQuality: 'q128',
      downloadOverWifiOnly: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any)
  }

  static resetMocks() {
    vi.clearAllMocks()
    this.setupMocks()
  }
}

export class MockStorage {
  static setupMocks() {
    vi.mocked(storage.putObject).mockResolvedValue({ key: 'test-key' })
    vi.mocked(storage.getObject).mockResolvedValue(Buffer.from('test-data'))
    vi.mocked(storage.getObjectBuffer).mockResolvedValue(Buffer.from('test-data'))
    vi.mocked(storage.deleteObject).mockResolvedValue(undefined)
    vi.mocked(storage.getSignedUrl).mockResolvedValue('http://test-signed-url.com')
    vi.mocked(storage.headObject).mockResolvedValue({
      size: 1024,
      lastModified: new Date(),
      contentType: 'audio/mpeg',
    })
    vi.mocked(storage.listObjects).mockResolvedValue([])
  }

  static resetMocks() {
    vi.clearAllMocks()
    this.setupMocks()
  }
}

export class MockQueue {
  static setupMocks() {
    vi.mocked(createTranscodeJob).mockResolvedValue({
      id: 'test-job-123',
      name: 'transcode',
      data: {
        trackId: 'test-track-123',
        uploadId: 'test-upload-123',
        userId: 'test-user-123',
        inputPath: 'test-input-path',
        tempPath: 'test-temp-path',
      },
    } as any)
  }

  static resetMocks() {
    vi.clearAllMocks()
    this.setupMocks()
  }
}

export class TestEnvironment {
  static setup() {
    MockDatabase.setupMocks()
    MockStorage.setupMocks()
    MockQueue.setupMocks()
  }

  static reset() {
    MockDatabase.resetMocks()
    MockStorage.resetMocks()
    MockQueue.resetMocks()
  }

  static mockSuccessfulTranscode() {
    vi.mocked(db.track.update).mockResolvedValue({
      ...TestDataFactory.createTrack(),
      status: 'Ready',
      durationSec: 180,
      bpm: 120,
      loudnessI: -23,
      audio320Key: 'test-320-key',
      audio128Key: 'test-128-key',
      waveformJsonKey: 'test-waveform-key',
      coverImageKey: 'test-cover-key',
    } as any)

    vi.mocked(db.upload.update).mockResolvedValue({
      ...TestDataFactory.createUpload(),
      status: 'Completed',
    } as any)
  }

  static mockFailedTranscode() {
    vi.mocked(db.track.update).mockResolvedValue({
      ...TestDataFactory.createTrack(),
      status: 'Failed',
    } as any)

    vi.mocked(db.upload.update).mockResolvedValue({
      ...TestDataFactory.createUpload(),
      status: 'Failed',
    } as any)
  }
}

export class TestAssertions {
  static expectTrackToBeReady(track: any) {
    expect(track.status).toBe('Ready')
    expect(track.durationSec).toBeGreaterThan(0)
    expect(track.audio320Key).toBeDefined()
    expect(track.audio128Key).toBeDefined()
    expect(track.waveformJsonKey).toBeDefined()
  }

  static expectUploadToBeCompleted(upload: any) {
    expect(upload.status).toBe('Completed')
  }

  static expectTrackToBeFailed(track: any) {
    expect(track.status).toBe('Failed')
  }

  static expectUploadToBeFailed(upload: any) {
    expect(upload.status).toBe('Failed')
  }
}

export class TestFixtures {
  static getValidAudioFile(): File {
    return TestDataFactory.createAudioFile('test.mp3', 1024 * 1024, 'audio/mpeg')
  }

  static getInvalidFile(): File {
    return TestDataFactory.createAudioFile('test.exe', 1024, 'application/octet-stream')
  }

  static getOversizedFile(): File {
    return TestDataFactory.createAudioFile('huge.mp3', 1024 * 1024 * 1024, 'audio/mpeg') // 1GB
  }

  static getMultipleFiles(): File[] {
    return [
      TestDataFactory.createAudioFile('track1.mp3', 1024 * 1024, 'audio/mpeg'),
      TestDataFactory.createAudioFile('track2.wav', 1024 * 1024, 'audio/wav'),
      TestDataFactory.createAudioFile('track3.flac', 1024 * 1024, 'audio/flac'),
    ]
  }
}
