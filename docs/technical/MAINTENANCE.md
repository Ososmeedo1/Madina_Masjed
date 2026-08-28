# Maintenance Guide

## MongoDB backup & restore

### Atlas (production)

Automated continuous backups exist even on M0 (6.5h window? — actually M0 has no automatic snapshots; upgrade to M10 for scheduled backups, or export manually).

Manual export with `mongodump` / `mongorestore`:

```bash
# full dump
mongodump --uri "mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/masjed" --out ./backup-$(date +%F)

# restore into a fresh cluster
mongorestore --uri "mongodb+srv://user:pass@new-cluster.mongodb.net/masjed" ./backup-2026-08-25/masjed

# single collection (e.g. only attendance)
mongodump --uri "…" --collection attendances --db masjed -o ./att-backup
```

Recommended cadence: monthly full dump stored outside Atlas + before any manual data surgery.

Collections that matter: `teachers`, `groups`, `attendances`, `settings`, `teacherabsences`. `rate_limits` is disposable.

## Monitoring & logging

- **Health probe**: poll `GET /api/health` every minute (UptimeRobot/BetterStack free tier). `503` = Mongo unreachable.
- **Logs**: Vercel → Project → Deployments → *Runtime Logs*.
  - Format from `lib/utils/logger.js`: `<ISO> | LEVEL | tag | meta`
  - Only ≥500 errors and auth failures are logged in production; expected validation errors stay silent.
- **What to watch**: repeated `teacher.groups` or `attendance.page` ERROR lines = database connectivity; `login` failures spikes = brute-force attempts.

## Common issues

| Symptom | Likely cause | Fix |
|---|---|---|
| `/api/health` returns `db:"down"` | Atlas network access / credentials | Check IP allowlist (`0.0.0.0/0`) and user password |
| Students see "انتهى وقت التسجيل" during class | Group window misconfigured | Dashboard → Settings → fix times |
| "تتعارض أوقات المجموعتين" when saving | Overlap with the other group | Adjust so windows don't intersect |
| Edit token "انتهت صلاحيته" | Record older than 30 days | Re-register (duplicate guard will need name change) or delete record via DB |
| Build fails with JSON/BOM error on package.json | File saved as UTF-8 with BOM by PowerShell | Strip BOM: rewrite file without it |

## Updating dependencies safely

1. Read release notes of the major framework first (`next`, `mongoose`, `tailwindcss`).
2. Update in one group at a time:

```bash
npm outdated
npm install next@latest react@latest react-dom@latest eslint-config-next@latest
npm run build && npm test
```

3. Run the integration suite against a local Mongo — it exercises every critical flow.
4. Deploy to a **preview** URL first (`vercel` without `--prod`), smoke-test, then promote.

Pin ranges currently used: Next `^14.2`, mongoose `^8`, tailwind `^3.4`, jose `^5`, jsonwebtoken `^9`, date-fns `^2.30` (**do not** jump to v3 without migrating `date-fns-tz`), bcryptjs `^2.4`.

## Security best practices

- Rotate `JWT_SECRET` if leakage is suspected (all sessions invalidate immediately).
- Never log passwords/tokens — logger already omits bodies; keep it that way.
- Keep `MONGODB_URI` only in Vercel env vars / `.env.local`; never commit.
- Review `rate_limits` collection growth occasionally (auto-pruned, but can be emptied freely).
- Atlas: enable MFA on the Atlas account; restrict DB user to the `masjed` database only.
- When adding new write endpoints: add origin-check coverage via middleware matcher and a rate-limit bucket for unauthenticated abuse surfaces.
