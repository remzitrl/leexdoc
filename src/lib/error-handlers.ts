import { randomUUID } from 'crypto'

interface ErrorLog {
  type: 'unhandledRejection' | 'uncaughtException'
  error: any
  requestId: string
  timestamp: string
  processId: number
  memoryUsage: NodeJS.MemoryUsage
  stack?: string
}

function logError(errorLog: ErrorLog) {
}

if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV) {
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    const requestId = randomUUID()
    
    logError({
      type: 'unhandledRejection',
      error: reason,
      requestId,
      timestamp: new Date().toISOString(),
      processId: process.pid,
      memoryUsage: process.memoryUsage(),
      stack: reason?.stack
    })
    
    process.exit(1)
  })

  process.on('uncaughtException', (error: Error) => {
    const requestId = randomUUID()
    
    logError({
      type: 'uncaughtException',
      error: error.message,
      requestId,
      timestamp: new Date().toISOString(),
      processId: process.pid,
      memoryUsage: process.memoryUsage(),
      stack: error.stack
    })
    
    process.exit(1)
  })

  process.on('SIGTERM', () => {
    process.exit(0)
  })

  process.on('SIGINT', () => {
    process.exit(0)
  })

} else {
}
