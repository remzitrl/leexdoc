import argon2 from 'argon2'
import jwt from 'jsonwebtoken'
import { db } from './db'
import { ENV } from './env'

export interface JWTPayload {
  userId: string
  email: string
  iat?: number
  exp?: number
}

export class AuthError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'AuthError'
  }
}

// Hash password with Argon2
export async function hashPassword(password: string): Promise<string> {
  try {
    return await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16, // 64 MB
      timeCost: 3,
      parallelism: 1,
    })
  } catch (error) {
    throw new AuthError('Failed to hash password', 'HASH_ERROR')
  }
}

// Verify password with Argon2
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    return await argon2.verify(hashedPassword, password)
  } catch (error) {
    throw new AuthError('Failed to verify password', 'VERIFY_ERROR')
  }
}

// Generate JWT token
export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, ENV.NEXTAUTH_SECRET, {
    expiresIn: '7d',
    issuer: 'mixora',
    audience: 'mixora-users',
  })
}

// Verify JWT token
export function verifyToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, ENV.NEXTAUTH_SECRET, {
      issuer: 'mixora',
      audience: 'mixora-users',
    }) as JWTPayload
  } catch (error) {
    throw new AuthError('Invalid or expired token', 'INVALID_TOKEN')
  }
}

// Generate password reset token
export function generatePasswordResetToken(): string {
  return jwt.sign(
    { type: 'password-reset', timestamp: Date.now() },
    ENV.NEXTAUTH_SECRET,
    { expiresIn: '1h' }
  )
}

// Verify password reset token
export function verifyPasswordResetToken(token: string): { valid: boolean; timestamp?: number } {
  try {
    const payload = jwt.verify(token, ENV.NEXTAUTH_SECRET) as any
    if (payload.type === 'password-reset') {
      return { valid: true, timestamp: payload.timestamp }
    }
    return { valid: false }
  } catch (error) {
    return { valid: false }
  }
}

// Check if email is unique
export async function isEmailUnique(email: string): Promise<boolean> {
  const existingUser = await db.user.findUnique({
    where: { email: email.toLowerCase() },
  })
  return !existingUser
}

// Get user by email
export async function getUserByEmail(email: string) {
  return db.user.findUnique({
    where: { email: email.toLowerCase() },
    include: {
      userSetting: true,
    },
  })
}

// Get user by ID
export async function getUserById(id: string) {
  return db.user.findUnique({
    where: { id },
    include: {
      userSetting: true,
    },
  })
}

// Create user
export async function createUser(data: {
  email: string
  password: string
  displayName: string
}) {
  const hashedPassword = await hashPassword(data.password)
  
  return db.user.create({
    data: {
      email: data.email.toLowerCase(),
      passwordHash: hashedPassword,
      displayName: data.displayName,
    },
    include: {
      userSetting: true,
    },
  })
}

// Create password reset token
export async function createPasswordResetToken(userId: string) {
  const token = generatePasswordResetToken()
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

  // Delete any existing tokens for this user
  await db.passwordResetToken.deleteMany({
    where: { userId },
  })

  return db.passwordResetToken.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  })
}

// Verify password reset token
export async function verifyPasswordResetTokenFromDB(token: string) {
  const tokenRecord = await db.passwordResetToken.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!tokenRecord) {
    throw new AuthError('Invalid reset token', 'INVALID_TOKEN')
  }

  if (tokenRecord.used) {
    throw new AuthError('Reset token already used', 'TOKEN_USED')
  }

  if (tokenRecord.expiresAt < new Date()) {
    throw new AuthError('Reset token expired', 'TOKEN_EXPIRED')
  }

  return tokenRecord
}

// Mark password reset token as used
export async function markPasswordResetTokenAsUsed(token: string) {
  return db.passwordResetToken.update({
    where: { token },
    data: { used: true },
  })
}

// Update user password
export async function updateUserPassword(userId: string, newPassword: string) {
  const hashedPassword = await hashPassword(newPassword)
  
  return db.user.update({
    where: { id: userId },
    data: { passwordHash: hashedPassword },
  })
}
