import { NextRequest } from 'next/server'

export interface LogEntry {
  requestId: string
  userId?: string
  ip: string
  method: string
  url: string
  userAgent: string
  timestamp: string
  action?: string
  statusCode?: number
  duration?: number
  error?: string
  additionalData?: Record<string, any>
}

export interface SecurityEvent {
  type: 'rate_limit' | 'csrf_blocked' | 'admin_access_denied' | 'file_upload_blocked' | 'suspicious_activity'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  requestId: string
  userId?: string
  ip: string
  timestamp: string
  additionalData?: Record<string, any>
}

class Logger {
  private static instance: Logger
  private securityEvents: SecurityEvent[] = []
  private maxSecurityEvents = 1000 // Keep last 1000 security events in memory

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  public logRequest(request: NextRequest, additionalData?: Record<string, any>): string {
    const requestId = crypto.randomUUID()
    const ip = this.getClientIP(request)
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const method = request.method
    const url = request.url
    const timestamp = new Date().toISOString()

    const logEntry: LogEntry = {
      requestId,
      ip,
      method,
      url,
      userAgent,
      timestamp,
      ...additionalData
    }

    // Log to console in production, could be extended to log to external service
    console.log(JSON.stringify({
      type: 'request',
      ...logEntry
    }))

    return requestId
  }

  public logSecurityEvent(event: Omit<SecurityEvent, 'requestId' | 'timestamp'>): void {
    const securityEvent: SecurityEvent = {
      ...event,
      requestId: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    }

    // Add to in-memory store
    this.securityEvents.unshift(securityEvent)
    if (this.securityEvents.length > this.maxSecurityEvents) {
      this.securityEvents = this.securityEvents.slice(0, this.maxSecurityEvents)
    }

    // Log to console
    console.log(JSON.stringify({
      type: 'security_event',
      ...securityEvent
    }))

    // In production, you might want to send critical events to external monitoring
    if (securityEvent.severity === 'critical') {
      this.sendCriticalAlert(securityEvent)
    }
  }

  public logError(error: Error, requestId: string, additionalData?: Record<string, any>): void {
    console.error(JSON.stringify({
      type: 'error',
      requestId,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      timestamp: new Date().toISOString(),
      ...additionalData
    }))
  }

  public logFileUpload(
    requestId: string,
    userId: string,
    files: Array<{ name: string; size: number; type: string }>,
    validationResult: { isValid: boolean; error?: string },
    ip: string
  ): void {
    console.log(JSON.stringify({
      type: 'file_upload',
      requestId,
      userId,
      ip,
      files: files.map(f => ({
        name: f.name,
        size: f.size,
        type: f.type
      })),
      validationResult,
      timestamp: new Date().toISOString()
    }))

    if (!validationResult.isValid) {
      this.logSecurityEvent({
        type: 'file_upload_blocked',
        severity: 'medium',
        description: `File upload blocked: ${validationResult.error}`,
        userId,
        ip,
        additionalData: { files, validationResult }
      })
    }
  }

  public logAuthentication(
    requestId: string,
    action: 'login' | 'logout' | 'register' | 'password_reset',
    userId?: string,
    success: boolean = true,
    ip: string,
    additionalData?: Record<string, any>
  ): void {
    console.log(JSON.stringify({
      type: 'authentication',
      requestId,
      action,
      userId,
      success,
      ip,
      timestamp: new Date().toISOString(),
      ...additionalData
    }))

    if (!success) {
      this.logSecurityEvent({
        type: 'suspicious_activity',
        severity: 'medium',
        description: `Failed authentication attempt: ${action}`,
        userId,
        ip,
        additionalData
      })
    }
  }

  public logAdminAction(
    requestId: string,
    adminUserId: string,
    action: string,
    targetUserId?: string,
    additionalData?: Record<string, any>
  ): void {
    console.log(JSON.stringify({
      type: 'admin_action',
      requestId,
      adminUserId,
      action,
      targetUserId,
      timestamp: new Date().toISOString(),
      ...additionalData
    }))
  }

  public getSecurityEvents(limit: number = 100): SecurityEvent[] {
    return this.securityEvents.slice(0, limit)
  }

  public getSecurityEventsBySeverity(severity: SecurityEvent['severity']): SecurityEvent[] {
    return this.securityEvents.filter(event => event.severity === severity)
  }

  public getRecentSecurityEvents(minutes: number = 60): SecurityEvent[] {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000)
    return this.securityEvents.filter(event => new Date(event.timestamp) > cutoff)
  }

  private getClientIP(request: NextRequest): string {
    return (
      request.ip ||
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown'
    )
  }

  private sendCriticalAlert(event: SecurityEvent): void {
    // In production, implement actual alerting (email, Slack, etc.)
    console.error(`CRITICAL SECURITY ALERT: ${event.description}`, event)
  }
}

export const logger = Logger.getInstance()

// Helper functions for common logging patterns
export function logRequestStart(request: NextRequest, userId?: string): string {
  return logger.logRequest(request, { userId, action: 'request_start' })
}

export function logRequestEnd(
  requestId: string,
  statusCode: number,
  duration: number,
  userId?: string
): void {
  console.log(JSON.stringify({
    type: 'request_end',
    requestId,
    statusCode,
    duration,
    userId,
    timestamp: new Date().toISOString()
  }))
}

export function logRateLimitExceeded(ip: string, userId?: string, endpoint?: string): void {
  logger.logSecurityEvent({
    type: 'rate_limit',
    severity: 'medium',
    description: `Rate limit exceeded for ${endpoint || 'endpoint'}`,
    userId,
    ip,
    additionalData: { endpoint }
  })
}

export function logCSRFBlocked(ip: string, userId?: string, origin?: string): void {
  logger.logSecurityEvent({
    type: 'csrf_blocked',
    severity: 'high',
    description: 'CSRF token mismatch detected',
    userId,
    ip,
    additionalData: { origin }
  })
}

export function logAdminAccessDenied(ip: string, userId?: string, attemptedPath?: string): void {
  logger.logSecurityEvent({
    type: 'admin_access_denied',
    severity: 'high',
    description: 'Unauthorized admin access attempt',
    userId,
    ip,
    additionalData: { attemptedPath }
  })
}

export function logSuspiciousActivity(
  description: string,
  ip: string,
  userId?: string,
  additionalData?: Record<string, any>
): void {
  logger.logSecurityEvent({
    type: 'suspicious_activity',
    severity: 'medium',
    description,
    userId,
    ip,
    additionalData
  })
}
