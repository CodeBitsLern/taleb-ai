# طالب - المساعد الذكي المطور

## نظرة عامة
تطبيق ويب ذكي مبني بـ React و TypeScript، يوفر واجهة محادثة احترافية مع شعار "طالب" كخلفية شفافة جميلة.

## الميزات الرئيسية
- ✅ واجهة محادثة حديثة وسهلة الاستخدام
- ✅ شعار "طالب" الذهبي كخلفية شفافة (5% opacity)
- ✅ تصميم مستجيب وسلس
- ✅ اختبارات Vitest شاملة (12/12 passing)
- ✅ كود نظيف وموثق

## التكنولوجيا المستخدمة
- **Frontend**: React + TypeScript
- **Styling**: TailwindCSS
- **Testing**: Vitest
- **Build Tool**: Vite

## التثبيت والتشغيل

### المتطلبات
- Node.js 18+
- npm أو yarn

### خطوات التثبيت
```bash
# استنساخ المستودع
git clone https://github.com/CodeBitsLern/taleb-ai.git
cd taleb-ai

# تثبيت المكتبات
npm install

# تشغيل التطبيق
npm run dev

# تشغيل الاختبارات
npm run test
```

## بنية المشروع
```
taleb-ai/
├── src/
│   ├── components/
│   │   ├── Chat.tsx          # مكون المحادثة الرئيسي
│   │   └── ...
│   ├── assets/
│   │   └── taleb-logo.svg    # شعار طالب
│   ├── styles/
│   │   └── globals.css       # الأنماط العامة
│   └── App.tsx
├── tests/
│   └── ...
├── package.json
└── vite.config.ts
```

## الخطوات التالية المقترحة
1. **تخصيص شدة الخلفية**: إضافة إعدادات لتعديل شفافية الخلفية
2. **خيارات خلفيات متعددة**: توفير أنماط خلفية مختلفة
3. **نظام المواضيع (Themes)**: إنشاء نظام تخصيص شامل

## المساهمة
نرحب بالمساهمات! يرجى فتح issue أو pull request.

## الترخيص
MIT License

---
تم إنشاء هذا المشروع بواسطة Manus AI Assistant
