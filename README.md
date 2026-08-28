# نظام متابعة الحفظ — مسجد بالمدينة المنورة

نظام حضور ومتابعة لحلقات تحفيظ القرآن الكريم: يسجّل الطلاب حضورهم بأنفسهم خلال وقت الحلقة، ويتابع المعلم الإحصاءات والسجل والعطل.

**المكدس التقني:** Next.js 14 (App Router) · MongoDB + Mongoose · Tailwind CSS 3 (RTL كامل) · JWT في Cookie ‏httpOnly · نشر على Vercel Free

---

## المزايا

- **تسجيل ذاتي للطلاب**: نموذج عربي بسيط (الاسم/المراجعة/عدد الأوجه/عدد السرد) مع رقم دور تلقائي
- **بوابات زمنية**: لا تسجيل قبل/بعد وقت الحلقة، وتوقيت Asia/Riyadh في كل مكان
- **العطلات**: أسبوعية (الجمعة/السبت افتراضيًا) + استثنائية بتاريخ وسبب
- **تعديل آمن**: رمز عشوائي يُعرض مرة واحدة عند التسجيل (يُخزّن مُعمّى SHA-256) وصلاحية ٣٠ يومًا
- **لوحة المعلم**: ساعة حية، حالة كل مجموعة، إحصاءات فورية، سجل بأي تاريخ
- **وضع ليلي** محفوظ في المتصفح + تصميم إسلامي (خطوط أميري/نوتو سانس العربية)
- **التقويم الهجري فقط** (أم القرى) في كل التواريخ المعروضة + أوقات ١٢ ساعة بصيغة ص/م
- **تحديث تلقائي** بالـ Polling (١٠ ثوانٍ للطلاب، ١٥ للمعلم)

## التشغيل المحلي

```bash
git clone <repo> && cd masjed
npm install

# انسخ البيئة وعدّلها
cp .env.example .env.local
#   MONGODB_URI=mongodb://127.0.0.1:27017/masjed
#   JWT_SECRET=<نص عشوائي طويل>

npm run dev          # http://localhost:3000
```

أول زيارة ستوجهك إلى `/teacher/setup` لإنشاء حساب المعلم والمجموعتين الافتراضيتين.

## الاختبارات

```bash
npm test         # اختبارات الوحدة — 38 اختبارًا، بدون قاعدة بيانات
npm run test:e2e # تكامل شامل — 17 اختبارًا (يشغّل خادمًا حقيقيًا على المنفذ 3100)
```

متطلب التكامل: MongoDB يعمل محليًا على `27017` (يُفرَّغ تلقائيًا قبل وبعد).

## متغيرات البيئة

| المتغير | إلزامي | الوصف |
|---|---|---|
| `MONGODB_URI` | نعم | رابط الاتصال (Atlas للإنتاج) |
| `JWT_SECRET` | نعم | مفتاح توقيع الجلسات — `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |

## النشر على Vercel Free

الدليل الكامل في [DEPLOYMENT.md](./DEPLOYMENT.md). باختصار:

```bash
npm i -g vercel && vercel login && vercel link
vercel env add MONGODB_URI production
vercel env add JWT_SECRET production
vercel --prod
```

`vercel.json` يضبط المنطقة `fra1` (الأقرب للسعودية في الخطة المجانية) ومدة الدوال ١٠ ثوانٍ.

## بنية المشروع

```
app/                 الصفحات + API Routes
  api/attendance/*   تسجيل وقائمة الحضور (عام)
  api/auth/*         دخول/خروج/جلسة/كلمة المرور
  api/setup          تهيئة أول تشغيل
  api/teacher/*      محمي: المجموعات/السجل/العطلات/الإعدادات
components/          مكوّنات الواجهة (ui/layout/dashboard/attendance/settings/history/holidays)
lib/db               اتصال Mongoose
lib/models           Teacher, Group, Attendance, Holiday, Settings
lib/services         منطق الأعمال (مجموعات/حضور/عطلات/معلم)
lib/utils            توقيت الرياض، حالات المجموعة، تحقق، توكنات، حدود معدل، رسائل
middleware.js        حماية الصفحات و /api/teacher + فحص CORS/Origin
tests/unit           38 اختبار وحدة
tests/integration    17 اختبار تكامل شامل
```

## الأمان

- جلسات JWT داخل Cookie ‏`httpOnly + SameSite=Lax + Secure`(إنتاج)
- حماية CSRF: فحص تطابق Origin/Host لكل طلبات `/api`
- حدّ لمحاولات الدخول الفاشلة (10/15 دقيقة) وتعديل الحضور (8/15 دقيقة) — مخزّنة في MongoDB لتعمل مع خوادم متعددة
- كلمات المرور bcrypt (10 دورات)، ورموز التعديل `crypto.randomBytes(32)` ولا تُخزّن إلا مُعمّاة
- ترويسات أمان: X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy

## استكشاف الأخطاء

| المشكلة | الحل |
|---|---|
| صفحة «تعذر الاتصال بقاعدة البيانات» | MongoDB غير مشغّل أو `MONGODB_URI` خطأ |
| «انتهى وقت التسجيل» | عدّل أوقات المجموعة من الإعدادات لتشمل الوقت الحالي |
| «اليوم إجازة» | أزل اليوم من العطلة الأسبوعية أو العطلات الاستثنائية |
| فشل البناء بخطأ JSON في package.json | أعد حفظ الملف بدون BOM |

## التوثيق / Documentation

| الملف | الوصف |
|---|---|
| [دليل المعلم (عربي)](docs/user-manual/README-ar.md) | شرح خطوة بخطوة لغير التقنيين |
| [Quick Start](docs/training/QUICK-START.md) | بطاقة بدء سريعة |
| [FAQ](docs/training/FAQ.md) | أسئلة شائعة (عربي + إنجليزي) |
| [Architecture](docs/technical/ARCHITECTURE.md) | البنية والقرارات التقنية |
| [API Reference](docs/technical/API.md) | كل نقاط الاتصال مع أمثلة |
| [Development](docs/technical/DEVELOPMENT.md) | الإعداد المحلي والاختبارات |
| [Deployment](docs/technical/DEPLOYMENT.md) | خطوات النشر على Vercel |
| [Maintenance](docs/technical/MAINTENANCE.md) | النسخ الاحتياطي والمراقبة |
| [Project Summary](docs/PROJECT-SUMMARY.md) | الملخص والمحدودية والتطوير المستقبلي |
| [Deployment Checklist](docs/DEPLOYMENT-CHECKLIST.md) | قائمة تحقق قبل التشغيل |
