// Global error handlers for unhandled rejections and exceptions
// Only initialize in Node.js environment, not in Edge Runtime
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
  console.error(JSON.stringify({
    ...errorLog,
    level: 'ERROR',
    message: `${errorLog.type} occurred`,
    service: 'mixora-upload-api'
  }))
}

// Only initialize error handlers in Node.js environment
if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV) {
  // Handle unhandled promise rejections
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
    
    // Terminate the process after logging
    console.error('Terminating process due to unhandled rejection')
    process.exit(1)
  })

  // Handle uncaught exceptions
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
    
    // Terminate the process after logging
    console.error('Terminating process due to uncaught exception')
    process.exit(1)
  })

  // Handle SIGTERM and SIGINT for graceful shutdown
  process.on('SIGTERM', () => {
    console.log(JSON.stringify({
      level: 'INFO',
      message: 'SIGTERM received, shutting down gracefully',
      timestamp: new Date().toISOString(),
      processId: process.pid
    }))
    process.exit(0)
  })

  process.on('SIGINT', () => {
    console.log(JSON.stringify({
      level: 'INFO',
      message: 'SIGINT received, shutting down gracefully',
      timestamp: new Date().toISOString(),
      processId: process.pid
    }))
    process.exit(0)
  })

  console.log(JSON.stringify({
    level: 'INFO',
    message: 'Global error handlers initialized',
    timestamp: new Date().toISOString(),
    processId: process.pid
  }))
} else {
  console.log(JSON.stringify({
    level: 'INFO',
    message: 'Error handlers skipped - not in Node.js environment',
    timestamp: new Date().toISOString()
  }))
}
