# Project Summary — نظام متابعة الحفظ

Attendance & memorization-tracking system for a Quran study circle (حلقة تحفيظ) at a mosque in Medina. Students self-register during their group's window; the teacher monitors live stats, browses history, manages weekly holidays and teacher absence, and reviews Hijri-keyed history.

**Status:** v1.0.0 — production-ready, deployed target Vercel Free + MongoDB Atlas M0.

## Features implemented

### Students (public)
- Self-registration form: name / revision (surah) / pages count / sard count
- Live Medina clock; status banner: لم يبدأ · التسجيل مفتوح · انتهى وقت التسجيل · اليوم إجازة
- Sequential daily order number per group (race-safe under concurrency)
- One-time edit token (SHA-256 stored); edit page with prefilled form
- Duplicate-name guard (whitespace-normalized) with edit-link fallback
- Auto-refreshing list (10s), new-entry highlight animation, auto-scroll to own record
- Weekly holiday + one-click teacher-absence blocking

### Teacher (session-protected)
- First-run setup wizard (creates account, Settings singleton, both groups)
- Login / logout / change-password with Arabic validation
- Live dashboard: Medina clock, Hijri+Gregorian dates, per-group status badges, today's totals, 15s polling, copy-one/copy-all attendance links
- Group management: rename + time windows with overlap & range validation
- History browser: date navigation, day summary, per-group drill-down, weekly aggregation table
- Weekly summary table (Saturday-anchored weeks, per-day counts)
- Teacher absence toggle (auto-expires at Riyadh midnight)
- Settings: account info, password change, logout

### Platform
- Hijri-only calendar (Umm al-Qura via moment-hijri), 12-hour Arabic times everywhere, Arabic-first RTL UI, dark/light theme (persisted + system-aware), Islamic design tokens from DESIGN.md (Amiri/Noto Sans Arabic/Plus Jakarta Sans, green-gold palette, khatim pattern)
- WCAG-minded: skip link, focus-visible rings, aria-live regions, semantic landmarks, 44px touch targets
- Edge middleware auth + CSRF origin enforcement; Mongo-backed rate limiting; security headers
- Health endpoint `/api/health`; structured logger (prod: errors only)

## Technical decisions (short)

| Decision | Why |
|---|---|
| JWT httpOnly cookie (jose on edge + jsonwebtoken in Node) | Stateless auth on serverless Free tier |
| Riyadh-midnight UTC instants for "day" | Indexed equality for duplicates/aggregates, no string drift |
| Fixed two groups (`group-1|2`) | Matches operation; enum + unique index enforce it |
| Unique `{groupId,date,order}` + retry on E11000 | Race-safe sequential ordering without locks |
| Capability tokens for edits | No student accounts needed; hash-only storage; timing-safe compare |
| Polling not WebSockets | Free-tier constraint; visibility-gated to save quota |
| Mongo rate-limit buckets | Correct across isolates where memory maps fail |

Full rationale: [technical/ARCHITECTURE.md](./technical/ARCHITECTURE.md)

## Test coverage

| Suite | Count | Scope |
|---|---|---|
| Unit (`npm test`) | 38 | timezone math incl. DST-stability, status windows, overlap rules, validators, token lifecycle, error-message precedence |
| Integration (`npm run test:e2e`) | 17 | boots real prod build + DB; walks setup→auth→groups→registration (happy/invalid/dup/burst)→edit-token→holidays→history→logout |

## Known limitations

1. **Two-group ceiling is structural** (enum + seed). Supporting N groups needs schema/migration work.
2. **No self-service password recovery.** Forgotten passwords require DB intervention.
3. **Edit token shown once.** Lost token = teacher must delete/recreate the entry.
4. **Student identity = typed name.** Homonyms need disambiguation (e.g., father's name); no roster linkage yet.
5. **History limited to 90 listed days / 500 entries per day view** (aggregation caps; data itself retained).
6. **No automatic backups on M0 Atlas** — schedule manual `mongodump` or upgrade tier.

## Future improvements

- Attendance edit/delete UI using the stored token (API already supports PATCH)
- Roster mode: pre-registered students linked by ID instead of free-text names
- Memorization progress tracking (surah/ayah bookmarks per student)
- WhatsApp integration for daily summaries to parents
- Monthly/semester PDF reports with charts
- Multi-teacher support with per-group assignment and roles
- PWA manifest + offline queue for flaky mosque Wi-Fi
- i18n layer extraction if English UI is ever required
