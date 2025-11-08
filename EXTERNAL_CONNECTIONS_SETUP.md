# دليل إدارة الاتصالات الخارجية عبر قاعدة البيانات

## 📋 نظرة عامة

تم تصميم نظام الاتصالات الخارجية للعمل بالكامل من قاعدة البيانات والباك اند، بدون الحاجة لواجهة مستخدم. يتم إدارة جميع الاتصالات مباشرة من جدول `external_connections` في Supabase.

---

## 🔧 هيكل الجدول

جدول `external_connections` يحتوي على الأعمدة التالية:

| العمود | النوع | الوصف |
|--------|------|-------|
| `id` | UUID | المعرف الفريد (تلقائي) |
| `name` | TEXT | اسم الاتصال |
| `base_url` | TEXT | رابط WSDL API |
| `username` | TEXT | اسم المستخدم |
| `password_encrypted` | TEXT | كلمة المرور |
| `is_active` | BOOLEAN | حالة التفعيل (افتراضي: true) |
| `session_token` | TEXT | رمز الجلسة (يتم تحديثه تلقائياً) |
| `session_expires_at` | TIMESTAMP | وقت انتهاء الجلسة |
| `last_sync_at` | TIMESTAMP | آخر وقت مزامنة |
| `sync_status` | TEXT | حالة المزامنة (idle, connected, synced, error) |
| `sync_error` | TEXT | رسالة الخطأ (إن وجدت) |
| `created_by` | BIGINT | معرف المستخدم الذي أنشأ الاتصال |
| `created_at` | TIMESTAMP | تاريخ الإنشاء (تلقائي) |
| `updated_at` | TIMESTAMP | تاريخ آخر تحديث (تلقائي) |

---

## ✅ إضافة اتصال جديد

### المثال 1: اتصال بوزارة الداخلية

```sql
INSERT INTO public.external_connections (
  name,
  base_url,
  username,
  password_encrypted,
  is_active,
  created_by
) VALUES (
  'نظام وزارة الداخلية - المراسلات',
  'https://api.interior.gov.sa/soap/correspondence',
  'correspondence_api_user',
  'SecurePassword@2024',
  true,
  1  -- معرف المستخدم المسؤول
);
```

### المثال 2: اتصال بوزارة الصحة

```sql
INSERT INTO public.external_connections (
  name,
  base_url,
  username,
  password_encrypted,
  is_active,
  created_by
) VALUES (
  'نظام وزارة الصحة - WSDL',
  'https://health.gov.sa/services/correspondence.asmx',
  'moh_correspondence',
  'MoH#SecurePass2024',
  true,
  1
);
```

### المثال 3: اتصال اختبار (غير مفعّل)

```sql
INSERT INTO public.external_connections (
  name,
  base_url,
  username,
  password_encrypted,
  is_active,
  created_by
) VALUES (
  'اتصال تجريبي - بيئة الاختبار',
  'https://test-api.example.com/soap',
  'test_user',
  'TestPass123',
  false,  -- غير مفعل
  1
);
```

---

## 📊 عرض الاتصالات الموجودة

### عرض جميع الاتصالات النشطة

```sql
SELECT 
  id,
  name,
  base_url,
  username,
  is_active,
  sync_status,
  last_sync_at,
  session_expires_at,
  sync_error
FROM public.external_connections
WHERE is_active = true
ORDER BY created_at DESC;
```

### عرض حالة المزامنة لجميع الاتصالات

```sql
SELECT 
  name,
  sync_status,
  CASE 
    WHEN session_expires_at > NOW() THEN 'صالح'
    WHEN session_expires_at IS NULL THEN 'غير متصل'
    ELSE 'منتهي'
  END as session_status,
  last_sync_at,
  sync_error
FROM public.external_connections
ORDER BY last_sync_at DESC NULLS LAST;
```

---

## 🔄 تحديث الاتصالات

### تحديث كلمة المرور

```sql
UPDATE public.external_connections
SET 
  password_encrypted = 'NewSecurePassword@2024',
  session_token = NULL,  -- لإجبار إعادة المصادقة
  updated_at = NOW()
WHERE id = 'connection-uuid-here';
```

### تفعيل/إيقاف اتصال

```sql
-- تفعيل اتصال
UPDATE public.external_connections
SET is_active = true
WHERE id = 'connection-uuid-here';

-- إيقاف اتصال
UPDATE public.external_connections
SET is_active = false
WHERE id = 'connection-uuid-here';
```

### تحديث رابط API

```sql
UPDATE public.external_connections
SET 
  base_url = 'https://new-api.example.com/soap',
  session_token = NULL,
  updated_at = NOW()
WHERE name = 'نظام وزارة الداخلية - المراسلات';
```

---

## 🗑️ حذف اتصال

```sql
-- حذف اتصال معين
DELETE FROM public.external_connections
WHERE id = 'connection-uuid-here';

-- حذف جميع الاتصالات غير النشطة
DELETE FROM public.external_connections
WHERE is_active = false;
```

---

## 🤖 النظام التلقائي

### المهام التلقائية التي يقوم بها النظام:

1. **المصادقة التلقائية (كل 5 دقائق)**
   - يفحص جميع الاتصالات النشطة
   - يعيد المصادقة إذا كانت الجلسة منتهية أو قريبة من الانتهاء
   - يحدث `session_token` و `session_expires_at` تلقائياً

2. **المزامنة التلقائية (كل 5 دقائق)**
   - يجلب المراسلات الجديدة من الأنظمة الخارجية
   - يحدث `last_sync_at` و `sync_status`
   - يسجل الأخطاء في `sync_error`

