# فولادبان | Fooladban

سامانه وب/PWA واکنش‌گرا برای پایش قیمت محصولات زنجیره فولاد ایران و خاورمیانه.

**نسخه وب منتشرشده:** https://nrazaniemail-ship-it.github.io/steelmarket/

## امکانات نسخه وب ۱.۲
- داشبورد بازار با شاخص‌های منابع فعال، میانگین قیمت هم‌مبنا و دامنه اختلاف
- مدیریت محصول/منبع: افزودن، ویرایش، غیرفعال‌سازی و بررسی فوری قیمت
- پنل سلامت منابع با وضعیت سالم، ناپایدار، کهنه، خطادار و غیرفعال
- اتصال به API مرکزی و همگام‌سازی داده‌ها، رویدادها و تاریخچه D1
- نمودار قیمت با میانگین متحرک و برآورد خطی
- مقایسه کارخانه، بورس کالا و بازار آزاد با تبدیل به ریال/کیلوگرم
- رابط RTL واکنش‌گرا و ناوبری پایین صفحه برای موبایل

## امکانات پایه
- تعریف چندین محصول با URL منبع دلخواه
- انتخاب بازار، گروه، واحد پول/اندازه‌گیری و روش استخراج قیمت
- استخراج خودکار متادیتا و عناصر رایج HTML یا تعیین CSS Selector / Regex / JSON path
- ثبت تاریخچه محلی تا ۵۰۰ نقطه برای هر محصول
- تشخیص تغییر قیمت، آستانه هشدار و اعلان مرورگر
- نمودار قیمت و برآورد روند با رگرسیون خطی ساده
- خروجی CSV، پوسته تیره و نصب PWA

## انتشار GitHub Pages
مخزن از طریق GitHub Actions منتشر می‌شود. در Settings → Pages، Source را روی GitHub Actions قرار دهید.

## اتصال داده زنده
نسخه وب می‌تواند به Cloudflare Worker + D1 متصل شود. API عمومی، آخرین قیمت‌ها، سلامت منابع، تاریخچه و رویدادهای بازار را بدون کلید مدیریتی می‌خواند. افزودن/ویرایش/بررسی فوری منابع به API Token نیاز دارد که فقط در sessionStorage نشست جاری مرورگر نگهداری می‌شود.

برای اتصال، راهنمای [WEB_FIRST_RELEASE_PLAN](docs/WEB_FIRST_RELEASE_PLAN.md) را دنبال کنید و گردش‌کار دستی `.github/workflows/deploy-api.yml` را پس از افزودن Secrets/Variables اجرا کنید. تا قبل از Deploy سرویس و تعریف دامنه‌های واقعی در allowlist، داشبورد داده زنده مرکزی دریافت نمی‌کند.

قیمت‌خوانی مستقیم مرورگر ممکن است به دلیل CORS محدود شود؛ Proxy اختیاری `workers/price-proxy.js` فقط HTTPS و میزبان‌های مجاز را می‌پذیرد. زمان‌بندی قابل‌اتکا در حالت بسته بودن صفحه توسط Cron Worker انجام می‌شود. اعلان مرورگر به مجوز صریح و پشتیبانی مرورگر نیاز دارد.

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
- [Web-first release plan](docs/WEB_FIRST_RELEASE_PLAN.md): web deployment, API connection, Cloudflare setup and deferred Android/iOS packaging.
- [Web 1.2 implementation report](docs/WEB_1_2_IMPLEMENTATION_REPORT.md): dashboard, API, responsive UI, test coverage and remaining live-data setup.

## R1/R2 implementation
- Server ingestion API and Cloudflare D1 schema: `workers/steel-api.js`, `workers/schema.sql`, `workers/wrangler.toml`.
- Source health states and immutable local observation ledger: `core/source-health.js`, `core/price-ledger.js`.
- Price extraction and normalization: `core/extractor.js`, `core/price-domain.js`.
- Factory / IME / free-market comparison is grouped by product key, technical specification, delivery and VAT basis, and normalized to IRR/kg.
- Run automated tests with `npm test`; GitHub Actions runs them on relevant changes.

## Important setup notes
- In the product form, use the same product key only for the same commercial/technical item across factory, IME and free market. Do not compare unlike grades, dimensions, delivery bases or VAT bases.
- Set the current USD/AED/EUR to IRR exchange rates in Settings before including foreign-currency quotes. Toman is converted as 10 IRR; tonne prices are converted to kg basis.
- The D1 backend is code-complete for the first ingestion endpoints but is not live until the repository owner provisions D1, adds the Worker secrets/host allowlist and deploys it. The browser dashboard supports central D1 sync when the Cloudflare Worker is deployed; until then it runs in local mode.
- Browser observations are stored in IndexedDB using add-only inserts; Android background observations are appended to a separate native ledger. Existing chart history is retained for backward compatibility.
- Cloudflare source parser supports JSON path, regex, a safe subset of CSS selectors (#id, .class, [data-price], [itemprop=price]) and common automatic price markers. Unsupported site layouts require a source-specific parser.
