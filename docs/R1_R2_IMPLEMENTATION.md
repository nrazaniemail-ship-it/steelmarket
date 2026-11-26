# Fooladban R1/R2 implementation
## R1 — ingestion, source health and append-only observations
- workers/steel-api.js is a Cloudflare Worker API with authenticated source registration, source listing, observations and comparison endpoints.
- Scheduled ingestion runs every 15 minutes. Sources are HTTPS-only, host-allowlisted, redirect-validated, response-size limited and content-type checked.
- workers/schema.sql creates source registry, immutable observation ledger and market event tables. SQLite triggers reject UPDATE/DELETE on observations.
- core/source-health.js distinguishes pending, healthy, degraded, stale, failed and disabled sources.
- core/price-ledger.js stores browser observations with IndexedDB add-only semantics and a local fallback.
- core/extractor.js contains testable numeric, regex and JSON extraction. Browser CSS extraction uses DOMParser.
- Android WorkManager remains periodic; Android may defer work under battery/background policies.

## R2 — normalized cross-market comparison
- core/price-domain.js normalizes prices to IRR/kg and groups only compatible product/specification/delivery/tax bases.
- Supported currencies: IRR, IRT (toman), USD, AED, EUR. Non-IRR currencies require explicit FX rates; no exchange rate is invented.
- Supported measures: kg and metric tonne. Factory, IME and free-market observations retain their source kind.
- Comparison output reports lowest/highest quote and spread within a compatible product group.

## Deployment requirements
1. Create a Cloudflare D1 database and run: wrangler d1 execute fooladban --file workers/schema.sql
2. Set DB binding and database_id in workers/wrangler.toml.
3. Set secrets API_TOKEN, USD_IRR, AED_IRR, EUR_IRR; set APP_ORIGIN and ALLOWED_HOSTS to exact trusted origins/hosts.
4. Deploy the D1 API using workers/wrangler.toml. Deploy the optional PWA CORS proxy separately with workers/wrangler.proxy.toml; it has its own exact host allowlist and APP_ORIGIN.
5. Register source URLs that the operator is authorized to access. The Worker does not bypass login, paywalls, CAPTCHA, or robots restrictions.

## Known boundaries
- Android APK build and Node tests can be validated in GitHub Actions. Cloudflare D1 provisioning and live market-source credentials require account-owner access.
- PWA watchlist remains local. D1 API is ready for server-backed sync, but user authentication and tenant isolation are required before multi-user exposure.
