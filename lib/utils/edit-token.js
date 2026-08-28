import crypto from 'crypto';

export const EDIT_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Generate a 256-bit URL-safe random edit token (shown to the student once).
 * @returns {string} 43-char base64url token.
 */
export function generateEditToken() {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * SHA-256 hex digest of a raw edit token — this is what gets persisted.
 * @param {string} token Raw token.
 * @returns {string} 64-char hex digest.
 */
export function hashEditToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Timing-safe comparison of sha256(rawToken) against the stored digest.
 * @param {string} token Raw token provided by the student.
 * @param {string} storedHash Digest from the database.
 * @returns {boolean}
 */
export function verifyEditToken(token, storedHash) {
  if (typeof token !== 'string' || token.length === 0) return false;
  if (typeof storedHash !== 'string' || storedHash.length === 0) return false;
  const candidate = Buffer.from(hashEditToken(token), 'hex');
  const stored = Buffer.from(storedHash, 'hex');
  if (candidate.length !== stored.length) return false;
  return crypto.timingSafeEqual(candidate, stored);
}

/**
 * True when the record is older than the 30-day token lifetime.
 * @param {Date|string|number} createdAt Record creation timestamp.
 * @returns {boolean}
 */
export function isTokenExpired(createdAt) {
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) return true;
  return Date.now() - created > EDIT_TOKEN_TTL_MS;
}
