# فولادبان | Fooladban

سامانه وب/PWA واکنش‌گرا برای ارزیابی تفکیک‌شده قیمت محصولات زنجیره فولاد در بازار ایران و بازارهای بین‌المللی.

**نسخه وب منتشرشده:** https://nrazaniemail-ship-it.github.io/steelmarket/

## امکانات نسخه وب ۱.۴
- داشبورد بازار با شاخص‌های منابع فعال، میانگین قیمت هم‌مبنا و دامنه اختلاف
- مدیریت محصول/منبع: افزودن، ویرایش، غیرفعال‌سازی و بررسی فوری قیمت
- پنل سلامت منابع با وضعیت سالم، ناپایدار، کهنه، خطادار و غیرفعال
- اتصال به API مرکزی و همگام‌سازی داده‌ها، رویدادها و تاریخچه D1
- نمودار قیمت با میانگین متحرک و برآورد خطی
- ارزیابی مستقل بازار ایران و بازار جهانی؛ جلوگیری از ادغام قیمت‌های دو بازار در یک مقایسه\n- فهرست انتخابی محصولات زنجیره بالادست، شمش‌ها، مقاطع طولی و مقاطع تخت برای داشبورد\n- مدیریت مراجع قیمت با فعال/غیرفعال‌سازی، افزودن/حذف و اولویت‌بندی مستقل در هر بازار\n- مراجع پیش‌فرض ایران: بورس کالای ایران، آهن آنلاین، مرکز آهن، پیوان، آیرومارت و آهن پرایس؛ مرجع جهانی پیش‌فرض: Trading Economics\n- دسته‌بندی بازارهای جهانی/منطقه‌ای: شاخص‌های بین‌المللی (Trading Economics، Argus و LME)، چین (Mysteel و SHFE)، اروپا (MEPS)، آمریکای شمالی (CRU و CME)، ترکیه (SteelOrbis)، هند (BigMint) و خاورمیانه\n- مقایسه کارخانه، بورس کالا و بازار آزاد با تبدیل به ریال/کیلوگرم
- لایه‌بندی مستقل داشبورد، محصولات، مراجع قیمت، تحلیل بازار و تنظیمات\n- لایه تنظیمات مستقل با کارت‌های جمع‌شونده: ظاهر برنامه، تنظیمات پایش/API، قالب نمایش، ترتیب لایه‌ها، دفترچه راهنما، خروجی و درباره برنامه\n- شخصی‌سازی پوسته روشن/تیره/سیستم، رنگ تأکیدی، زمینه صفحه و رنگ آیکون‌ها؛ ذخیره تنظیمات روی دستگاه\n- جابه‌جایی ترتیب لایه‌ها با فلش‌های بالا/پایین و ذخیره ترتیب انتخاب‌شده\n- ناوبری واکنش‌گرا: نوار افقی در نمایشگر بزرگ و نوار ثابت پایین در موبایل

## معماری لایه‌ها و تنظیمات\n- `core/app-shell.js` لایه‌های مستقل و ناوبری برنامه را می‌سازد؛ ماژول‌ها و شناسه‌های فرم موجود حفظ شده‌اند تا منطق ثبت قیمت و API بدون تغییر مسیر کار کنند.\n- تنظیمات رابط در `localStorage` با کلید `fooladban.ui.v1` ذخیره می‌شوند و تنظیمات بازار/محصول در کلید مستقل `fooladban.market-config.v1` باقی می‌مانند.\n- کارت‌های تنظیمات به‌صورت مستقل باز و بسته می‌شوند؛ ترتیب لایه‌ها و حالت نمایش نیز پایدار می‌مانند.\n\n## منطق ارزیابی بازار\n- قیمت‌های ایران و جهان در گروه‌های مقایسه جداگانه نگهداری می‌شوند؛ تبدیل ارز صرفاً برای نمایش واحد هم‌مبناست و به معنی یکی‌بودن بازارها نیست.\n- اولویت منبع به‌صورت ترتیب مرجع معتبر در همان بازار اعمال می‌شود؛ اختلاف قیمت منابع همچنان جداگانه قابل مشاهده است و میانگین‌گیری کورکورانه انجام نمی‌شود.\n- کاتالوگ منابع و انتخاب محصولات در مرورگر کاربر ذخیره می‌شود. منابع منطقه‌ای که هنوز URL اختصاصی و parser ندارند، غیرفعال/پیشنهادی هستند و قیمت زنده محسوب نمی‌شوند.\n\n## امکانات پایه
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
- [Web 1.3 market assessment report](docs/WEB_1_3_MARKET_ASSESSMENT_REPORT.md): separate Iran/global price benchmarks, regional reference groups, source priorities and selectable steel products.

## R1/R2 implementation
- Server ingestion API and Cloudflare D1 schema: `workers/steel-api.js`, `workers/schema.sql`, `workers/wrangler.toml`.
- Source health states and immutable local observation ledger: `core/source-health.js`, `core/price-ledger.js`.
- Price extraction and normalization: `core/extractor.js`, `core/price-domain.js`.
- Factory / IME / free-market comparison is grouped by product key, technical specification, delivery and VAT basis, and normalized to IRR/kg.
- Run automated tests with `npm test`; GitHub Actions runs them on relevant changes.

## Important setup notes
- In the product form, use the same product key only for the same commercial/technical item across factory, IME and free market. Do not compare unlike grades, dimensions, delivery bases or VAT bases.
- Set current USD/AED/EUR/CNY/INR/TRY/GBP to IRR exchange rates in Settings before including foreign-currency quotes. The central Worker accepts optional secrets FOOLADB_CNY_IRR, FOOLADB_INR_IRR, FOOLADB_TRY_IRR and FOOLADB_GBP_IRR in addition to USD/AED/EUR. Toman is converted as 10 IRR; tonne prices are converted to kg basis.
- The D1 backend is code-complete for the first ingestion endpoints but is not live until the repository owner provisions D1, adds the Worker secrets/host allowlist and deploys it. The browser dashboard supports central D1 sync when the Cloudflare Worker is deployed; until then it runs in local mode.
- Browser observations are stored in IndexedDB using add-only inserts; Android background observations are appended to a separate native ledger. Existing chart history is retained for backward compatibility.
- Cloudflare source parser supports JSON path, regex, a safe subset of CSS selectors (#id, .class, [data-price], [itemprop=price]) and common automatic price markers. Unsupported site layouts require a source-specific parser.
