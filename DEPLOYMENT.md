# النشر على Vercel — دليل سريع

## 1. المتطلبات

- حساب Vercel (خطة Free كافية)
- قاعدة MongoDB Atlas (M0 Free) — الإقامة الأقرب: `Frankfurt (eu-central-1)`
- رابط اتصال بصيغة: `mongodb+srv://user:pass@cluster.xxx.mongodb.net/masjed`

## 2. متغيرات البيئة (Vercel → Settings → Environment Variables)

| المتغير | القيمة | ملاحظة |
|---|---|---|
| `MONGODB_URI` | رابط Atlas | أنشئ مستخدم باسم قاعدة `masjed` |
| `JWT_SECRET` | نص عشوائي طويل | للتوليد: `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |

لا تضع `.env.local` في المستودع — يُضبط محليًا فقط.

## 3. خطوات النشر

```bash
npm i -g vercel
vercel login
vercel link
vercel env add MONGODB_URI production
vercel env add JWT_SECRET production
vercel --prod
```

أو عبر GitHub: اربط المستودع من لوحة Vercel وأضف المتغيرات ثم Deploy.

## 4. بعد أول نشر

1. افتح `/` — سيوجهك إلى `/teacher/setup`
2. أنشئ حساب المعلم (يُنشأ مرة واحدة + المجموعتان الافتراضيتان)
3. عدّل أسماء المجموعات وأوقاتها من `/dashboard/settings`

## 5. الاختبارات المحلية

```bash
npm test        # اختبارات الوحدة (سريعة، بدون قاعدة بيانات)
npm run test:e2e  # تكامل شامل — يتطلب MongoDB محليًا على 27017
npm run build   # يجب أن ينجح قبل النشر
```

## 6. ملاحظات تقنية

- مصادقة الجلسة: JWT داخل Cookie ‏`httpOnly`‏ — يعمل على Edge Middleware عبر `jose`
- حدّ محاولات تعديل الحضور محفوظ في MongoDB (`rate_limits`) — آمن مع خوادم متعددة
- التوقيع الرقمي للرموز: HS256 وصلاحية ٧ أيام، رمز التعديل ٣٠ يومًا
- لا حاجة لـ WebSocket — التحديث عبر Polling

## 7. الأمان والحدود

- CSRF: كل طلبات /api تُفحص بمطابقة Origin مع Host (المتصفحات ترسل Origin تلقائيًا في POST)
- حدود المعدل (MongoDB — تعمل عبر خوادم متعددة):
  | المسار | الحد |
  |---|---|
  | POST /api/auth/login | 10 فشل / 15 دقيقة لكل IP |
  | POST /api/setup | 5 / ساعة لكل IP |
  | PATCH /api/attendance/:id | 8 فشل رمز / 15 دقيقة |
- رمز تعديل الحضور صالح 30 يومًا من لحظة التسجيل
- vercel.json يثبّت المنطقة fra1 ومدة الدوال 10 ثوانٍ (ضمن حدود Free)

## 8. تحسين الإنتاج

- الأصول الثابتة تُقدَّم مع تخزين مؤقت دائم من Next تلقائيًا (/_next/static)
- ضغط الاستجابات مفعّل افتراضيًا
- صفحات المعلم ديناميكية (force-dynamic) لأنها تعتمد على الجلسة والوقت الحي