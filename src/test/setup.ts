import '@testing-library/jest-dom'
import { vi } from 'vitest'
import React from 'react'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock Next.js session
vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: null,
    status: 'unauthenticated',
  }),
  signIn: vi.fn(),
  signOut: vi.fn(),
}))

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return React.createElement('img', props)
  },
}))

// Mock environment variables
vi.mock('@/lib/env', () => ({
  env: {
    NEXTAUTH_SECRET: 'test-secret',
    NEXTAUTH_URL: 'http://localhost:3000',
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    REDIS_URL: 'redis://localhost:6379',
    STORAGE_PROVIDER: 'local',
  },
}))

// Mock path module
vi.mock('node:path', () => {
  const actual = vi.importActual('node:path')
  return {
    ...actual,
    default: {
      resolve: vi.fn((...args) => args.join('/')),
      join: vi.fn((...args) => args.join('/')),
      dirname: vi.fn((p) => p.split('/').slice(0, -1).join('/')),
      basename: vi.fn((p) => p.split('/').pop()),
      extname: vi.fn((p) => {
        const parts = p.split('.')
        return parts.length > 1 ? '.' + parts.pop() : ''
      }),
      posix: {
        normalize: vi.fn((p) => p),
      },
    },
  }
})

// Mock fs module
vi.mock('node:fs', () => ({
  default: {
    existsSync: vi.fn(),
    mkdirSync: vi.fn(),
    writeFileSync: vi.fn(),
    readFileSync: vi.fn(),
    unlinkSync: vi.fn(),
    statSync: vi.fn(),
    readdirSync: vi.fn(),
  },
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  writeFileSync: vi.fn(),
  readFileSync: vi.fn(),
  unlinkSync: vi.fn(),
  statSync: vi.fn(),
  readdirSync: vi.fn(),
}))

vi.mock('node:fs/promises', () => ({
  default: {
    access: vi.fn(),
    mkdir: vi.fn(),
    writeFile: vi.fn(),
    readFile: vi.fn(),
    unlink: vi.fn(),
    stat: vi.fn(),
    readdir: vi.fn(),
  },
  access: vi.fn(),
  mkdir: vi.fn(),
  writeFile: vi.fn(),
  readFile: vi.fn(),
  unlink: vi.fn(),
  stat: vi.fn(),
  readdir: vi.fn(),
}))

// Mock ffmpeg
vi.mock('fluent-ffmpeg', () => ({
  default: vi.fn(() => ({
    audioCodec: vi.fn().mockReturnThis(),
    audioBitrate: vi.fn().mockReturnThis(),
    audioChannels: vi.fn().mockReturnThis(),
    audioFrequency: vi.fn().mockReturnThis(),
    format: vi.fn().mockReturnThis(),
    audioFilters: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    save: vi.fn().mockReturnThis(),
    pipe: vi.fn().mockReturnThis(),
  })),
}))

// Mock music-metadata
vi.mock('music-metadata', () => ({
  parseFile: vi.fn().mockResolvedValue({
    format: {
      duration: 180,
      bitrate: 320000,
    },
    common: {
      title: 'Test Track',
      artist: 'Test Artist',
      album: 'Test Album',
      genre: ['Test Genre'],
      bpm: 120,
      picture: [{
        data: new Uint8Array([102, 97, 107, 101, 45, 105, 109, 97, 103, 101, 45, 100, 97, 116, 97]), // 'fake-image-data' as Uint8Array
        format: 'jpeg',
      }],
    },
  }),
}))

// Mock BullMQ
vi.mock('bullmq', () => ({
  Queue: vi.fn().mockImplementation(() => ({
    add: vi.fn().mockResolvedValue({ id: 'test-job-id' }),
    getWaiting: vi.fn().mockResolvedValue([]),
    getActive: vi.fn().mockResolvedValue([]),
    getCompleted: vi.fn().mockResolvedValue([]),
    getFailed: vi.fn().mockResolvedValue([]),
    getDelayed: vi.fn().mockResolvedValue([]),
    clean: vi.fn().mockResolvedValue(0),
  })),
  Worker: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    close: vi.fn(),
  })),
}))

// Mock Redis
vi.mock('ioredis', () => ({
  default: vi.fn().mockImplementation(() => ({
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    exists: vi.fn(),
    expire: vi.fn(),
    zadd: vi.fn(),
    zrem: vi.fn(),
    zrange: vi.fn(),
    zcard: vi.fn(),
  })),
}))

