# Development Guide

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | ≥ 18.17 (24 recommended) | LTS fine |
| MongoDB | 6/7 local **or** Atlas cluster | Local default URI: `mongodb://127.0.0.1:27017/masjed` |
| npm | 9+ | Ships with Node |
| Git | any | |

No other services required. Vercel CLI optional (`npm i -g vercel`).

## Local setup (step by step)

```bash
# 1. install dependencies
npm install

# 2. configure environment
cp .env.example .env.local
#   edit .env.local:
#   MONGODB_URI=mongodb://127.0.0.1:27017/masjed
#   JWT_SECRET=<long random string>
#   generate one:
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"

# 3. start MongoDB locally (if not running as a service)
mongod --dbpath .\data

# 4. run dev server
npm run dev
# open http://localhost:3000 → first run redirects to /teacher/setup
```

## Environment variables

| Var | Required | Default (dev) | Description |
|---|---|---|---|
| `MONGODB_URI` | yes | — | Connection string; database name is the last path segment |
| `JWT_SECRET` | no (dev) | dev fallback | **Set a real secret in production**; used by both `jsonwebtoken` (routes) and `jose` (middleware) |

`.env.local` is git-ignored. `.env.example` documents every variable.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload (http://localhost:3000) |
| `npm run build` | Production build to `.next/` |
| `npm start` | Serve the production build |
| `npm test` | Unit tests (~1s, no DB needed) |
| `npm run test:e2e` | Integration suite — boots real server on port 3100 against your Mongo, drops `masjed` DB before & after |
| `npm run lint` | ESLint (next/core-web-vitals) |

## Test suite layout

```
tests/unit/*.test.mjs        # pure logic: timezone, status rules, validation,
                             # tokens, error messages  → node:test
tests/integration/api.test.mjs
                             # spawns production server on :3100, drops DB,
                             # walks every critical flow via HTTP
```

Integration notes:
- Self-contained: starts/stops its own server, cleans DB in `after`.
- Requires free port 3100 and reachable Mongo.
- Deliberately tolerant of clock position (windows are computed from `serverTime`), but **not** of an unavailable database.

## Common development tasks

**Add/modify an API**
1. Handler in `app/api/<path>/route.js`.
2. Business logic in the matching `lib/services/*` module (keep handlers thin).
3. Validation helpers in `lib/utils/validation.js`; user-facing strings in Arabic.
4. Extend `docs/technical/API.md`.

**Change attendance fields or limits**
- `lib/models/Attendance.js` (schema limits)
- `lib/utils/validation.js` (`validateRegistrationInput`, `validateListenerInput`, `validateAbsenceInput`, field validators)
- `components/attendance/AttendanceClient.jsx` (`maxLength` attributes)
Keep all three in sync.

**Attendance statuses:** `present` (حضور — requires revision, pagesCount, countOfSard; gets order), `listener` (مستمع — name only; order=null), `absent` (غياب — name + optional reason; order=null).

**Device restriction:** `att_tokens` cookie (httpOnly, secure, SameSite=strict, 30-day) stores `{ groupKey: editToken }` JSON. Set on registration, read by GET `/api/attendance/groups/:groupKey/current`. Client checks on mount to auto-detect existing record.

**Status conversion (edit page):** The edit page uses a two-step flow. Clicking a conversion button updates `form.status` and clears non-applicable fields; the form then conditionally renders inputs for the new status (revision/pagesCount/countOfSard for present, reason for absent, nothing for listener). The user fills in required fields and clicks the save button. The PATCH endpoint uses `validateEditFields(body, targetStatus)` to validate only fields relevant to the target status.

**Change time/status rules**
- Only `lib/utils/group-status.js` (pure) + tests in `tests/unit/group-status.test.mjs`.

**Reset local data**

```bash
node -e "import('mongoose').then(async m=>{await m.default.connect(process.env.MONGODB_URI||'mongodb://127.0.0.1:27017/masjed');await m.default.connection.dropDatabase();console.log('dropped');process.exit(0)})"
```

## Code style & conventions

- **ES modules**, App Router server components by default; `'use client'` only where state/effects are required.
- Path alias `@/*` → project root.
- **No code comments** unless documenting *why*; JSDoc on exported utils/services.
- Arabic is the product language: all user-visible strings, validation errors, and API `message` fields are Arabic. Machine codes are English (`lib/utils/error-codes.js`).
- Services never import Next types; they throw `Error` with `.status` (+optional `.errors` / `.code`) that routes translate into JSON.
- Pure logic belongs in `lib/utils/*` so it can be unit-tested without mocks (see `group-status.js`, `timezone.js`).
- File naming: pages `page.js`, client helpers `*.jsx` next to their domain folder under `components/`.
