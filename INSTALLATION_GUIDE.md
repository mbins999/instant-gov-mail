# دليل التثبيت الكامل - نظام إدارة المراسلات
## Correspondence Management System - Complete Installation Guide

---

## 📋 محتويات الدليل

1. [متطلبات النظام](#متطلبات-النظام)
2. [هيكل المشروع](#هيكل-المشروع)
3. [خطوات التثبيت](#خطوات-التثبيت)
4. [إعداد قاعدة البيانات](#إعداد-قاعدة-البيانات)
5. [إعداد الملفات](#إعداد-الملفات)
6. [التشغيل](#التشغيل)
7. [الاتصال بالجهات الخارجية](#الاتصال-بالجهات-الخارجية)

---

## متطلبات النظام

### البرمجيات المطلوبة:
- **Node.js** v18 أو أحدث
- **npm** أو **yarn** أو **bun**
- **PostgreSQL** (عند استخدام Supabase Cloud يُتوفر تلقائياً)
- **Git** (اختياري)

### الخدمات السحابية:
- حساب **Supabase** (مجاني أو مدفوع)
- **Lovable Cloud** (اختياري)

---

## هيكل المشروع

```
correspondence-management-system/
│
├── public/                          # الملفات العامة
│   ├── robots.txt
│   └── favicon.ico
│
├── src/                             # ملفات المصدر الرئيسية
│   ├── components/                  # المكونات القابلة لإعادة الاستخدام
│   │   ├── ui/                     # مكونات واجهة المستخدم (shadcn)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── select.tsx
│   │   │   ├── table.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ... (المزيد من المكونات)
│   │   │
│   │   ├── AdvancedSearchBar.tsx   # شريط البحث المتقدم
│   │   ├── CorrespondenceTable.tsx  # جدول المراسلات
│   │   ├── ProtectedRoute.tsx       # حماية المسارات
│   │   ├── Sidebar.tsx              # القائمة الجانبية
│   │   ├── StatCard.tsx             # بطاقة الإحصائيات
│   │   └── TopBar.tsx               # الشريط العلوي
│   │
│   ├── pages/                       # صفحات التطبيق
│   │   ├── Index.tsx               # الصفحة الرئيسية
│   │   ├── Auth.tsx                # صفحة تسجيل الدخول
│   │   ├── Dashboard.tsx           # لوحة التحكم
│   │   ├── Incoming.tsx            # البريد الوارد
│   │   ├── Sent.tsx                # المرسل
│   │   ├── Outgoing.tsx            # الوارد الخارجي
│   │   ├── ArchivePage.tsx         # الأرشيف
│   │   ├── NewCorrespondence.tsx   # إنشاء مراسلة
│   │   ├── CorrespondenceDetail.tsx # تفاصيل المراسلة
│   │   ├── SearchPage.tsx          # صفحة البحث
│   │   ├── AdvancedSearchPage.tsx  # البحث المتقدم
│   │   ├── ImportCorrespondence.tsx # استيراد المراسلات
│   │   ├── UsersManagement.tsx     # إدارة المستخدمين
│   │   ├── ExternalConnections.tsx # الاتصالات الخارجية
│   │   └── NotFound.tsx            # صفحة الخطأ 404
│   │
│   ├── hooks/                       # React Hooks مخصصة
│   │   ├── use-mobile.tsx
│   │   ├── use-toast.ts
│   │   ├── useCorrespondences.tsx
│   │   └── useUserRole.tsx
│   │
│   ├── lib/                         # مكتبات مساعدة
│   │   ├── security.ts             # وظائف الأمان
│   │   ├── supabaseAuth.ts         # المصادقة
│   │   └── utils.ts                # أدوات مساعدة
│   │
│   ├── services/                    # خدمات API
│   │   └── correspondenceApi.ts    # خدمة API المراسلات
│   │
│   ├── types/                       # أنواع TypeScript
│   │   └── correspondence.ts       # أنواع المراسلات
│   │
│   ├── integrations/                # التكاملات
│   │   └── supabase/
│   │       ├── client.ts           # عميل Supabase
│   │       └── types.ts            # أنواع قاعدة البيانات
│   │
│   ├── App.tsx                      # المكون الرئيسي
│   ├── App.css                      # تنسيقات عامة
│   ├── index.css                    # تنسيقات رئيسية
│   ├── main.tsx                     # نقطة الدخول
│   └── vite-env.d.ts               # تعريفات Vite
│
├── supabase/                        # ملفات Supabase
│   ├── functions/                   # Edge Functions
│   │   ├── create-user/
│   │   │   └── index.ts
│   │   ├── create-initial-user/
│   │   │   └── index.ts
│   │   ├── login-with-username/
│   │   │   └── index.ts
│   │   ├── signup-with-username/
│   │   │   └── index.ts
│   │   ├── simple-login/
│   │   │   └── index.ts
│   │   ├── simple-signup/
│   │   │   └── index.ts
│   │   ├── update-user/
│   │   │   └── index.ts
│   │   ├── generate-correspondence-pdf/
│   │   │   └── index.ts
│   │   ├── rate-limiter/
│   │   │   └── index.ts
│   │   └── external-sync/
│   │       └── index.ts
│   │
│   ├── migrations/                  # ملفات الهجرة (Database Migrations)
│   └── config.toml                  # إعدادات Supabase
│
├── DATABASE_SETUP.sql               # سكريبت إعداد قاعدة البيانات
├── INSTALLATION_GUIDE.md            # هذا الملف
├── README.md                        # ملف التوثيق الرئيسي
├── package.json                     # ملف الحزم
├── tsconfig.json                    # إعدادات TypeScript
├── tailwind.config.ts               # إعدادات Tailwind CSS
├── vite.config.ts                   # إعدادات Vite
└── .env                             # المتغيرات البيئية
```

---

## خطوات التثبيت

### 1. إنشاء مشروع جديد

```bash
# استنساخ أو إنشاء مجلد المشروع
mkdir correspondence-management-system
cd correspondence-management-system

# تهيئة مشروع Node.js
npm init -y
```

### 2. تثبيت الحزم الأساسية

```bash
# تثبيت React و Vite
npm install react react-dom react-router-dom
npm install -D @vitejs/plugin-react vite typescript @types/react @types/react-dom

# تثبيت Supabase
npm install @supabase/supabase-js@2

# تثبيت TanStack Query
npm install @tanstack/react-query

# تثبيت مكونات UI (Radix UI + shadcn)
npm install @radix-ui/react-accordion @radix-ui/react-alert-dialog @radix-ui/react-aspect-ratio
npm install @radix-ui/react-avatar @radix-ui/react-checkbox @radix-ui/react-collapsible
npm install @radix-ui/react-context-menu @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install @radix-ui/react-hover-card @radix-ui/react-label @radix-ui/react-menubar
npm install @radix-ui/react-navigation-menu @radix-ui/react-popover @radix-ui/react-progress
npm install @radix-ui/react-radio-group @radix-ui/react-scroll-area @radix-ui/react-select
npm install @radix-ui/react-separator @radix-ui/react-slider @radix-ui/react-slot
npm install @radix-ui/react-switch @radix-ui/react-tabs @radix-ui/react-toast
npm install @radix-ui/react-toggle @radix-ui/react-toggle-group @radix-ui/react-tooltip

# تثبيت Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npm install tailwindcss-animate tailwind-merge
npm install class-variance-authority clsx

# تثبيت React Hook Form و Zod
npm install react-hook-form @hookform/resolvers zod

# تثبيت أدوات إضافية
npm install lucide-react date-fns sonner vaul
npm install cmdk embla-carousel-react input-otp
npm install next-themes recharts
npm install react-day-picker react-resizable-panels

# تهيئة Tailwind
npx tailwindcss init -p
```

### 3. إعداد ملف البيئة (.env)

إنشاء ملف `.env` في جذر المشروع:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
VITE_SUPABASE_PROJECT_ID=your_project_id

# يمكن الحصول على هذه القيم من لوحة تحكم Supabase:
# 1. اذهب إلى https://supabase.com/dashboard
# 2. اختر مشروعك
# 3. اذهب إلى Settings > API
# 4. انسخ URL و anon/public key
```

---

## إعداد قاعدة البيانات

### الطريقة 1: عبر Lovable Cloud (موصى به)

1. النظام مُعد تلقائياً مع Lovable Cloud
2. قاعدة البيانات تُنشأ تلقائياً عند أول نشر

### الطريقة 2: عبر Supabase المباشر

1. اذهب إلى [Supabase Dashboard](https://supabase.com/dashboard)
2. افتح SQL Editor
3. نفّذ محتويات ملف `DATABASE_SETUP.sql`

```bash
# أو باستخدام CLI
supabase db push
```

### إنشاء Storage Buckets

في لوحة تحكم Supabase:

1. اذهب إلى **Storage**
2. أنشئ البالعات التالية:
   - `signatures` (public)
   - `attachments` (public)
   - `correspondence-pdfs` (public)

---

## إعداد الملفات

### 1. نسخ جميع الملفات

انسخ جميع الملفات من المجلدات التالية إلى مشروعك:

- **src/components/** → كل المكونات
- **src/pages/** → كل الصفحات
- **src/hooks/** → React Hooks
- **src/lib/** → المكتبات
- **src/services/** → الخدمات
- **src/types/** → الأنواع
- **supabase/functions/** → Edge Functions
- **public/** → الملفات العامة

### 2. إعدادات TypeScript (tsconfig.json)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### 3. إعدادات Vite (vite.config.ts)

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

### 4. إعدادات Tailwind (tailwind.config.ts)

```typescript
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
```

---

## التشغيل

### 1. التطوير المحلي

```bash
# تشغيل خادم التطوير
npm run dev

# سيفتح المتصفح على: http://localhost:5173
```

### 2. البناء للإنتاج

```bash
# بناء المشروع
npm run build

# معاينة البناء
npm run preview
```

### 3. إنشاء أول مستخدم

عند تشغيل النظام لأول مرة:

1. سجّل دخول أول مستخدم (سيكون مسؤولاً تلقائياً)
2. من لوحة إدارة المستخدمين، أضف مستخدمين جدد
3. عيّن الأدوار المناسبة لكل مستخدم

---

## الاتصال بالجهات الخارجية

### إعداد REST API Integration

1. سجل دخول كمسؤول
2. اذهب إلى **"الاتصالات الخارجية"** من القائمة الجانبية
3. أضف اتصال جديد:
   - **الاسم**: اسم الجهة الخارجية
   - **رابط API**: Base URL للـ API (من ملف `Services_Doc.docx`)
   - **اسم المستخدم**: Username للنظام الخارجي
   - **كلمة المرور**: Password للنظام الخارجي

### استخدام نظام المزامنة

بعد إعداد الاتصال:

- عند إنشاء مراسلة جديدة، سيتم إرسالها تلقائياً للجهة الخارجية
- يمكنك متابعة حالة المزامنة من سجل المزامنة
- في حال فشل الإرسال، ستظهر رسالة خطأ مع التفاصيل

---

## الدعم والمساعدة

### الوثائق:
- **Supabase Docs**: https://supabase.com/docs
- **React Docs**: https://react.dev
- **Tailwind CSS**: https://tailwindcss.com

### حل المشاكل الشائعة:

#### مشكلة: "لا يمكن الاتصال بقاعدة البيانات"
**الحل**: تحقق من ملف `.env` وتأكد من صحة بيانات الاعتماد

#### مشكلة: "خطأ RLS Policy"
**الحل**: تأكد من تنفيذ جميع سياسات RLS من `DATABASE_SETUP.sql`

#### مشكلة: "فشل تحميل الملفات"
**الحل**: تأكد من إنشاء Storage Buckets وتفعيل الوصول العام

---

## الأمان

### نصائح أمنية مهمة:

1. **لا تشارك ملف `.env`** - أضفه إلى `.gitignore`
2. **استخدم كلمات مرور قوية** للمستخدمين
3. **فعّل MFA** في حساب Supabase
4. **راجع RLS Policies** بانتظام
5. **حدّث الحزم** بشكل دوري

---

## الخلاصة

الآن أصبح لديك نظام كامل لإدارة المراسلات:

✅ قاعدة بيانات محمية بـ RLS  
✅ نظام مصادقة آمن  
✅ تكامل مع REST APIs خارجية  
✅ تصدير PDF للمراسلات  
✅ إدارة المستخدمين والصلاحيات  
✅ أرشفة ذكية للكتب  

**ملاحظة**: هذا النظام جاهز للتطوير ويمكن توسيعه حسب احتياجاتك.

---

📅 **تاريخ آخر تحديث**: نوفمبر 2025  
📧 **للدعم الفني**: يمكنك طرح أسئلتك في قسم Issues على GitHub