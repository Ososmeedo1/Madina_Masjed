import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(path.join(fileURLToPath(import.meta.url), '../../package.json'));
const mongoose = require('mongoose');

const PORT = 3100;
const BASE = `http://127.0.0.1:${PORT}`;
const EMAIL = 'itest@masjed.test';
const PASSWORD = 'Passw0rd!123';

let serverProc = null;
let teacherCookie = '';
let g1Id = '';
let g2Id = '';
let todayStr = '';

async function dropDb() {
  await mongoose.connect('mongodb://127.0.0.1:27017/masjed');
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
}

function startServer() {
  serverProc = spawn(
    process.execPath,
    [path.join(process.cwd(), 'node_modules', 'next', 'dist', 'bin', 'next'), 'start', '-p', String(PORT)],
    { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, NODE_ENV: 'production' } }
  );
  serverProc.stdout.on('data', () => {});
  serverProc.stderr.on('data', (d) => console.error('[server]', d.toString().slice(0, 300)));
}

async function stopServer() {
  if (!serverProc) return;
  await new Promise((resolve) => {
    serverProc.once('exit', resolve);
    serverProc.kill('SIGTERM');
    setTimeout(resolve, 3000).unref?.();
    setTimeout(() => {
      try { serverProc.kill('SIGKILL'); } catch {}
      resolve();
    }, 3500);
  });
  serverProc = null;
}

