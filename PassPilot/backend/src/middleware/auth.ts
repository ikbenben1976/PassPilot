import type { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { AuthPayload, AuthenticatedRequest } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'passpilot-dev-secret-change-in-production';
const JWT_EXPIRES_IN = '7d';

/**
 * Sign a JWT token for a user.
 */
export function signToken(payload: AuthPayload, expiresIn?: string): string {
  return jwt.sign(payload as object, JWT_SECRET, {
    expiresIn: (expiresIn ?? JWT_EXPIRES_IN) as unknown as number,
  });
}

/**
 * Verify and decode a JWT token.
 */
export function verifyToken(token: string): AuthPayload {
  return jwt.verify(token, JWT_SECRET) as AuthPayload;
}

/**
 * Require a valid JWT. Returns 401 if missing or invalid.
 */
export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const token = header.slice(7);
    req.user = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Attach user if token present, but don't block.
 */
export function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      req.user = verifyToken(header.slice(7));
    } catch {
      // Invalid token — proceed without user
    }
  }
  next();
}
