# Fooladban 1.6 — audit, fixes and upgrades

## Fixed
- TOPSIS panel overwrote the whole trade-comparison panel (`fbTradeComparison`); price lists/cost summary stopped refreshing after each price update. TOPSIS now mounts in its own `#fbTopsisPanel`.
- `decision-tools.js` loaded before the layers existed (multi-product chart and recommender never mounted) → loaded last.
- Cargo checkboxes all had `data-cargo-id="1"`; catalog ids never matched saved products (UUID ids) → `findProduct()` resolves by id, catalog id or product key.
- Route lookup wiped the distance on every blur and had no timeout/cache → cached, de-duplicated, 10 s timeout.
- Appearance settings (light/dark/system, accent, background, icon colour) were built but never mounted → new «ظاهر برنامه» card.
- Editing a product saved fetch results to a detached object; `checkAll` could stay locked forever; no fetch timeouts; NaN/0 prices produced Infinity alerts; unescaped ids in innerHTML; unguarded localStorage writes; unbounded events; CSV formula injection; deleted server products re-appeared.
- Worker: CSS-selector parser never matched nested elements; cron drift/overlap; non-atomic writes; 500 for client errors; port/IP-literal/`www` host handling; non-constant-time token compare; CORS trailing slash; proxy served upstream HTML on Worker origin.
- Android: assets served via WebViewAssetLoader (https origin → CORS works, service worker works), external links leave the WebView, bridge only for the app origin, edge-to-edge insets, predictive-back dispatcher, no config-change reload, `allowBackup=false`, unused boot permission removed, notification tap opens app, de-duplicated alerts, state merge instead of overwrite, bounded response/ledger/history, skipped API-managed products, legacy mipmap PNG icons for API 23–25.
- Workflows: icons were never copied to Pages/APK; path filters; PR test paths.
- Service worker: precache list, offline navigation fallback, `notificationclick`.

## Added
- `core/trader-toolkit.js`: market pulse, steel weight/cost calculator, conversion-margin calculator.
- New icon set (PWA 192/512 + maskable, apple-touch, favicon, Android adaptive + monochrome + legacy), vector `icon.svg`.

## Deployment note
Add `https://appassets.androidplatform.net` to `FOOLADB_APP_ORIGIN` (comma-separated) so the Android app can reach the central API.
