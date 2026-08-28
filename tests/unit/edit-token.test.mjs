import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';

import {
  generateEditToken,
  hashEditToken,
  verifyEditToken,
  isTokenExpired,
  EDIT_TOKEN_TTL_MS,
} from '../../lib/utils/edit-token.js';

test('generated tokens are 43-char base64url secrets', () => {
  const t = generateEditToken();
  assert.equal(t.length, 43);
  assert.match(t, /^[A-Za-z0-9_-]+$/);
  assert.notEqual(t, generateEditToken());
});

test('hash is deterministic sha256 hex of the token', () => {
  const token = generateEditToken();
  const hash = hashEditToken(token);
  assert.equal(hash.length, 64);
  assert.match(hash, /^[0-9a-f]{64}$/);
  assert.equal(hash, crypto.createHash('sha256').update(token).digest('hex'));
  assert.notEqual(hash, hashEditToken(token + 'x'));
});

test('verify passes only for exact token', () => {
  const token = generateEditToken();
  const stored = hashEditToken(token);
  assert.equal(verifyEditToken(token, stored), true);
  assert.equal(verifyEditToken(token.slice(0, -1), stored), false);
  assert.equal(verifyEditToken('', stored), false);
  assert.equal(verifyEditToken(undefined, stored), false);
  assert.equal(verifyEditToken(token, ''), false);
});

test('expiry after TTL window', () => {
  const now = Date.now();
  assert.equal(isTokenExpired(new Date(now - 1000)), false);
  assert.equal(isTokenExpired(new Date(now - EDIT_TOKEN_TTL_MS - 1000)), true);
  assert.equal(isTokenExpired(new Date('not-a-date')), true);
});
