import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-min-32-chars-long-required';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';

export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRY,
  });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

export function generateTemporaryPasswordToken(): string {
  return jwt.sign(
    { type: 'password_reset', expiresAt: Date.now() + 3600000 }, // 1 hour
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

export function verifyTemporaryPasswordToken(token: string): boolean {
  try {
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}
