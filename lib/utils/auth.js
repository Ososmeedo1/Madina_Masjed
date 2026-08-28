import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export const AUTH_COOKIE = 'masjed_token';
export const TOKEN_MAX_AGE = 60 * 60 * 24 * 7;
const DEV_FALLBACK_SECRET = 'masjed-dev-secret-change-me';

function getSecret() {
  return process.env.JWT_SECRET || DEV_FALLBACK_SECRET;
}

/**
 * Create an HS256 JWT for a teacher session.
 * @param {{sub: string, email: string, role: string}} payload
 * @returns {string} Signed token valid for TOKEN_MAX_AGE seconds.
 */
export function signAuthToken({ sub, email, role }) {
  return jwt.sign({ sub, email, role }, getSecret(), {
    algorithm: 'HS256',
    expiresIn: TOKEN_MAX_AGE,
  });
}

/**
 * Verify and decode a session JWT.
 * @param {string} token
 * @returns {object|null} Decoded payload, or null when invalid/expired.
 */
export function verifyAuthToken(token) {
  try {
    return jwt.verify(token, getSecret(), { algorithms: ['HS256'] });
  } catch {
    return null;
  }
}

/**
 * Read + verify the auth cookie from a Next.js Request/NextRequest.
 * @param {Request} request
 * @returns {object|null} JWT payload or null.
 */
export function getAuthFromRequest(request) {
  const token = request?.cookies?.get(AUTH_COOKIE)?.value;
  return token ? verifyAuthToken(token) : null;
}

/**
 * Session helper for server components (uses next/headers cookies).
 * @returns {Promise<object|null>}
 */
export async function getSessionPayload() {
  const { cookies } = await import('next/headers');
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  return token ? verifyAuthToken(token) : null;
}

/**
 * Hash a plaintext password with bcrypt (10 rounds).
 * @param {string} plain
 * @returns {Promise<string>} bcrypt digest.
 */
export function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

/**
 * Constant-time-ish bcrypt comparison of a plaintext against a stored hash.
 * @param {string} plain
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
export function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

export function authCookieOptions(maxAge = TOKEN_MAX_AGE) {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge,
  };
}
