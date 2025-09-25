import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Initialize global error handlers only in Node.js server environment
if (typeof window === 'undefined' && typeof process !== 'undefined' && process.env && process.env.NODE_ENV) {
  try {
    require('@/lib/error-handlers')
  } catch (error) {
    console.error('Failed to load error handlers:', error)
  }
}

// Security headers configuration
const securityHeaders = {
  'X-DNS-Prefetch-Control': 'on',
  'X-XSS-Protection': '1; mode=block',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https: wss:",
    "media-src 'self' blob: data:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ')
}

// Rate limiting configuration
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

const RATE_LIMIT_WINDOW = 15 * 60 * 1000 // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 100 // 100 requests per window

function getRateLimitKey(ip: string, userId?: string): string {
  return userId ? `user:${userId}` : `ip:${ip}`
}

function checkRateLimit(ip: string, userId?: string): boolean {
  const key = getRateLimitKey(ip, userId)
  const now = Date.now()
  const record = rateLimitMap.get(key)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false
  }

  record.count++
  return true
}

// Clean up old rate limit records
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key)
    }
  }
}, 5 * 60 * 1000) // Clean up every 5 minutes

// Logging function
function logRequest(request: NextRequest, userId?: string, additionalData?: any) {
  const requestId = crypto.randomUUID()
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'
  const method = request.method
  const url = request.url
  const timestamp = new Date().toISOString()

  console.log(JSON.stringify({
    requestId,
    userId: userId || 'anonymous',
    ip,
    method,
    url,
    userAgent,
    timestamp,
    ...additionalData
  }))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
  
  // Bypass middleware completely for file uploads
  if (pathname === '/api/upload/file' && request.method === 'POST') {
    return NextResponse.next()
  }
  
  // Get user token for authenticated requests
  const token = await getToken({ req: request })
  const userId = token?.sub

  // Log all requests
  logRequest(request, userId)

  // Apply security headers to all responses
  const response = NextResponse.next()
  
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // Rate limiting for API routes
  if (pathname.startsWith('/api/')) {
    if (!checkRateLimit(ip, userId)) {
      logRequest(request, userId, { 
        action: 'rate_limit_exceeded',
        rateLimitKey: getRateLimitKey(ip, userId)
      })
      
      return new NextResponse(
        JSON.stringify({ 
          error: 'Too many requests',
          retryAfter: RATE_LIMIT_WINDOW / 1000 
        }),
        { 
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': (RATE_LIMIT_WINDOW / 1000).toString(),
            ...securityHeaders
          }
        }
      )
    }
  }

  // CSRF protection for state-changing operations
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    const origin = request.headers.get('origin')
    const host = request.headers.get('host')
    
    // Skip CSRF check for file uploads and API routes
    if (!pathname.startsWith('/api/upload/')) {
      // Allow same-origin requests and localhost development
      if (origin && host && !origin.includes(host) && !origin.includes('localhost')) {
        logRequest(request, userId, { 
          action: 'csrf_blocked',
          origin,
          host
        })
        
        return new NextResponse(
          JSON.stringify({ error: 'CSRF token mismatch' }),
          { 
            status: 403,
            headers: {
              'Content-Type': 'application/json',
              ...securityHeaders
            }
          }
        )
      }
    }
  }

  // Admin route protection
  if (pathname.startsWith('/admin')) {
    if (!token || token.role !== 'admin') {
      logRequest(request, userId, { 
        action: 'admin_access_denied',
        hasToken: !!token,
        userRole: token?.role
      })
      
      return new NextResponse(
        JSON.stringify({ error: 'Admin access required' }),
        { 
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            ...securityHeaders
          }
        }
      )
    }
  }

  // Add request ID to headers for tracing
  response.headers.set('X-Request-ID', crypto.randomUUID())

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api/upload/file (bypass middleware for uploads)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api/upload/file).*)',
  ],
}