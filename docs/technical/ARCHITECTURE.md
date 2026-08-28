# Architecture

## Overview

A single Next.js 14 App Router application serving:

- **Student-facing pages** (public): self-service attendance registration + token-based edit.
- **Teacher dashboard** (session-protected): live monitoring, groups, history, holidays, settings.
- **JSON API** under `app/api/**` consumed by those pages via polling.

Persistence is MongoDB (Atlas in production, local in dev). All date logic is normalized to the **Asia/Riyadh** timezone; a "day" is stored as the UTC instant of Riyadh midnight (`YYYY-MM-DDT21:00:00Z` for Riyadh `YYYY-MM-DD+03:00`), which makes day equality a single indexed equality check.

```
┌──────────────┐        ┌─────────────────────────────┐
│   Browser    │ HTTP   │ Next.js Server (Vercel)     │
│  Students    ├───────►│  ┌───────────────────────┐  │      ┌──────────────┐
│  /attendance │        │  │ Route Handlers        │──┼────► │   MongoDB    │
└──────────────┘        │  │ /api/attendance/* pub │  │      │  Atlas M0    │
                        │  └───────────────────────┘  │      └──────────────┘
┌──────────────┐        │  ┌───────────────────────┐  │
│   Teacher    ├───────►│  │ middleware.js (edge)  │  │
│  /dashboard  │ cookie │  │  CSRF origin check    │  │
└──────────────┘        │  │  JWT verify (jose)    │  │
                        │  └───────────────────────┘  │
                        │  pages: SSR (force-dynamic) │
                        └─────────────────────────────┘
```

## Folder structure

| Path | Responsibility |
|---|---|
| `app/` | Pages + API route handlers (App Router). `force-dynamic` on all data pages. |
| `app/api/setup` | First-run bootstrap (teacher account + Settings + default groups). |
| `app/api/auth/*` | login / logout / me / change-password. |
| `app/api/attendance/groups/[groupKey]` | Public GET snapshot + POST register. |
| `app/api/attendance/[attendanceId]` | GET/PATCH one record guarded by edit-token. |
| `app/api/teacher/*` | Session-guarded teacher APIs (also gated again inside handlers). |
| `components/` | Client UI split by domain: attendance, dashboard, history, holidays, settings, ui, layout. |
| `lib/db/mongoose.js` | Cached mongoose connection (global singleton). |
| `lib/models/` | Teacher, Group, Attendance, Holiday, Settings schemas + indexes. |
| `lib/services/` | Business logic: groups, attendance, history, holidays, teacher, settings helpers. No HTTP types — reusable from pages and routes. |
| `lib/utils/` | Pure helpers: timezone, group-status, validation, sanitize, edit-token, rate-limit, error-codes, messages-ar, fetcher, logger, auth. |
| `middleware.js` | Edge middleware: page auth redirects + API auth gate + CSRF origin check. |
| `tests/unit`, `tests/integration` | node:test suites. |

## Data flow

### Registration (write path)

```
POST /api/attendance/groups/:groupKey/register
  → group lookup by key                (404 if missing)
  → isHolidayOn(dateStr)               weekly (Settings) OR exceptional (Holiday)
  → statusForGroup(now vs window)      NOT_STARTED / CLOSED rejected with Arabic message
  → validateRegistrationInput          per-field Arabic errors
  → normalize name (spaces collapse) → duplicate exists()? → 409 + attendanceId
  → order = max(order)+1               unique index {groupId,date,order}
                                       E11000 race ⇒ jittered retry ×8
  → create record (editTokenHash = sha256(token))
  → 201 { entry, editToken }           raw token shown once
```

### Read path (polling)

```
GET /api/attendance/groups/:groupKey
  → getAttendancePageData: group + holiday flag + status + entries(sorted order asc, 200 max)
Client polls every 10s while OPEN & tab visible; new _ids get .animate-row-new.
```

### Teacher snapshot

```
getDashboardSnapshot()  (called directly by the dashboard server component,
                         re-exposed at GET /api/teacher/groups for polling)
  ensureDefaultGroups → Settings.getSingleton → isHolidayOn(today)
  aggregate attendance for today: { students:$sum:1, pages:$sum:'$pagesCount' }
  map onto both groups + compute status + totals
```

## Technology stack

| Layer | Choice | Version |
|---|---|---|
| Framework | Next.js (App Router) | 14.2.x |
| Runtime | Node.js | ≥ 18.17 (built/tested on 24) |
| DB | MongoDB + Mongoose | Atlas M0 / mongoose 8.x |
| Styling | Tailwind CSS + forms + typography plugins | 3.4.x |
| Auth tokens | jsonwebtoken (Node routes) + jose (Edge middleware) | 9.x / 5.x |
| Password hashing | bcryptjs | 2.4.x |
| Timezone | date-fns + date-fns-tz | 2.30.x / 2.0.x |
| Tests | node:test (built-in runner) | Node built-in |

## Key design decisions

1. **JWT in httpOnly cookie instead of sessions table.** Stateless, works on Vercel Free serverless with zero extra infra. Verified on both runtimes: `jsonwebtoken` in Node routes, `jose` (WebCrypto) in Edge middleware — same HS256 secret.
2. **Riyadh-midnight instants as "date".** Avoids string/date mismatch bugs; `attendanceDate` equality + compound indexes give O(1) duplicate checks and fast aggregates.
3. **Exactly two fixed groups** (`key` enum `group-1|group-2`) seeded idempotently. Matches the mosque's real operation and simplifies validation/UX.
4. **Self-registration by name, not roster accounts.** Zero student onboarding friction; duplicates blocked by normalized-name unique index; edits authorized by a capability token (random 256-bit, only hash stored).
5. **Order via `max+1` + unique index retry.** The `{groupId,attendanceDate,order}` unique index converts races into deterministic E11000 errors; 8 retries with jitter make bursts converge (verified 10/10 concurrent).
6. **Polling over WebSockets.** Vercel Free has no persistent sockets; 10–15s polling with Page-Visibility gating is cheap and sufficient.
7. **Mongo-backed rate limiting.** In-memory maps split across serverless isolates/workers undercount; a tiny `rate_limits` collection gives correct global windows.
8. **Pure util layer (`lib/utils/group-status.js`, `timezone.js`).** Status/time rules have zero I/O so they run identically on server and client and are trivially unit-testable.
9. **Machine error codes + Arabic messages together.** Responses carry `code` (stable contract) *and* human Arabic `message`; clients fall back through `apiErrorAr`.
11. **Hijri-only display layer.** All user-facing dates render through lib/utils/hijri-date.js (Umm al-Qura via moment-hijri); Gregorian remains an internal storage/comparison detail only. Times render exclusively as 12-hour Arabic (ص/م).\n10. **CSS-variable theming.** Light/dark flip by swapping ~20 RGB-channel variables under `.dark`; every existing utility (`bg-surface-container-low`, chips, shadows) adapts without component changes.
