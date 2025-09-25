import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {

  // Create a test user
  const hashedPassword = await bcrypt.hash('password123', 12)
  
  const user = await prisma.user.upsert({
    where: { email: 'test@mixora.com' },
    update: {},
    create: {
      email: 'test@mixora.com',
      passwordHash: hashedPassword,
      displayName: 'Test User',
    },
  })


  // Create user settings
  await prisma.userSetting.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      theme: 'dark',
      language: 'en',
      autoplay: true,
      defaultQuality: 'q320',
      downloadOverWifiOnly: false,
    },
  })


  // Create sample tracks
  const tracks = [
    {
      title: 'Sample Track 1',
      artist: 'Test Artist',
      album: 'Test Album',
      genre: 'Electronic',
      durationSec: 180,
      bpm: 128,
      loudnessI: -12.5,
      sourceType: 'File' as const,
      status: 'Ready' as const,
    },
    {
      title: 'Sample Track 2',
      artist: 'Test Artist',
      album: 'Test Album',
      genre: 'Rock',
      durationSec: 240,
      bpm: 140,
      loudnessI: -10.2,
      sourceType: 'File' as const,
      status: 'Ready' as const,
    },
    {
      title: 'Sample Track 3',
      artist: 'Another Artist',
      album: 'Different Album',
      genre: 'Jazz',
      durationSec: 320,
      bpm: 90,
      loudnessI: -8.7,
      sourceType: 'File' as const,
      status: 'Ready' as const,
    },
  ]

  const createdTracks = []
  for (const trackData of tracks) {
    const track = await prisma.track.create({
      data: {
        ...trackData,
        ownerId: user.id,
        originalFileKey: `tracks/${user.id}/${trackData.title.toLowerCase().replace(/\s+/g, '-')}.mp3`,
        audio320Key: `tracks/${user.id}/${trackData.title.toLowerCase().replace(/\s+/g, '-')}-320.mp3`,
        audio128Key: `tracks/${user.id}/${trackData.title.toLowerCase().replace(/\s+/g, '-')}-128.mp3`,
        coverImageKey: `covers/${user.id}/${trackData.title.toLowerCase().replace(/\s+/g, '-')}.jpg`,
      },
    })
    createdTracks.push(track)
  }


  // Create a sample playlist
  const playlist = await prisma.playlist.create({
    data: {
      userId: user.id,
      name: 'My Favorites',
    },
  })


  // Add tracks to playlist
  for (let i = 0; i < createdTracks.length; i++) {
    await prisma.playlistItem.create({
      data: {
        playlistId: playlist.id,
        trackId: createdTracks[i].id,
        position: i,
      },
    })
  }


  // Create some likes
  await prisma.like.create({
    data: {
      userId: user.id,
      trackId: createdTracks[0].id,
    },
  })

  await prisma.like.create({
    data: {
      userId: user.id,
      trackId: createdTracks[1].id,
    },
  })


  // Create download records
  for (const track of createdTracks) {
    await prisma.download.create({
      data: {
        userId: user.id,
        trackId: track.id,
        state: 'Available',
        bytesTotal: 5000000, // 5MB
        bytesStored: 5000000,
      },
    })
  }


  // Create a playback session
  await prisma.playbackSession.create({
    data: {
      userId: user.id,
      trackId: createdTracks[0].id,
      lastPositionSec: 45,
      completed: false,
    },
  })


}

main()
  .catch((e) => {
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
