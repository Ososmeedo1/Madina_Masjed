import test from 'node:test';
import assert from 'node:assert/strict';

import { apiErrorAr, STATUS_FALLBACK } from '../../lib/utils/messages-ar.js';

test('server message wins when present', () => {
  assert.equal(apiErrorAr({ message: 'تم تسجيل حضورك مسبقًا' }, 409), 'تم تسجيل حضورك مسبقًا');
});

test('falls back to mapped Arabic text per status code', () => {
  assert.equal(apiErrorAr({}, 400), STATUS_FALLBACK[400]);
  assert.equal(apiErrorAr(null, 401), STATUS_FALLBACK[401]);
  assert.equal(apiErrorAr(undefined, 404, 'رسالة خاصة'), 'رسالة خاصة');
});

test('unknown status uses provided fallback then default', () => {
  assert.equal(apiErrorAr({}, 599, 'خطأ مخصص'), 'خطأ مخصص');
  assert.equal(apiErrorAr({}, 599), 'حدث خطأ غير متوقع');
});

test('covers all critical codes used by API routes', () => {
  for (const code of [400, 401, 403, 404, 409, 429, 500]) {
    assert.ok(typeof STATUS_FALLBACK[code] === 'string' && STATUS_FALLBACK[code].length > 3, String(code));
  }
});
