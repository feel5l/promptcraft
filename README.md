# 🚀 PromptCraft

منصة هندسة برومبتات احترافية لتوليد وتحسين **Prompts** للنصوص والصور والفيديو عبر مزودي ذكاء اصطناعي متعددين.  
تساعد الفرق على بناء برومبتات أكثر دقة وقابلية للتنفيذ بسرعة، مع تجربة واجهة حديثة وواجهة API منظمة.

---

## 🧭 نظرة عامة

- **نوع المشروع:** Monorepo (pnpm workspace)
- **القيمة الأساسية:** رفع جودة مخرجات الذكاء الاصطناعي عبر تحسين صياغة الطلبات
- **الجمهور المستهدف:** المطورون، فرق المنتجات، صناع المحتوى، والشركات الناشئة

---

## ✨ الميزات الرئيسية

- توليد برومبتات نصية باعتماد تقنيات متقدمة:
  - Zero-shot
  - Few-shot
  - Chain-of-Thought
  - Role Prompting
  - XML Tags
  - Auto Selection
- توليد برومبتات صور موجهة لأدوات مثل:
  - Midjourney
  - DALL·E 3
  - Stable Diffusion
  - Flux
  - Ideogram
  - Firefly
- توليد برومبتات فيديو موجهة لأدوات مثل:
  - Sora
  - Runway
  - Kling
  - Pika
  - Luma
  - Hailuo
- أداة **Prompt Optimizer** لتحليل البرومبت الحالي وتحسينه مع مقارنة درجات الجودة
- إعدادات ذكية للمزود والنموذج مع كشف تلقائي لنوع المزود من مفتاح API
- استخدام عقود API موحدة (OpenAPI + Zod) بين الواجهة الأمامية والخلفية

---

## 🧱 التقنيات المستخدمة

### الواجهة الأمامية (Frontend)
- React 19
- TypeScript
- Vite
- Wouter (Routing)
- TanStack React Query
- Tailwind CSS + shadcn/ui + Radix UI
- Framer Motion

### الواجهة الخلفية (Backend)
- Node.js
- Express 5
- TypeScript
- Pino / pino-http (Logging)
- OpenAI SDK / Anthropic SDK / Google Generative AI

### الطبقة المشتركة والبنية
- pnpm Workspaces
- OpenAPI 3.1
- Orval (Code Generation)
- Zod (Validation & Schemas)
- Drizzle ORM (جاهز للتوسعة)
- PostgreSQL (ضمن بنية lib/db)

---

## 🗂️ تنظيم المشروع

```text
promptcraft/
├─ artifacts/
│  ├─ promptcraft/        # تطبيق الويب الرئيسي
│  ├─ api-server/         # خادم API
│  └─ mockup-sandbox/     # بيئة معاينة المكونات
├─ lib/
│  ├─ api-spec/           # مواصفة OpenAPI
│  ├─ api-client-react/   # Hooks مولدة للـ Frontend
│  ├─ api-zod/            # Schemas مولدة للـ Backend
│  └─ db/                 # طبقة قاعدة البيانات (Drizzle)
└─ scripts/               # سكربتات مساعدة
```

---

## ⚙️ طريقة التثبيت والتشغيل

### المتطلبات
- Node.js 24+
- pnpm

### خطوات التشغيل

```bash
pnpm install
pnpm run typecheck
pnpm run build
```

### تشغيل الخدمات

```bash
# تشغيل خادم API
pnpm --filter @workspace/api-server run dev

# تشغيل واجهة PromptCraft
pnpm --filter @workspace/promptcraft run dev
```

> ملاحظة: واجهة الويب تتصل افتراضيًا بخادم API عبر المسار `/api`.

---

## 🔌 نقاط API الأساسية

- `GET /api/healthz`
- `GET /api/providers`
- `POST /api/prompts/generate`
- `POST /api/prompts/image`
- `POST /api/prompts/video`
- `POST /api/prompts/optimize`

---

## 🔐 ملاحظات أمنية

- مفاتيح API تُحفظ محليًا في المتصفح (localStorage) ولا تُخزن على الخادم.
- يتم تمرير المفاتيح مع الطلب ثم استخدامها لحظيًا فقط.
- السجلات تستخدم Pino مع إخفاء الحقول الحساسة مثل Authorization و Cookies.

---

## 🤝 المساهمة

نرحّب بالمساهمات التقنية وتحسينات المنتج.

1. أنشئ فرعًا جديدًا من `main`
2. نفّذ التعديلات المطلوبة
3. شغّل:
   - `pnpm run typecheck`
   - `pnpm run build`
4. افتح Pull Request واضحًا مع وصف مختصر للتغيير

---

## 📄 الترخيص

مرخّص تحت **MIT License**.