// Mock Prisma
vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    track: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
    },
    upload: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    playlist: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    userSetting: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}))

// Mock storage
vi.mock('@/lib/storage', () => ({
  storage: {
    putObject: vi.fn().mockResolvedValue({ key: 'test-key' }),
    getObject: vi.fn().mockResolvedValue(new Uint8Array([116, 101, 115, 116, 45, 100, 97, 116, 97])), // 'test-data' as Uint8Array
    getObjectBuffer: vi.fn().mockResolvedValue(new Uint8Array([116, 101, 115, 116, 45, 100, 97, 116, 97])), // 'test-data' as Uint8Array
    deleteObject: vi.fn().mockResolvedValue(undefined),
    getSignedUrl: vi.fn().mockResolvedValue('http://test-signed-url.com'),
    headObject: vi.fn().mockResolvedValue({ size: 1024 }),
    listObjects: vi.fn().mockResolvedValue([]),
  },
}))

// Mock crypto for tests
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
  },
})

// Mock fetch
global.fetch = vi.fn()

// Mock File constructor with arrayBuffer support
global.File = class File {
  name: string
  size: number
  type: string
  lastModified: number
  private _data: Uint8Array

  constructor(chunks: any[], filename: string, options: any = {}) {
    this.name = filename
    this.size = chunks.reduce((acc, chunk) => acc + chunk.length, 0)
    this.type = options.type || 'audio/mpeg'
    this.lastModified = options.lastModified || Date.now()
    
    // Convert chunks to Uint8Array
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0)
    this._data = new Uint8Array(totalLength)
    let offset = 0
    for (const chunk of chunks) {
      if (typeof chunk === 'string') {
        const encoder = new TextEncoder()
        const encoded = encoder.encode(chunk)
        this._data.set(encoded, offset)
        offset += encoded.length
      } else if (chunk instanceof ArrayBuffer) {
        this._data.set(new Uint8Array(chunk), offset)
        offset += chunk.byteLength
      } else if (chunk instanceof Uint8Array) {
        this._data.set(chunk, offset)
        offset += chunk.length
      } else {
        // Convert other types to string first
        const str = String(chunk)
        const encoder = new TextEncoder()
        const encoded = encoder.encode(str)
        this._data.set(encoded, offset)
        offset += encoded.length
      }
    }
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    return this._data.buffer.slice(this._data.byteOffset, this._data.byteOffset + this._data.byteLength)
  }

  stream(): ReadableStream {
    return new ReadableStream({
      start(controller) {
        controller.enqueue(this._data)
        controller.close()
      }
    })
  }

  text(): Promise<string> {
    const decoder = new TextDecoder()
    return Promise.resolve(decoder.decode(this._data))
  }
} as any

// Mock Blob constructor with arrayBuffer support
global.Blob = class Blob {
  size: number
  type: string
  private _data: Uint8Array

  constructor(chunks: any[], options: any = {}) {
    this.size = chunks.reduce((acc, chunk) => acc + chunk.length, 0)
    this.type = options.type || 'audio/mpeg'
    
    // Convert chunks to Uint8Array
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0)
    this._data = new Uint8Array(totalLength)
    let offset = 0
    for (const chunk of chunks) {
      if (typeof chunk === 'string') {
        const encoder = new TextEncoder()
        const encoded = encoder.encode(chunk)
        this._data.set(encoded, offset)
        offset += encoded.length
      } else if (chunk instanceof ArrayBuffer) {
        this._data.set(new Uint8Array(chunk), offset)
        offset += chunk.byteLength
      } else if (chunk instanceof Uint8Array) {
        this._data.set(chunk, offset)
        offset += chunk.length
      } else {
        // Convert other types to string first
        const str = String(chunk)
        const encoder = new TextEncoder()
        const encoded = encoder.encode(str)
        this._data.set(encoded, offset)
        offset += encoded.length
      }
    }
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    return this._data.buffer.slice(this._data.byteOffset, this._data.byteOffset + this._data.byteLength)
  }

  stream(): ReadableStream {
    return new ReadableStream({
      start(controller) {
        controller.enqueue(this._data)
        controller.close()
      }
    })
  }

  async text(): Promise<string> {
    const decoder = new TextDecoder()
    return decoder.decode(this._data)
  }
} as any
