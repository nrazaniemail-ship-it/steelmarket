# گزارش اجرای نسخه وب ۱.۲ فولادبان

تاریخ: ۲۰۲۶-۱۱-۲۶  
مخزن: `nrazaniemail-ship-it/steelmarket`  
نسخه وب: `https://nrazaniemail-ship-it.github.io/steelmarket/`

## تغییرات رابط وب
- داشبورد شاخص‌های بازار: تعداد منابع، میانگین قیمت هم‌مبنا و بیشترین دامنه اختلاف.
- مدیریت محصول/منبع: افزودن، ویرایش، غیرفعال‌سازی و بررسی فوری.
- پنل سلامت منابع: سالم، ناپایدار، کهنه، خطادار، در انتظار و غیرفعال.
- پنل اتصال API مرکزی؛ توکن مدیریتی فقط در sessionStorage نشست مرورگر.
- همگام‌سازی منابع، آخرین قیمت‌ها، تاریخچه، رویدادها و وضعیت منبع از API عمومی/مدیریتی.
- نمودار با میانگین متحرک سه‌نقطه‌ای و برآورد خطی کوتاه‌مدت.
- مقایسه کارخانه، بورس کالا و بازار آزاد؛ استفاده از قیمت نرمال‌شده سمت سرور در صورت موجود بودن.
- ناوبری پنج‌قسمتی موبایل، کارت‌های واکنش‌گرا و فرم‌های سازگار با صفحه کوچک.

## تغییرات API و دریافت داده
- `GET /public/market`: آخرین مشاهده هر منبع.
- `GET /public/sources`: سلامت و وضعیت منابع بدون افشای URL.
- `GET /public/observations?product_key=...`: تاریخچه عمومی قیمت.
- `GET /public/events`: رویدادهای تغییر قیمت.
- `POST /sources`: ثبت/به‌روزرسانی منبع با احراز هویت.
- `POST /sources/:id/check`: بررسی فوری و ثبت مشاهده جدید.
- `PATCH /sources/:id`: غیرفعال‌سازی منبع بدون حذف سوابق.
- Cron پانزده‌دقیقه‌ای، ثبت append-only در D1 و ایجاد رویداد هنگام تغییر قیمت.
- اعتبارسنجی نوع بازار، ارز، واحد، parser و allowlist دامنه.

## کیفیت و تست
- ۱۵ تست Node برای منطق قیمت، استخراج و API؛ همه موفق.
- بررسی نحوی Workerها، Service Worker و اسکریپت PWA؛ موفق.
- Wrangler Worker bundle dry-run؛ موفق.
- تست مرورگر Chromium؛ موفق: بازشدن داشبورد موبایل، افزودن/ویرایش محصول، نمایش فیلدهای parser و نبود خطای runtime.
- تست SQLite برای ممنوعیت UPDATE/DELETE روی دفترکل.
- بررسی syntax فایل‌های Worker، Service Worker و اسکریپت PWA.
- نتیجه تست‌ها در [اجرای موفق GitHub Actions](https://github.com/nrazaniemail-ship-it/steelmarket/actions/runs/45891807799) ثبت شده است.

## انتشار
- نسخه وب با GitHub Pages منتشر شده است.
- URL انتشار: `https://nrazaniemail-ship-it.github.io/steelmarket/`
- گردش‌کار انتشار: `.github/workflows/pages.yml`؛ انتشار موفق در [GitHub Pages Actions](https://github.com/nrazaniemail-ship-it/steelmarket/actions/runs/45891736043).
- گردش‌کار Deploy API: `.github/workflows/deploy-api.yml`

## موارد لازم برای داده زنده مرکزی
کد API و رابط اتصال آماده است، اما تا وقتی مالک مخزن موارد زیر را در Cloudflare/GitHub تنظیم و Deploy نکند، قیمت زنده مرکزی فعال نخواهد شد:
1. ایجاد D1 database با نام `fooladban` و قرار دادن شناسه در GitHub Secret با نام `D1_DATABASE_ID`.
2. Secrets: `CLOUDFLARE_API_TOKEN`، `CLOUDFLARE_ACCOUNT_ID`، `FOOLADB_API_TOKEN`.
3. Variables: `FOOLADB_APP_ORIGIN` و `FOOLADB_ALLOWED_HOSTS`.
4. اجرای دستی workflow با نام `Deploy Fooladban API`.
5. واردکردن آدرس Worker و API Token در تنظیمات نسخه وب و ثبت URL منابع مجاز.
6. برای ارزهای خارجی، تنظیم Secrets اختیاری `FOOLADB_USD_IRR`، `FOOLADB_AED_IRR` و `FOOLADB_EUR_IRR`.

تا پیش از ثبت منابع واقعی و مشاهده موفق، سامانه نباید داده نمونه را به‌عنوان قیمت زنده نمایش دهد.

## محدوده نسخه
در این مرحله هیچ APK یا نسخه iOS ساخته یا منتشر نمی‌شود. ساخت موبایل پس از پذیرش نسخه وب انجام خواهد شد.
