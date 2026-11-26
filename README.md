# فولادبان | Fooladban

سامانه PWA برای پایش قیمت محصولات زنجیره فولاد ایران و خاورمیانه.

## امکانات نسخه ۱
- تعریف چندین محصول با URL منبع دلخواه
- انتخاب بازار، گروه، واحد پول/اندازه‌گیری و روش استخراج قیمت
- استخراج خودکار متادیتا و عناصر رایج HTML یا تعیین CSS Selector / Regex / JSON path
- ثبت تاریخچه محلی تا ۵۰۰ نقطه برای هر محصول
- تشخیص تغییر قیمت، آستانه هشدار و اعلان مرورگر
- نمودار قیمت و برآورد روند با رگرسیون خطی ساده
- خروجی CSV، پوسته تیره و نصب PWA

## انتشار GitHub Pages
مخزن از طریق GitHub Actions منتشر می‌شود. در Settings → Pages، Source را روی GitHub Actions قرار دهید.

## محدودیت دریافت قیمت
مرورگر اجازه خواندن محتوای بسیاری از سایت‌ها را به دلیل CORS نمی‌دهد. برای این منابع، Worker نمونه `workers/price-proxy.js` را در Cloudflare Workers جداگانه منتشر کنید، متغیر `ALLOWED_HOSTS` را با دامنه‌های مجاز پر کنید و نشانی Worker را در تنظیمات برنامه وارد کنید. Worker فقط HTTPS و میزبان‌های مجاز را می‌پذیرد.

قیمت‌خوانی فقط در زمان باز بودن برنامه و اجرای صفحه فعال است؛ Service Worker به‌تنهایی زمان‌بندی قابل‌اتکای دائمی برای واکشی صفحات خارجی یا ارسال هشدار در حالت بسته بودن برنامه فراهم نمی‌کند. اعلان پس‌زمینه مطمئن نیازمند سرویس سرور زمان‌بندی‌شده و Web Push/FCM است. این نسخه داده‌ها را روی همان دستگاه نگه می‌دارد و بین دستگاه‌ها همگام‌سازی نمی‌کند.

## استخراج داده
- خودکار: OpenGraph/product price و کلاس‌های رایج قیمت
- CSS Selector: عنصر اختصاصی صفحه
- Regex: گروه اول باید عدد قیمت باشد
- JSON: مسیر نقطه‌ای مانند `data.price`

پیش‌بینی نمودار صرفاً برون‌یابی آماری خطی است و توصیه سرمایه‌گذاری نیست.


## Product strategy and research
- [Competitive benchmark](docs/COMPETITIVE_BENCHMARK.md): public-product review of global, Middle East and Iran steel intelligence references.
- [Product blueprint](docs/PRODUCT_BLUEPRINT.md): target modules, data model, source-quality rules, forecast standards, architecture and release roadmap.