3. **التسجيل في جدول `sync_log`**
   - يسجل كل عملية مزامنة (ناجحة أو فاشلة)
   - يحفظ تفاصيل الطلب والاستجابة

---

## 📝 عرض سجل المزامنة

### عرض آخر 10 عمليات مزامنة

```sql
SELECT 
  sl.created_at,
  ec.name as connection_name,
  sl.operation,
  sl.status,
  sl.error_message,
  sl.response_payload->'count' as records_synced
FROM public.sync_log sl
JOIN public.external_connections ec ON sl.connection_id = ec.id
ORDER BY sl.created_at DESC
LIMIT 10;
```

### عرض الأخطاء فقط

```sql
SELECT 
  sl.created_at,
  ec.name as connection_name,
  sl.error_message,
  sl.request_payload
FROM public.sync_log sl
JOIN public.external_connections ec ON sl.connection_id = ec.id
WHERE sl.status = 'error'
ORDER BY sl.created_at DESC;
```

---

## 🔍 استعلامات مفيدة

### عدد الاتصالات حسب الحالة

```sql
SELECT 
  sync_status,
  COUNT(*) as count
FROM public.external_connections
WHERE is_active = true
GROUP BY sync_status;
```

### الاتصالات التي لم تتم مزامنتها منذ ساعة

```sql
SELECT 
  name,
  last_sync_at,
  sync_status,
  sync_error
FROM public.external_connections
WHERE 
  is_active = true
  AND (
    last_sync_at IS NULL 
    OR last_sync_at < NOW() - INTERVAL '1 hour'
  )
ORDER BY last_sync_at ASC NULLS FIRST;
```

### الاتصالات التي انتهت جلساتها

```sql
SELECT 
  name,
  session_expires_at,
  sync_status
FROM public.external_connections
WHERE 
  is_active = true
  AND session_expires_at < NOW();
```

---

## 🔐 أمثلة WSDL

### هيكل طلب المصادقة (Login)

```xml
<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <Login xmlns="http://tempuri.org/">
      <username>correspondence_api_user</username>
      <password>SecurePassword@2024</password>
    </Login>
  </soap:Body>
</soap:Envelope>
```

### هيكل طلب جلب المراسلات (GetCorrespondences)

```xml
<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Header>
    <AuthToken xmlns="http://tempuri.org/">SESSION_TOKEN_HERE</AuthToken>
  </soap:Header>
  <soap:Body>
    <GetCorrespondences xmlns="http://tempuri.org/">
      <lastSyncTime>2025-01-01T00:00:00Z</lastSyncTime>
    </GetCorrespondences>
  </soap:Body>
</soap:Envelope>
```

---

## 📱 استدعاء Edge Functions يدوياً

إذا أردت تشغيل المزامنة يدوياً:

### المصادقة لاتصال معين

```javascript
await supabase.functions.invoke('wsdl-session-manager', {
  body: { 
    action: 'authenticate', 
    connectionId: 'your-connection-uuid' 
  }
});
```

### مزامنة اتصال معين

```javascript
await supabase.functions.invoke('wsdl-session-manager', {
  body: { 
    action: 'sync', 
    connectionId: 'your-connection-uuid' 
  }
});
```

### فحص جميع الاتصالات

```javascript
await supabase.functions.invoke('wsdl-session-manager', {
  body: { 
    action: 'check_all'
  }
});
```

---

## ⚙️ إعدادات Cron Job

الجدولة التلقائية مفعلة حالياً بالإعدادات التالية:

- **التكرار**: كل 5 دقائق
- **المهمة**: فحص جميع الاتصالات النشطة وإعادة المصادقة والمزامنة
- **الوظيفة**: `wsdl-session-manager`

لتعديل التوقيت، يمكنك تحديث الـ Cron Job في قاعدة البيانات:

```sql
-- عرض الجدولة الحالية
SELECT * FROM cron.job WHERE jobname = 'check-wsdl-connections';

-- تعديل التوقيت إلى كل 10 دقائق
SELECT cron.alter_job(
  job_id := (SELECT jobid FROM cron.job WHERE jobname = 'check-wsdl-connections'),
  schedule := '*/10 * * * *'
);

-- حذف الجدولة
SELECT cron.unschedule('check-wsdl-connections');
```

---

## 🚨 استكشاف الأخطاء

### مشكلة: الاتصال لا يتم تلقائياً

**التحقق:**
```sql
SELECT * FROM public.external_connections 
WHERE id = 'your-connection-uuid';
```

**الحلول الممكنة:**
1. تأكد أن `is_active = true`
2. تحقق من `sync_error` لمعرفة السبب
3. تحقق من صحة `base_url`, `username`, `password_encrypted`

### مشكلة: الجلسة تنتهي بسرعة

```sql
-- تحقق من وقت انتهاء الجلسة
SELECT 
  name,
  session_expires_at,
  NOW() as current_time,
  session_expires_at - NOW() as time_remaining
FROM public.external_connections
WHERE id = 'your-connection-uuid';
```

### مشكلة: المزامنة لا تعمل

```sql
-- تحقق من سجل الأخطاء
SELECT * FROM public.sync_log
WHERE connection_id = 'your-connection-uuid'
  AND status = 'error'
ORDER BY created_at DESC
LIMIT 5;
```

---

## 📞 الدعم

للمزيد من المساعدة:
1. راجع سجل الأخطاء في `sync_log`
2. تحقق من logs الـ Edge Function `wsdl-session-manager`
3. تأكد من صحة بيانات الاتصال في النظام الخارجي

---

**تم التحديث:** 2025-11-08  
**الإصدار:** 1.0
