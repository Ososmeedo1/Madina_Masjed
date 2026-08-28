# API Reference

Base URL: `https://<your-domain>`

All responses are JSON. Arabic `message` is always human-readable; many errors also carry a machine-readable `code` (see [Error codes](#error-codes)).

**Authentication** = JWT in the httpOnly cookie `masjed_token` (set by `/api/setup` and `/api/auth/login`). Teacher APIs under `/api/teacher/*` are additionally enforced by Edge middleware.

---

## Public — Setup & Auth

### POST /api/setup
First-run only. Creates the admin teacher, default Settings and both groups.

```json
{ "email": "sheikh@example.com", "password": "Passw0rd!123", "confirmPassword": "Passw0rd!123" }
```

- `201` → `{ teacher: { _id, email, role } }` + session cookie
- `400` → `{ message, errors: { field: msg } }`
- `409` → already exists

### POST /api/auth/login

```json
{ "email": "sheikh@example.com", "password": "Passw0rd!123" }
```

- `200` → `{ teacher }` + cookie
- `401` → `{ message: "...غير صحيحة", code: "INVALID_CREDENTIALS" }`
- `429` → rate limited (10 failures / 15 min / IP)

### POST /api/auth/logout
Clears the cookie. Always `200`.

### GET /api/auth/me
Requires cookie. `200 { teacher }` or `401`.

### POST /api/auth/change-password
Requires cookie.

```json
{ "currentPassword": "...", "newPassword": "...", "confirmPassword": "..." }
```

- `200 { message: "تم تغيير كلمة المرور بنجاح" }`
- `400` invalid/mismatched (`errors.currentPassword`, `.confirmPassword`, …)

---

## Public — Attendance (students)

### GET /api/attendance/groups/:groupKey
Snapshot used by the student page & polling.

```json
{
  "group": { "key": "group-1", "name": "المجموعة الأولى", "startTime": "16:00", "endTime": "17:00" },
  "today": { "date": "2026-08-25", "hijri": "١٢ ربيع الأول ١٤٤٨ هـ", "isHoliday": false },
  "status": "OPEN",
  "statusMessage": "التسجيل مفتوح",
  "serverTime": "16:20",
  "entries": [
    { "_id": "…", "order": 1, "studentName": "…", "revision": "…",
      "pagesCount": 5, "countOfSard": "خمسة", "registeredAtTime": "٤:١٠ م" }
  ]
}
```

`404` unknown key.

### POST /api/attendance/groups/:groupKey/register

```json
{ "studentName": "محمد أحمد", "revision": "البقرة", "pagesCount": 5, "countOfSard": "خمسة أوجه", "status": "present" }
```

| Status | When | Body extras |
|---|---|---|
| `201` | success | `{ entry, editToken }` — token shown **once**; also set as httpOnly cookie `att_tokens` |
| `200` | converted existing record | same as above with `converted: true` |
| `400` | fields invalid / window not started / closed | `errors` map or plain message |
| `403` | holiday or teacher absent | `{ code: "HOLIDAY" }` or `{ code: "TEACHER_ABSENT" }` |
| `404` | group missing | |
| `409` | duplicate name today | `{ attendanceId, recordStatus }` for edit link |

Server-side checks in order: group exists → teacher absence → weekly holiday → time window → field validation → duplicate name (whitespace-normalized) → insert.

**Cookie:** On success, sets `att_tokens` (httpOnly, secure, SameSite=strict, 30-day) containing `{ groupKey: editToken }` JSON. Used for automatic device recognition.

Order generation: `max(order)+1` per group/day; unique index `{groupId, attendanceDate, order}` + jittered retries handle concurrent bursts.

### GET /api/attendance/groups/:groupKey/current
Checks the `att_tokens` cookie for this group's token. Returns the student's current record for today if valid.

`200 { record: { _id, status, studentName, ... }, group: { key, name } }` or `{ record: null }` if no cookie/token/record found.

### GET /api/attendance/:attendanceId?token=…
Returns one record for editing (token verified against stored hash; expires after 30 days).

`200 { record, group: { name, key } }` · `401` bad/expired token · `404`

### PATCH /api/attendance/:attendanceId
Body: `{ token, status, studentName?, revision?, pagesCount?, countOfSard?, reason? }`.

**Status-aware validation** — required fields depend on the target `status`:

| Target status | Required fields | Optional / ignored |
|---|---|---|
| `present` | `revision`, `pagesCount`, `countOfSard` | `reason` ignored |
| `listener` | (none beyond `token`) | `revision`, `pagesCount`, `countOfSard`, `reason` ignored |
| `absent` | (none beyond `token`) | `reason` optional |

Fields not required for the target status are automatically cleared (set to `null`) on the record.

**Order handling on conversion:**
- To `present`: new `order = max(order)+1` for that group/day.
- From `present` to anything else: `order` set to `null`.

| Status | Meaning |
|---|---|
| `200` | success, returns `{ message, entry, editToken?, converted }` |
| `400` | validation errors (`errors` map) |
| `401` | bad/expired token |
| `429` | rate limited (8 failures / 15 min / IP) |

**Conversion examples:**

Present → Listener:
```json
{ "token": "...", "status": "listener" }
```

Listener → Present:
```json
{ "token": "...", "status": "present", "revision": "يس", "pagesCount": 3, "countOfSard": "ثلاثة" }
```

Any → Absent:
```json
{ "token": "...", "status": "absent", "reason": "سفر" }
```

---

## Teacher — Groups & Dashboard

Auth required (cookie). All these also sit behind middleware on `/api/teacher/*`.

### GET /api/teacher/groups
Dashboard snapshot.

```json
{
  "today": { "date": "2026-08-25", "hijri": "الثلاثاء، ١٢ ربيع الأول ١٤٤٨",
             "weekday": "tuesday", "isHoliday": false },
  "serverTime": "16:22",
  "totals": { "students": 5, "listeners": 1, "absents": 2, "pages": 31 },
  "groups": [
    { "_id": "…", "key": "group-1", "name": "المجموعة الأولى",
      "startTime": "16:00", "endTime": "17:00",
      "status": "OPEN", "statusAr": "مفتوحة الآن",
      "studentsToday": 3, "listenersToday": 1, "absentToday": 1, "pagesToday": 17 }
  ]
}
```

### PATCH /api/teacher/groups/:groupId

```json
{ "name": "مجموعة العصر", "startTime": "16:30", "endTime": "18:00" }
```

| Status | Code | Reason |
|---|---|---|
| `200` | — | updated, returns `{ group }` |
| `400` | `INVALID_INPUT` | name/time format |
| `400` | `INVALID_TIME_RANGE` | start ≥ end |
| `400` | `GROUP_TIME_CONFLICT` | overlaps the other group (message names it) |
| `404` | `GROUP_NOT_FOUND` | |

Touching edges allowed (`17:00` end + `17:00` start = no overlap).

---

## Teacher — History

### GET /api/teacher/history
Without params → `{ dates: [{ date, students, pages }, …] }` (desc, max 90 days).

With `?date=YYYY-MM-DD` →

```json
{
  "date": { "value": "2026-08-25", "hijri": "الثلاثاء، ١٢ ربيع الأول ١٤٤٨", "hijriShort": "١٢ ربيع الأول ١٤٤٨",
            "isHoliday": false,
            "prev": "2026-08-24", "next": "2026-08-26", "isToday": true },
  "groups": [ { "id": "…", "key": "group-1", "name": "…",
                "startTime": "16:00", "endTime": "17:00",
                "startTimeLabel": "٤:٠٠ م", "endTimeLabel": "٥:٠٠ م",
                "students": 3, "pages": 15 } ],
  "totals": { "students": 5, "pages": 28 }
}
```

### GET /api/teacher/history/:date/:groupId
Full day/group detail:

```json
{
  "group": { "id": "…", "key": "group-1", "name": "…", "startTime": "16:00", "endTime": "17:00" },
  "date": { "value": "…", "hijri": "…", "prev": "…", "next": "…" },
  "entries": [ { "order": 1, "studentName": "…", "revision": "…", "pagesCount": 5,
                 "countOfSard": "…", "registeredAtTime": "٤:١٠ م" } ],
  "totals": { "students": 3, "pages": 13 }
}
```

Errors: `400` bad date format, `404` unknown group/id.

---

## Teacher — Settings

### PATCH /api/teacher/settings

```json
{ "weeklyHolidays": ["friday"] }
```

`200 { weeklyHolidays }` · `400` unknown day value.

Allowed values: `saturday, sunday, monday, tuesday, wednesday, thursday, friday`.

---

## Teacher — Absence

### GET /api/teacher/absence
200 { absent: boolean, hijri: "الأربعاء، ١٣ ربيع الأول ١٤٤٨", date: "2026-08-26" }

### POST /api/teacher/absence

```json
{ "action": "mark" }   // or { "action": "cancel" }
```

- 200 { absent, message } — mark is idempotent; record auto-expires at Riyadh midnight.
- While marked, every registration returns 403 { code: "TEACHER_ABSENT",
  message: "المعلم غائب اليوم - لا يوجد تسجيل حضور أو غياب أو استماع" }.

---

## Health

### GET /api/health
Public uptime probe. `200 { status:"ok", db:"up", time, uptime }` or `503 { status:"degraded", db:"down" }`.

---

## Error codes

Machine `code` values returned alongside Arabic `message`:

| Code | Arabic |
|---|---|
| `INVALID_INPUT` | البيانات المدخلة غير صحيحة |
| `REGISTRATION_NOT_STARTED` | لم يبدأ وقت التسجيل بعد |
| `REGISTRATION_CLOSED` | انتهى وقت التسجيل |
| `HOLIDAY` | اليوم إجازة |
| `TEACHER_ABSENT` | المعلم غائب اليوم |
| `ALREADY_REGISTERED` | تم تسجيل حضورك مسبقًا |
| `STATUS_CONFLICT` | سجل بحالة مختلفة موجود مسبقاً |
| `GROUP_NOT_FOUND` | المجموعة غير موجودة |
| `UNAUTHORIZED` | غير مصرح به |
| `INVALID_CREDENTIALS` | البريد الإلكتروني أو كلمة المرور غير صحيحة |
| `INVALID_TIME_RANGE` | وقت البداية يجب أن يكون قبل وقت النهاية |
| `GROUP_TIME_CONFLICT` | تتعارض أوقات المجموعتين |
| `NOT_FOUND` | غير موجود |
| `INTERNAL_ERROR` | حدث خطأ في النظام |
| `RATE_LIMITED` | محاولات كثيرة — انتظر قليلاً |
