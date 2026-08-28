# Deployment Checklist — قائمة التحقق قبل التشغيل

Use this every time the system goes live (first deploy or major update).

## 1. Environment / البيئة

- [ ] `MONGODB_URI` set in Vercel (Atlas SRV string ending with `/masjed`)
- [ ] Atlas network access allows `0.0.0.0/0`
- [ ] Atlas database user exists with read/write on `masjed`
- [ ] `JWT_SECRET` set (long random — regenerate if this is a fresh install)
- [ ] `.env.local` **not** committed; only in local dev

## 2. Build & Tests

- [ ] `npm test` → 38/38 pass
- [ ] `npm run build` → completes without errors
- [ ] `npm run test:e2e` → 17/17 pass (local Mongo running)

## 3. First-run flow

- [ ] Open site root → redirects to `/teacher/setup`
- [ ] Setup form validates (short password / bad email show Arabic errors)
- [ ] Create account → auto-login → lands on `/dashboard`
- [ ] Re-opening `/teacher/setup` later redirects to `/login`

## 4. Groups

- [ ] Both groups visible: المجموعة الأولى + المجموعة الثانية
- [ ] Set real names and times for the circle schedule
- [ ] Overlapping times are rejected with Arabic message
- [ ] Start-after-end rejected

## 5. Attendance (student path)

- [ ] `/attendance/group-1` loads with clock + status badge
- [ ] Outside window → registration blocked with clear message
- [ ] Inside window → register a test student → success panel shows order number + edit token
- [ ] Copy the token, open the edit link, change pages count → persists after refresh
- [ ] Same name again → "تم تسجيل حضورك مسبقًا" + edit link
- [ ] Duplicate check on `/attendance/group-2` as well

## 6. Holidays

- [ ] Weekly Friday/Saturday toggles save and persist after refresh
- [ ] Mark teacher absence → students see «المعلم غائب اليوم» and cannot register; cancel restores
- [ ] On that date students see «اليوم إجازة» and cannot register *(or verify via API)*
- [ ] Delete holiday works

## 7. History & export

- [ ] `/history` shows today's summary cards + totals
- [ ] Date navigation (prev/next/picker) works
- [ ] Group drill-down lists today's test entries with correct order/time
- [ ] Weekly summary table renders with correct totals

## 8. Security

- [ ] `/dashboard` while logged out → redirected to `/login?next=…`
- [ ] `GET /api/teacher/groups` without cookie → `401`
- [ ] Wrong-token edit attempt → `401` (never leaks hash)
- [ ] Site responses include `X-Frame-Options`, `X-Content-Type-Options` headers

## 9. Monitoring

- [ ] `/api/health` returns `{ status:"ok", db:"up" }`
- [ ] Uptime monitor configured against `/api/health` (optional but recommended)

## 10. Handover

- [ ] Teacher credentials delivered securely (not via public chat)
- [ ] Student links shared/pinned in the class WhatsApp group
- [ ] `docs/user-manual/README-ar.md` shared with the teacher
- [ ] Backup plan noted (monthly mongodump or Atlas upgrade)
