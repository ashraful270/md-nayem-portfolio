import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { config } from './config.ts';

/* ==========================================================================
   PASSWORD HASHING & VERIFICATION
   ========================================================================== */
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, storedHash: string, salt: string): boolean {
  if (!password || !storedHash || !salt) return false;

  // 1. Primary: scrypt (64-byte key)
  try {
    const key = crypto.scryptSync(password, salt, 64).toString('hex');
    if (crypto.timingSafeEqual(Buffer.from(storedHash, 'hex'), Buffer.from(key, 'hex'))) {
      return true;
    }
  } catch {
    // continue to fallback check
  }

  // 2. Compatibility fallback: PBKDF2 with SHA-512 (100,000 iterations)
  try {
    const key = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    if (crypto.timingSafeEqual(Buffer.from(storedHash, 'hex'), Buffer.from(key, 'hex'))) {
      return true;
    }
  } catch {
    // fall through
  }

  // 3. Compatibility fallback: PBKDF2 with SHA-256 (100,000 iterations)
  try {
    const key = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha256').toString('hex');
    if (crypto.timingSafeEqual(Buffer.from(storedHash, 'hex'), Buffer.from(key, 'hex'))) {
      return true;
    }
  } catch {
    // fall through
  }

  return false;
}

/* ==========================================================================
   JWT TOKEN MANAGEMENT
   ========================================================================== */
export function createToken(payload: { id: string; username: string }): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // 7 days expiration
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
  const signature = crypto.createHmac('sha256', config.jwtSecret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string): { id: string; username: string; exp: number } | null {
  try {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', config.jwtSecret).update(`${header}.${body}`).digest('base64url');
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return null;
    }
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export interface AuthenticatedRequest extends Request {
  user?: { id: string; username: string };
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  const token = authHeader.substring(7);
  const user = verifyToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized: Token expired or invalid' });
  }

  req.user = user;
  next();
}

/* ==========================================================================
   RATE LIMITERS (Express Rate Limit)
   ========================================================================== */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many login attempts from this IP address. Please wait 15 minutes before trying again.',
  },
});

export const contactRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 messages per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many messages submitted from this IP address. Please wait a few minutes before submitting again.',
  },
});

export const uploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60, // 60 uploads per 15 min window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Upload rate limit reached. Please wait a few minutes before uploading more assets.',
  },
});
