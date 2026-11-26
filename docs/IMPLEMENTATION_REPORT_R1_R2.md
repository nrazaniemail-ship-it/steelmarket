# گزارش اجرایی فولادبان — R1 و R2

تاریخ اجرا: 2026-11-26  
شاخه: main

## تحویل‌های R1
- معماری دریافت سمت سرور در workers/steel-api.js با API ثبت/فهرست منابع، دریافت مشاهدات و مقایسه.
- اجرای زمان‌بندی‌شده هر ۱۵ دقیقه با احترام به interval هر منبع.
- محدودیت HTTPS، allowlist دامنه، اعتبارسنجی هر redirect، سقف پاسخ ۱.۵ مگابایت و کنترل Content-Type.
- استخراج JSON path، Regex، CSS subset (#id، .class، [data-price]، [itemprop=price]) و نشانگرهای متداول خودکار.
- سلامت منبع با وضعیت‌های pending، healthy، degraded، stale، error و disabled.
- دفترکل D1 برای observations همراه Triggerهای منع UPDATE و DELETE.
- دفترکل محلی IndexedDB با درج add-only و دفترکل بومی اندروید برای مشاهدات پس‌زمینه.
- WorkManager اندروید با حداقل بازه ۱۵ دقیقه، ثبت خطا و موفقیت و اعلان تغییر قیمت.
- بهبود CORS proxy مجزا با allowlist و اعتبارسنجی انتقال‌ها.

## تحویل‌های R2
- فرم تعریف نوع منبع: کارخانه، بورس کالا، بازار آزاد، صادراتی و سایر.
- کلید مشترک کالا برای پیوند قیمت‌های یک محصول بین منابع.
- ثبت مشخصات فنی، محل تحویل و مبنای مالیات برای جلوگیری از مقایسه ناهمگون.
- استانداردسازی ارز به IRR و واحد به kg؛ تبدیل تومان به ریال با ضریب ۱۰ و تن به کیلوگرم با ضریب ۱/۱۰۰۰.
- ارزهای IRR، IRT، USD، AED و EUR؛ نرخ ارز خارجی باید صریحاً توسط اپراتور وارد شود.
- نمایش کمترین/بیشترین قیمت و دامنه اختلاف فقط برای گروه‌هایی با دست‌کم دو منبع هم‌مشخصات.

## فایل‌های کلیدی
- core/price-domain.js
- core/price-ledger.js
- core/source-health.js
- core/extractor.js
- workers/steel-api.js
- workers/price-proxy.js
- workers/schema.sql
- workers/wrangler.toml
- workers/wrangler.proxy.toml
- tests/domain.test.cjs
- tests/schema_test.py
- tests/check_ui.py

## اعتبارسنجی خودکار
- تست‌های Node برای اعداد فارسی، تبدیل ارز/واحد، مقایسه سه بازار، سلامت منبع، استخراج JSON/Regex/CSS و کنترل URL.
- تست SQLite ثابت می‌کند UPDATE و DELETE روی observations با خطای append-only رد می‌شود.
- بررسی نحوی JavaScript در صفحه PWA و هر دو Worker.
- Build اندروید با موفقیت انجام شده و Artifact APK منتشر شده است. آخرین نسخه 1.1.0 در گردش ساخت پس از ثبت این گزارش قرار دارد.

## مواردی که هنوز به دسترسی مالک مخزن/حساب نیاز دارد
1. ساخت D1 در Cloudflare و جایگزینی database_id در workers/wrangler.toml.
2. تعیین APP_ORIGIN و ALLOWED_HOSTS واقعی؛ افزودن API_TOKEN و نرخ‌های FX با wrangler secret/vars.
3. اجرای schema.sql روی D1 و Deploy کردن API Worker.
4. Deploy جداگانه price-proxy با wrangler.proxy.toml برای واکشی از PWA.
5. تعریف منابع واقعی و مجاز قیمت؛ تا پیش از آن داده زنده یا نرخ بازار از سوی سامانه جعل/فرض نمی‌شود.
6. GitHub Pages هنوز نیازمند تنظیم Settings → Pages → Source = GitHub Actions است.

## مرزهای نسخه
- مقایسه در PWA از آخرین مشاهده‌های watchlist محلی استفاده می‌کند.
- API سمت سرور و D1 schema آماده‌اند، اما به علت نبود D1 و secrets هنوز به سرویس زنده متصل نشده‌اند.
- اعلان اندروید مبتنی بر WorkManager است و به دلیل محدودیت‌های سیستم‌عامل، تضمین لحظه‌ای ندارد.
- ثبت دفترکل محلی و سروری از بازنویسی رکوردهای مشاهده جلوگیری می‌کند؛ تاریخچه نمودار فعلی برای سازگاری نسخه قبل همچنان در state محلی نگهداری می‌شود.
