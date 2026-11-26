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
- [R1/R2 execution report](docs/IMPLEMENTATION_REPORT_R1_R2.md): implemented files, tests, build status and external deployment steps.
- [Web-first release plan](docs/WEB_FIRST_RELEASE_PLAN.md): web deployment, acceptance criteria and deferred Android/iOS packaging.

## R1/R2 implementation
- Server ingestion API and Cloudflare D1 schema: `workers/steel-api.js`, `workers/schema.sql`, `workers/wrangler.toml`.
- Source health states and immutable local observation ledger: `core/source-health.js`, `core/price-ledger.js`.
- Price extraction and normalization: `core/extractor.js`, `core/price-domain.js`.
- Factory / IME / free-market comparison is grouped by product key, technical specification, delivery and VAT basis, and normalized to IRR/kg.
- Run automated tests with `npm test`; GitHub Actions runs them on relevant changes.

## Important setup notes
- In the product form, use the same product key only for the same commercial/technical item across factory, IME and free market. Do not compare unlike grades, dimensions, delivery bases or VAT bases.
- Set the current USD/AED/EUR to IRR exchange rates in Settings before including foreign-currency quotes. Toman is converted as 10 IRR; tonne prices are converted to kg basis.
- The D1 backend is code-complete for the first ingestion endpoints but is not live until the repository owner provisions D1, adds the Worker secrets/host allowlist and deploys it. The browser comparison currently works from the locally collected watchlist.
- Browser observations are stored in IndexedDB using add-only inserts; Android background observations are appended to a separate native ledger. Existing chart history is retained for backward compatibility.
- Cloudflare source parser supports JSON path, regex, a safe subset of CSS selectors (#id, .class, [data-price], [itemprop=price]) and common automatic price markers. Unsupported site layouts require a source-specific parser.