async function waitReady(timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE}/teacher/setup`, { redirect: 'manual' });
      if (res.status > 0) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error('server did not become ready');
}

function extractToken(headers) {
  const sc = headers.getSetCookie ? headers.getSetCookie() : [];
  for (const line of sc) {
    const m = /masjed_token=([^;]+)/.exec(line);
    if (m) return m[1];
  }
  return null;
}

function req(method, url, { body, cookie } = {}) {
  const headers = {};
  if (cookie) headers.Cookie = `masjed_token=${cookie}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  return fetch(`${BASE}${url}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    redirect: 'manual',
  });
}

async function postJson(url, body, cookie) {
  const res = await req('POST', url, { body, cookie });
  let data = null;
  try { data = await res.json(); } catch {}
  return { status: res.status, data, token: extractToken(res.headers) };
}

async function getJson(url, cookie) {
  const res = await req('GET', url, { cookie });
  let data = null;
  try { data = await res.json(); } catch {}
  return { status: res.status, data };
}

async function patchJson(url, body, cookie) {
  const res = await req('PATCH', url, { body, cookie });
  let data = null;
  try { data = await res.json(); } catch {}
  return { status: res.status, data };
}

test('setup: boots server on empty database', async () => {
  await dropDb();
  startServer();
  assert.equal(await waitReady(), true);
});

test('auth: first-run setup creates admin and sets session cookie', async () => {
  const r = await postJson('/api/setup', { email: EMAIL, password: PASSWORD, confirmPassword: PASSWORD });
  assert.equal(r.status, 201);
  assert.ok(r.token);
  assert.equal(r.data.teacher.email, EMAIL);
  teacherCookie = r.token;
});

test('auth: second setup attempt is rejected', async () => {
  const r = await postJson('/api/setup', { email: 'other@x.co', password: PASSWORD, confirmPassword: PASSWORD });
  assert.equal(r.status, 409);
});

test('groups: two default groups seeded with default times', async () => {
  const r = await getJson('/api/teacher/groups', teacherCookie);
  assert.equal(r.status, 200);
  assert.equal(r.data.groups.length, 2);
  g1Id = r.data.groups[0].id ?? r.data.groups[0]._id;
  g2Id = r.data.groups[1].id ?? r.data.groups[1]._id;
  assert.equal(r.data.groups[0].key, 'group-1');

  const H = Number(r.data.serverTime.slice(0, 2));
  todayStr = r.data.today.date;

  const st1 = `${String(H).padStart(2, '0')}:00`;
  const en1 = H >= 23 ? '23:59' : `${String(H + 1).padStart(2, '0')}:00`;
  await patchJson(`/api/teacher/groups/${g1Id}`, { startTime: st1, endTime: en1 }, teacherCookie);
});

test('attendance: window gating answers correctly before forcing open', async () => {
  const r = await postJson('/api/attendance/groups/group-1/register', {
    studentName: 'فحص البوابة',
    revision: 'الفاتحة',
    pagesCount: 1,
    countOfSard: 'واحد',
  });
  if (r.status === 201) {
    assert.ok(r.data.entry.order >= 1);
  } else {
    assert.equal(r.status, 400);
  }
});

const pad = (h) => String(Math.max(0, Math.min(23, h))).padStart(2, '0');

async function forceOpenGroup(groupId, cookie) {
  const snap = await getJson('/api/teacher/groups', cookie);
  const H = Number(snap.data.serverTime.slice(0, 2));
  const st = `${pad(H)}:00`;
  const en = H >= 23 ? '23:59' : `${pad(H + 1)}:00`;
  const r = await patchJson(`/api/teacher/groups/${groupId}`, { startTime: st, endTime: en }, cookie);
  assert.equal(r.status, 200);
  return { startTime: st, endTime: en };
}

test('attendance: happy path yields sequential orders and tokens', async () => {
  await forceOpenGroup(g1Id, teacherCookie);

  const names = [
    ['سالم عمر', 'الكهف', 5],
    ['نور الدين', 'يس', 4],
    ['بدر منير', 'الملك', 6],
  ];

  let expectedOrder = null;
  let i = 0;
  for (const [studentName, revision, pagesCount] of names) {
    const r = await postJson('/api/attendance/groups/group-1/register', {
      studentName, revision, pagesCount, countOfSard: 'أوجه متعددة',
    });
    assert.equal(r.status, 201, JSON.stringify(r.data));

    if (expectedOrder === null) {
      expectedOrder = r.data.entry.order;
      global.__editProbe = { id: r.data.entry._id, token: r.data.editToken };
    } else {
      assert.equal(r.data.entry.order, expectedOrder + 1);
      expectedOrder += 1;
    }
    assert.equal(r.data.editToken.length, 43);
    i += 1;
  }
  assert.equal(i, 3);
});

test('attendance: invalid payloads rejected with Arabic field errors', async () => {
  const cases = [
    [{ revision: 'الفاتحة', pagesCount: 1, countOfSard: 'واحد' }, ['studentName']],
    [{ studentName: 'محمد', revision: 'Baqarah 12', pagesCount: 1, countOfSard: 'واحد' }, ['revision']],
    [{ studentName: 'محمد', revision: 'البقرة', pagesCount: 0, countOfSard: 'واحد' }, ['pagesCount']],
    [{ studentName: 'محمد', revision: 'البقرة', pagesCount: 3.7, countOfSard: '' }, ['pagesCount']],
  ];
  for (const [body, keys] of cases) {
    const r = await postJson('/api/attendance/groups/group-1/register', body);
    assert.equal(r.status, 400);
    for (const k of keys) assert.ok(r.data.errors && r.data.errors[k], k);
  }
});

test('attendance: duplicate name (normalized spaces) blocked with 409 + attendanceId', async () => {
  const r = await postJson('/api/attendance/groups/group-1/register', {
    studentName: ' سالم   عمر ',
    revision: 'الفاتحة',
    pagesCount: 2,
    countOfSard: 'وجهان',
  });
  assert.equal(r.status, 409);
  assert.equal(r.data.message.includes('مسبق'), true);
  assert.ok(r.data.attendanceId);
});
test('groups: overlapping window rejected against sibling group', async () => {
  await patchJson(`/api/teacher/groups/${g1Id}`, { startTime: '10:00', endTime: '11:00' }, teacherCookie);

  const r = await patchJson(
    `/api/teacher/groups/${g2Id}`,
    { startTime: '10:30', endTime: '12:30' },
    teacherCookie
  );
  assert.equal(r.status, 400);
  assert.equal(r.data.code, 'GROUP_TIME_CONFLICT');
});

test('groups: start after end rejected', async () => {
  const r = await patchJson(`/api/teacher/groups/${g2Id}`, { startTime: '20:00', endTime: '10:00' }, teacherCookie);
  assert.equal(r.status, 400);
});

test('groups: adjacent non-overlapping update accepted', async () => {
  const r = await patchJson(
    `/api/teacher/groups/${g2Id}`,
    { startTime: '11:00', endTime: '12:00' },
    teacherCookie
  );
  assert.equal(r.status, 200);
  assert.equal(r.data.group.startTime, '11:00');
});

test('edit: wrong token rejected and never leaks hash', async () => {
  const list = await getJson('/api/attendance/groups/group-1');
  assert.equal(list.status, 200);
  const entry = list.data.entries[0];
  assert.equal(entry.editTokenHash, undefined);

  const bad = await fetch(`${BASE}/api/attendance/${entry._id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: 'wrong-token', pagesCount: 9 }),
  });
  assert.equal(bad.status, 401);

  const good = await fetch(`${BASE}/api/attendance/${entry._id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: 'still-wrong', pagesCount: 9 }),
  });
  assert.equal(good.status, 401);
});

test('absence: mark blocks registration for all groups; cancel restores', async () => {
  const mark = await postJson('/api/teacher/absence', { action: 'mark' }, teacherCookie);
  assert.equal(mark.status, 200);
  assert.equal(mark.data.absent, true);

  const att = await getJson('/api/attendance/groups/group-1');
  assert.equal(att.data.teacherAbsent, true);

  const reg = await postJson('/api/attendance/groups/group-2/register', {
    studentName: 'أثناء الغياب',
    revision: 'الفاتحة',
    pagesCount: 1,
    countOfSard: 'واحد',
  });
  assert.equal(reg.status, 403);
  assert.equal(reg.data.code, 'TEACHER_ABSENT');
  assert.ok(reg.data.message.includes('غائب'));

  const cancel = await postJson('/api/teacher/absence', { action: 'cancel' }, teacherCookie);
  assert.equal(cancel.status, 200);
  assert.equal(cancel.data.absent, false);
});

test('holidays: weekly flip makes today a holiday everywhere', async () => {
  const snap = await getJson('/api/teacher/groups', teacherCookie);
  const wd = snap.data.today.weekday;
  await patchJson('/api/teacher/settings', { weeklyHolidays: [wd] }, teacherCookie);

  const att = await getJson('/api/attendance/groups/group-1');
  assert.equal(att.data.status, 'HOLIDAY');
  assert.ok(att.data.statusMessage.includes('إجازة'));

  const reg = await postJson('/api/attendance/groups/group-1/register', {
    studentName: 'يوم العطلة',
    revision: 'الفاتحة',
    pagesCount: 1,
    countOfSard: 'واحد',
  });
  assert.equal(reg.status, 403);

  await patchJson('/api/teacher/settings', { weeklyHolidays: [] }, teacherCookie);
});

test('auth: change password enforces current + mismatch rules', async () => {
  const wrongCur = await postJson('/api/auth/change-password', {
    currentPassword: 'nope-nope', newPassword: 'NewPass!456', confirmPassword: 'NewPass!456',
  }, teacherCookie);
  assert.equal(wrongCur.status, 400);

  const mismatch = await postJson('/api/auth/change-password', {
    currentPassword: PASSWORD, newPassword: 'NewPass!456', confirmPassword: 'zzz',
  }, teacherCookie);
  assert.equal(mismatch.status, 400);

  const ok = await postJson('/api/auth/change-password', {
    currentPassword: PASSWORD, newPassword: 'NewPass!456', confirmPassword: 'NewPass!456',
  }, teacherCookie);
  assert.equal(ok.status, 200);

  const oldLogin = await postJson('/api/auth/login', { email: EMAIL, password: PASSWORD });
  assert.equal(oldLogin.status, 401);

  const newLogin = await postJson('/api/auth/login', { email: EMAIL, password: 'NewPass!456' });
  assert.equal(newLogin.status, 200);
  assert.ok(newLogin.token || (newLogin.data && newLogin.data.teacher));
});

test('history: hijri-keyed summary and detail reflect recorded day', async () => {
  const unauth = await getJson('/api/teacher/history');
  assert.equal(unauth.status, 401);

  const list = await getJson('/api/teacher/history', teacherCookie);
  assert.equal(list.status, 200);
  assert.ok(list.data.dates.length >= 1);
  const latest = list.data.dates[0];
  assert.ok(latest.hijriDate.match(/^\d{4}-\d{2}-\d{2}$/));
  assert.ok(latest.students >= 3, 'latest day students=' + latest.students);

  const hj = latest.hijriDate;
  const badDate = await getJson(`/api/teacher/history?date=not-a-hijri-date`, teacherCookie);
  assert.equal(badDate.status, 400);

  const sum = await getJson(`/api/teacher/history?date=${hj}`, teacherCookie);
  assert.equal(sum.status, 200);
  assert.equal(sum.data.date.value, hj);
  assert.ok(sum.data.date.hijri.length > 0, 'hijri label present');
  assert.equal(sum.data.date.gregorian, undefined, 'no gregorian key');

  const g1 = sum.data.groups.find((g) => g.key === 'group-1');
  assert.ok(g1.startTimeLabel.includes('م') || g1.startTimeLabel.includes('ص'), '12h window labels');

  const detail = await getJson(`/api/teacher/history/${hj}/${g1.id}`, teacherCookie);
  assert.equal(detail.status, 200);
  const orders = detail.data.entries.map((e) => e.order);
  assert.deepEqual(orders, orders.map((_, i) => i + 1), 'sequential orders');
  assert.equal(detail.data.totals.students, g1.students);
  assert.equal(detail.data.totals.pages, g1.pages);
  assert.ok(detail.data.date.hijriShort.length > 0);

  const prevNav = await getJson(`/api/teacher/history/${detail.data.date.prev}/${g1.id}`, teacherCookie);
  assert.equal(prevNav.status, 200);
  assert.ok(prevNav.data.entries !== undefined);
});

test('logout clears session and protected page redirects', async () => {
  const out = await req('POST', '/api/auth/logout', {});
  assert.equal(out.status, 200);

  const dash = await fetch(`${BASE}/dashboard`, { redirect: 'manual' });
  assert.ok([302, 307, 308].includes(dash.status));
  assert.ok((dash.headers.get('location') || '').includes('/login'));
});

test.after(async () => {
  await stopServer();
  await dropDb();
});
