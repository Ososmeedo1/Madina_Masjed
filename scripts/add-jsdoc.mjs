import fs from 'fs';

const targets = [
  ['lib/db/mongoose.js', 'async function dbConnect()', `/**\n * Connect to MongoDB using a cached global connection (safe across hot reloads and serverless invocations).\n * @returns {Promise<typeof mongoose>} The connected mongoose instance.\n * @throws {Error} If MONGODB_URI is missing or the driver cannot connect within 5s.\n */`],
  ['lib/utils/auth.js', 'export function signAuthToken(', `/**\n * Create an HS256 JWT for a teacher session.\n * @param {{sub: string, email: string, role: string}} payload\n * @returns {string} Signed token valid for TOKEN_MAX_AGE seconds.\n */`],
  ['lib/utils/auth.js', 'export function verifyAuthToken(token) {', `/**\n * Verify and decode a session JWT.\n * @param {string} token\n * @returns {object|null} Decoded payload, or null when invalid/expired.\n */`],
  ['lib/utils/auth.js', 'export function getAuthFromRequest(request) {', `/**\n * Read + verify the auth cookie from a Next.js Request/NextRequest.\n * @param {Request} request\n * @returns {object|null} JWT payload or null.\n */`],
  ['lib/utils/auth.js', 'export async function getSessionPayload() {', `/**\n * Session helper for server components (uses next/headers cookies).\n * @returns {Promise<object|null>}\n */`],
  ['lib/utils/auth.js', 'export function hashPassword(plain) {', `/**\n * Hash a plaintext password with bcrypt (10 rounds).\n * @param {string} plain\n * @returns {Promise<string>} bcrypt digest.\n */`],
  ['lib/utils/auth.js', 'export function verifyPassword(plain, hash) {', `/**\n * Constant-time-ish bcrypt comparison of a plaintext against a stored hash.\n * @param {string} plain\n * @param {string} hash\n * @returns {Promise<boolean>}\n */`],
  ['lib/utils/edit-token.js', 'export function generateEditToken() {', `/**\n * Generate a 256-bit URL-safe random edit token (shown to the student once).\n * @returns {string} 43-char base64url token.\n */`],
  ['lib/utils/edit-token.js', 'export function hashEditToken(token) {', `/**\n * SHA-256 hex digest of a raw edit token — this is what gets persisted.\n * @param {string} token Raw token.\n * @returns {string} 64-char hex digest.\n */`],
  ['lib/utils/edit-token.js', 'export function verifyEditToken(token, storedHash) {', `/**\n * Timing-safe comparison of sha256(rawToken) against the stored digest.\n * @param {string} token Raw token provided by the student.\n * @param {string} storedHash Digest from the database.\n * @returns {boolean}\n */`],
  ['lib/utils/edit-token.js', 'export function isTokenExpired(createdAt) {', `/**\n * True when the record is older than the 30-day token lifetime.\n * @param {Date|string|number} createdAt Record creation timestamp.\n * @returns {boolean}\n */`],
  ['lib/utils/rate-limit.js', 'export async function isRateLimited(key,', `/**\n * Check whether a bucket has reached its failure threshold.\n * Backed by the Mongo rate_limits collection so limits hold across serverless instances.\n * @param {string} key Bucket key (e.g. "login:<ip>").\n * @param {{max?: number}} [opts]\n * @returns {Promise<boolean>} true when the action should be blocked.\n */`],
  ['lib/utils/rate-limit.js', 'export async function recordFailure(key,', `/**\n * Increment the failure counter for a key, starting a new window when needed.\n * @param {string} key\n * @param {{windowMs?: number}} [opts]\n * @returns {Promise<void>}\n */`],
  ['lib/utils/rate-limit.js', 'export async function clearFailures(key) {', `/**\n * Reset a bucket after a successful authenticated action.\n * @param {string} key\n * @returns {Promise<void>}\n */`],
  ['lib/utils/sanitize.js', 'export function sanitizeText(value, max = 200) {', `/**\n * Strip control characters, trim, collapse inner whitespace, clamp length.\n * @param {unknown} value Expected string.\n * @param {number} [max=200] Maximum output length.\n * @returns {string} Sanitized text ('' for non-string input).\n */`],
  ['lib/utils/error-codes.js', 'export function errorByCode(code) {', `/**\n * Arabic message for a machine error code (falls back to INTERNAL_ERROR).\n * @param {string} code\n * @returns {string}\n */`],
  ['lib/utils/messages-ar.js', 'export function apiErrorAr(data, status, fallback) {', `/**\n * Choose the best Arabic error text for a failed API response:\n * server message → caller fallback → status-code mapping → generic default.\n * @param {{message?: string}|null} data Parsed JSON body (may be null).\n * @param {number} status HTTP status code.\n * @param {string} [fallback] Optional caller-provided default.\n * @returns {string}\n */`],
  ['lib/utils/timezone.js', 'export function getRiyadhDate(date = new Date()) {', `/**\n * Convert any instant to the UTC instant of Riyadh midnight for that day.\n * Stored as attendanceDate so day equality is exact.\n * @param {Date} [date]\n * @returns {Date}\n */`],
  ['lib/utils/timezone.js', 'export function dayBoundsUtc(dateStr) {', `/**\n * UTC start/end instants covering one full Riyadh day.\n * @param {string} dateStr 'YYYY-MM-DD'\n * @returns {{start: Date, end: Date}}\n */`],
  ['lib/utils/timezone.js', 'export function isAttendanceOpen(group, date = new Date()) {', `/**\n * True when current Riyadh time is within [startTime, endTime) of the group.\n * @param {{startTime: string, endTime: string}} group\n * @param {Date} [date]\n * @returns {boolean}\n */`],
  ['lib/utils/timezone.js', 'export function formatTimeAr(date = new Date()) {', `/**\n * Format as Arabic 12-hour time in Riyadh, e.g. "٤:٣٧ م".\n * @param {Date} [date]\n * @returns {string}\n */`],
  ['lib/utils/timezone.js', 'export function formatGregorianAr(dateInput) {', `/**\n * Long Arabic gregorian format with weekday, e.g. "الثلاثاء، ٢٥ أغسطس ٢٠٢٦".\n * @param {string|Date} dateInput 'YYYY-MM-DD' or Date.\n * @returns {string}\n */`],
  ['lib/services/groups.service.js', 'export async function ensureDefaultGroups() {', `/**\n * Idempotently seed group-1/group-2 (المجموعة الأولى/الثانية، 16:00–17:00) when none exist.\n * Called on first-run setup and before every dashboard/groups read.\n * @returns {Promise<void>}\n */`],
  ['lib/services/groups.service.js', 'export async function isHolidayOn(dateStr, settings) {', `/**\n * Weekly (Settings.weeklyHolidays) OR exceptional (Holiday collection) check for a Riyadh date.\n * @param {string} dateStr 'YYYY-MM-DD'\n * @param {any} [settings] Pre-loaded settings document.\n * @returns {Promise<boolean>}\n */`],
  ['lib/services/groups.service.js', 'export async function getDashboardSnapshot() {', `/**\n * Everything the dashboard needs: today meta (incl. Hijri/gregorian), per-group\n * status labels, studentsToday/pagesToday aggregates, and grand totals.\n * @returns {Promise<object>} Snapshot consumed by DashboardClient & GET /api/teacher/groups.\n */`],
  ['lib/services/groups.service.js', 'export async function updateGroup(groupId, payload = {}) {', `/**\n * Validate + update name/times for one of the two fixed groups.\n * Rejects invalid ranges and overlaps with the sibling group (Arabic errors, .status set).\n * @param {string} groupId Mongo _id.\n * @param {{name?: string, startTime?: string, endTime?: string}} payload\n * @returns {Promise<any>} Updated Group document.\n * @throws {Error} With .status 400/404 on validation failures.\n */`],
  ['lib/services/history.service.js', 'export async function getDateSummary(dateStr) {', `/**\n * Per-group student/page totals for one Riyadh day plus formatted date metadata.\n * @param {string} dateStr 'YYYY-MM-DD'.\n * @returns {Promise<{date: object, groups: object[], totals: {students: number, pages: number}}>}\n */`],
  ['lib/services/history.service.js', 'export async function getAvailableDates(limit = LIMIT_DATES) {', `/**\n * Most recent days that contain at least one attendance record, newest first.\n * @param {number} [limit=90]\n * @returns {Promise<Array<{date: string, students: number, pages: number}>>}\n */`],
  ['lib/services/history.service.js', 'export async function getGroupDayDetail(dateStr, groupId) {', `/**\n * Full entry list for one group/day (order asc) with totals and prev/next navigation dates.\n * @param {string} dateStr\n * @param {string} groupId Mongo _id of the group.\n * @throws {Error} .status 400/404 with Arabic message.\n */`],
  ['lib/services/holidays.service.js', 'export async function createExceptional({ date, reason }, teacherId) {', `/**\n * Add a single-day exceptional holiday. Duplicate same-date entries are rejected (409).\n * @param {{date: string, reason?: string}} input\n * @param {string|null} teacherId Creator id.\n * @returns {Promise<any>} Created Holiday document.\n */`],
  ['lib/services/holidays.service.js', 'export async function deleteExceptional(id) {', `/**\n * Delete an exceptional holiday by id; throws 404 when absent or not exceptional-typed.\n * @param {string} id\n * @returns {Promise<void>}\n */`],
  ['lib/services/teacher.service.js', 'export async function createFirstTeacher(input) {', `/**\n * First-run bootstrap: create admin teacher (409 if any teacher exists),\n * ensure Settings singleton exists and seed the two default groups.\n * @param {{email: string, password: string}} input\n * @returns {Promise<any>} Created Teacher document.\n */`],
];

let inserted = 0;
let skipped = [];

for (const [file, signature, doc] of targets) {
  let t = fs.readFileSync(file, 'utf8');
  const idx = t.indexOf(signature);
  if (idx === -1) {
    skipped.push(`${file} :: ${signature}`);
    continue;
  }
  const before = t.slice(Math.max(0, idx - 3), idx);
  if (before.includes('*/')) {
    skipped.push(`${file} :: ${signature} (already documented)`);
    continue;
  }
  t = t.slice(0, idx) + doc + '\n' + t.slice(idx);
  fs.writeFileSync(file, t, 'utf8');
  inserted += 1;
}

console.log(`JSDoc inserted: ${inserted}, skipped: ${skipped.length}`);
for (const s of skipped) console.log('  SKIP:', s);
