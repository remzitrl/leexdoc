import { PrismaClient } from '@prisma/client'
import { TestDataFactory } from '../utils/test-helpers'

const testDb = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/mixora_test',
    },
  },
})

export class TestDatabase {
  static async setup() {
    // Clean up existing test data
    await this.cleanup()
    
    // Create test users
    const testUser = await testDb.user.create({
      data: {
        email: 'test@example.com',
        passwordHash: 'test-hash',
        displayName: 'Test User',
        role: 'user',
      },
    })

    const adminUser = await testDb.user.create({
      data: {
        email: 'admin@example.com',
        passwordHash: 'admin-hash',
        displayName: 'Admin User',
        role: 'admin',
      },
    })

    // Create test tracks
    const track1 = await testDb.track.create({
      data: {
        ownerId: testUser.id,
        title: 'Test Track 1',
        artist: 'Test Artist',
        album: 'Test Album',
        durationSec: 180,
        status: 'Ready',
        sourceType: 'File',
        audio320Key: 'test-320-key-1',
        audio128Key: 'test-128-key-1',
        waveformJsonKey: 'test-waveform-key-1',
        coverImageKey: 'test-cover-key-1',
      },
    })

    const track2 = await testDb.track.create({
      data: {
        ownerId: testUser.id,
        title: 'Test Track 2',
        artist: 'Test Artist',
        album: 'Test Album',
        durationSec: 240,
        status: 'Processing',
        sourceType: 'File',
      },
    })

    // Create test uploads
    const upload1 = await testDb.upload.create({
      data: {
        userId: testUser.id,
        originalFilename: 'test1.mp3',
        fileSize: 1024 * 1024,
        mimeType: 'audio/mpeg',
        status: 'Completed',
        sourceType: 'File',
      },
    })

    const upload2 = await testDb.upload.create({
      data: {
        userId: testUser.id,
        originalFilename: 'test2.wav',
        fileSize: 2 * 1024 * 1024,
        mimeType: 'audio/wav',
        status: 'Processing',
        sourceType: 'File',
      },
    })

    // Create test playlists
    const playlist1 = await testDb.playlist.create({
      data: {
        userId: testUser.id,
        name: 'Test Playlist 1',
        description: 'A test playlist',
        isPublic: false,
      },
    })

    // Create playlist items
    await testDb.playlistItem.create({
      data: {
        playlistId: playlist1.id,
        trackId: track1.id,
        position: 0,
      },
    })

    // Create user settings
    await testDb.userSetting.create({
      data: {
        userId: testUser.id,
        theme: 'dark',
        language: 'en',
        autoplay: true,
        defaultQuality: 'q128',
        downloadOverWifiOnly: true,
      },
    })

    return {
      users: { testUser, adminUser },
      tracks: { track1, track2 },
      uploads: { upload1, upload2 },
      playlists: { playlist1 },
    }
  }

  static async cleanup() {
    // Delete in reverse order to respect foreign key constraints
    await testDb.playlistItem.deleteMany()
    await testDb.playlist.deleteMany()
    await testDb.download.deleteMany()
    await testDb.like.deleteMany()
    await testDb.playbackSession.deleteMany()
    await testDb.track.deleteMany()
    await testDb.upload.deleteMany()
    await testDb.userSetting.deleteMany()
    await testDb.passwordResetToken.deleteMany()
    await testDb.user.deleteMany()
  }

  static async seed() {
    return this.setup()
  }

  static async getTestUser() {
    return testDb.user.findUnique({
      where: { email: 'test@example.com' },
      include: { userSetting: true },
    })
  }

  static async getAdminUser() {
    return testDb.user.findUnique({
      where: { email: 'admin@example.com' },
    })
  }

  static async getTestTracks() {
    return testDb.track.findMany({
      where: { ownerId: (await this.getTestUser())?.id },
    })
  }

  static async getTestPlaylists() {
    return testDb.playlist.findMany({
      where: { userId: (await this.getTestUser())?.id },
      include: { items: { include: { track: true } } },
    })
  }

  static async createTestTrack(overrides: any = {}) {
    const testUser = await this.getTestUser()
    if (!testUser) throw new Error('Test user not found')

    return testDb.track.create({
      data: {
        ownerId: testUser.id,
        title: 'Test Track',
        artist: 'Test Artist',
        album: 'Test Album',
        durationSec: 180,
        status: 'Ready',
        sourceType: 'File',
        ...overrides,
      },
    })
  }

  static async createTestPlaylist(overrides: any = {}) {
    const testUser = await this.getTestUser()
    if (!testUser) throw new Error('Test user not found')

    return testDb.playlist.create({
      data: {
        userId: testUser.id,
        name: 'Test Playlist',
        description: 'A test playlist',
        isPublic: false,
        ...overrides,
      },
    })
  }

  static async addTrackToPlaylist(playlistId: string, trackId: string, position?: number) {
    const maxPosition = await testDb.playlistItem.aggregate({
      where: { playlistId },
      _max: { position: true },
    })

    return testDb.playlistItem.create({
      data: {
        playlistId,
        trackId,
        position: position ?? (maxPosition._max.position ?? -1) + 1,
      },
    })
  }

  static async disconnect() {
    await testDb.$disconnect()
  }
}

export { testDb }
