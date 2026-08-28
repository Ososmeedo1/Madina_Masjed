# FAQ — الأسئلة الشائعة

---

## للمستخدم (المعلم والطلاب) — Arabic

### الطالب

**س: نسيت رمز التعديل، كيف أعدّل تسجيلي؟**
ج: لا يمكن استرجاعه لأسباب أمنية. اطلب من المعلم حذف تسجيلك ثم سجّل من جديد.

**س: سجلت بالخطأ مرتين باسمين متشابهين؟**
ج: أخبر المعلم لحذف أحدهما؛ النظام يمنع التكرار بنفس الاسم في نفس اليوم فقط.

**س: ظهر لي "اليوم إجازة"؟**
ج: اليوم ضمن العطلة الأسبوعية أو الاستثنائية. جرّب في يوم الحلقة القادم.

**س: عدد الأوجه كم يكون عادة؟**
ج: بين ١ و ١٠٠٠، حسب ما اتفقت عليه مع شيخك.

### المعلم

**س: كيف أفتح التسجيل الآن فورًا؟**
ج: الإعدادات ← عدّل وقت المجموعة ليشمل الوقت الحالي ← احفظ. التحديث يظهر خلال ثوانٍ.

**س: هل يمكن إضافة مجموعة ثالثة؟**
ج: حاليًا النظام مصمّم لمجموعتين فقط.

**س: كيف أعرف من غاب اليوم؟**
ج: افتح السجل ← اختر التاريخ ← المجموعة؛ القائمة تعرض الحاضرين فقط.


**س: تغيّرت كلمة المرور ولا أستطيع الدخول؟**
ج: تأكد من البريد الصحيح. إن نُسيت نهائيًا يحتاج المسؤول لإعادة التعيين من قاعدة البيانات.

---

## For developers — English

**Q: Why `jose` AND `jsonwebtoken`?**
A: Middleware runs on the Edge runtime where Node crypto isn't available, so JWT verification there uses `jose` (WebCrypto). Route handlers run in Node and use `jsonwebtoken`. Both share the same HS256 secret (`JWT_SECRET`).

**Q: How are "days" stored?**
A: As UTC instants of Riyadh midnight (`YYYY-MM-DDT21:00:00Z`). Day equality becomes a single indexed equality; `lib/utils/timezone.js` converts both ways. No DST in Saudi Arabia, so offsets are fixed.

**Q: Is registration order race-safe?**
A: Yes. `{groupId, attendanceDate, order}` is a unique index. On E11000 conflict the service re-reads max(order) and retries up to 8 times with jitter. Verified with 10 concurrent registrations producing orders 1..10 exactly.

**Q: Can a student forge an edit token?**
A: No. Tokens are 32 random bytes (base64url); only SHA-256 hashes are stored; comparison is timing-safe via `crypto.timingSafeEqual`; tokens expire after 30 days.

**Q: Does rate limiting work on Vercel serverless?**
A: It's stored in MongoDB (`rate_limits` collection), not memory — correct across instances/workers. Login failures: 10 per IP / 15 min. Edit-token failures: 8 per record / 15 min. Setup: 5/hour/IP.

**Q: CSRF protection?**
A: All `/api/*` requests pass through middleware which rejects when `Origin` header host ≠ request host (browsers always send Origin on cross-site POSTs). Cookie `SameSite=Lax` adds a second layer.

**Q: Where are error codes defined?**
A: `lib/utils/error-codes.js` (machine codes + Arabic). Routes attach `code` to JSON errors; clients fall back through `apiErrorAr()` in `lib/utils/messages-ar.js`.

**Q: Why polling instead of WebSockets?**
A: Vercel Free has no persistent connections. Polling (10s students / 15s dashboard) pauses on hidden tabs and stops entirely once registration closes.

**Q: How do I reset a local database?**
A:
```bash
node -e "import('mongoose').then(async m=>{await m.default.connect('mongodb://127.0.0.1:27017/masjed');await m.default.connection.dropDatabase();console.log('dropped');process.exit(0)})"
```

**Q: Which indexes exist on attendance?**
A: Unique `{groupId, attendanceDate, studentName}` (duplicate guard), unique `{groupId, attendanceDate, order}` (order race-safety), plus `{attendanceDate:1}` for history queries/aggregations.
