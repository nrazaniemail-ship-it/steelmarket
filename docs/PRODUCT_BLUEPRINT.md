# Fooladban — Product Blueprint and Architecture
Version: 2.0 design baseline
Date: 2026-11-26

## Product promise
A personal and professional steel-market intelligence workspace that watches user-selected sources, preserves auditable price observations, compares like-for-like products across Iran and MENA, explains movements and presents calibrated scenarios.

## Personas
- Steel producer / mill: input cost, competitor quotes, selling price and margin.
- Procurement manager: buy timing, supplier/grade/size comparison, landed cost.
- Trader / exporter: Iran-vs-region parity, FX, freight, duties, Incoterms and destination premiums.
- Analyst / executive: market breadth, value-chain spreads, risk, forecast scenarios and source reliability.

## Navigation / module order
1. Market Pulse — market breadth, largest moves, stale feeds, top alerts.
2. Watchlists — personal portfolios grouped by chain, geography, product or business purpose.
3. Price Explorer — normalized product page, source quotes, history, comparison and export.
4. Alerts Center — percentage/absolute/threshold/cross-source/divergence rules, quiet hours and escalation.
5. Regional Monitor — Iran, Turkey, UAE, Saudi Arabia, Oman, Qatar, Iraq and wider MENA.
6. Value Chain — ore, concentrate, pellets, DRI/HBI, scrap, pig iron, billet/bloom/slab, HRC/CRC/HDG/plate, rebar, wire rod, sections, pipe/tube and ferroalloys.
7. Market Drivers — FX, energy, freight, coking coal, iron ore, scrap, China futures, IME, production, trade policy and news.
8. Forecast Lab — 1-week, 1-month, 3-month and 12-month scenarios with confidence bands and backtests.
9. Source Manager — URL registration, parser, schedule, source health, terms/robots, credentials and provenance.
10. Reports & Export — CSV/XLSX/PDF, scheduled digest and shareable snapshots.
11. Settings & Integrations — locale, units, notification routing, API, cloud sync and subscription.

## Core data model
- Source: id, canonical_url, host, market, parser_type, selector/json_path/regex, auth_ref, terms_reviewed, allowed_schedule, last_success_at, last_attempt_at, status, error_count, latency_ms.
- Instrument: id, canonical_name, product_family, grade, dimensions, standard, mill, region, currency, quote_unit, base_unit, vat_basis, delivery_basis, incoterm, location.
- Observation: source_id, instrument_id, observed_price, currency, unit, quote_time, fetched_at, source_published_at, raw_value, normalized_value, status, raw_payload_hash, parser_version.
- FXSnapshot: pair, rate, observed_at, provider.
- AlertRule: instrument/watchlist, condition, threshold, direction, minimum_move, cooldown, quiet_hours, channels, enabled.
- Forecast: instrument_id, model_version, horizon, point_estimate, lower/upper bands, probability, generated_at, feature_snapshot, backtest_metrics.
- Event: observation references, price delta, alert rule, sent_at, delivery result.
- AuditLog: actor, action, timestamp, before/after reference.

## Data integrity rules
- Never overwrite a source observation; append immutable observations.
- Preserve original value, unit, currency, timestamp and source URL.
- Normalize only when grade/specification, unit, currency, VAT and delivery basis are known. Otherwise show “not comparable”.
- Never silently mix Toman and Rial, kg and tonne, domestic and export, ex-works and CFR/CIF.
- Display fetched time and source publication time separately.
- Label stale values and failed sources; never present last-known as live.
- Dedupe repeated observations and detect parser drift / suspicious outliers.
- Preserve source attribution and respect terms of service, robots policies, rate limits, copyright and data licensing. Do not bypass logins, paywalls, CAPTCHAs or technical access controls.

## Source quality and freshness
Each source gets a transparent health state:
- Healthy: recent successful fetch and parser validation.
- Delayed: source update cadence has not yet elapsed.
- Stale: expected update window exceeded.
- Failed: repeated fetch/parser failures.
- Needs review: price changed implausibly, page structure changed or extracted field is ambiguous.

A source reliability score should combine freshness, parser stability, value plausibility and cross-source corroboration. It must not be marketed as a probability that the quoted price is true unless calibrated against ground truth.

## Forecast design
Phase 1: robust baselines (naive last value, moving average, exponential smoothing, trend regression).
Phase 2: time-series models by product/market with seasonality and volatility, plus external drivers (FX, iron ore, scrap, energy, freight, China futures, IME, inventory/news).
Phase 3: probabilistic scenarios, model ensemble and regime detection.
Every forecast must show horizon, timestamp, model, training window, uncertainty interval, backtest MAE/MAPE/sMAPE, sample size and a baseline comparison. Use rolling-origin backtests; avoid random train/test splits for time series. Suppress forecasts where data is sparse or source quality is low. No deterministic “buy/sell” promise.

## Alert design
- Any change / absolute amount / percentage change.
- Crosses above/below a target price.
- Daily/weekly high-low and volatility spike.
- Cross-source spread or divergence.
- Price freshness/source outage.
- Value-chain spread / estimated conversion margin.
- Quiet hours, cooldown, aggregation and priority levels.
- Android notification channels: critical, price movement, digest, source health.
- Delivery history and retry state.

## Technical architecture
- Android Kotlin shell: WorkManager for periodic minimum-15-minute checks, notification channels, deep links and battery-optimization guidance.
- PWA client: responsive dashboard, charts, watchlists and offline read cache.
- Backend API: authentication, source registry, parser registry, observations, alerts, forecasts and exports.
- Scheduler/queue: per-source cadence, concurrency limits, retries with exponential backoff and jitter.
- Fetch/parser workers: isolated adapters (HTML, JSON, CSV, RSS/API) with strict allowlists, timeouts, payload limits and parser tests.
- Database: PostgreSQL for durable observations and audit; object storage for permitted snapshots; Redis/queue for jobs.
- Push: FCM for Android and Web Push for PWA. Mobile periodic work is fallback, not a substitute for server scheduling.
- Analytics: separate forecasting service and reproducible model registry.
- Observability: source uptime, parser success, fetch latency, alert delivery, job backlog and data-quality dashboards.

## Release roadmap
### R1 — dependable watchlist
Fix current app correctness; robust parser tests; source status; per-product schedule; dedupe; immutable history; data export; Android notification testing.
### R2 — professional comparison
Instrument specifications; normalized units/currency; mill/product comparison; source confidence/freshness; multi-market views.
### R3 — market intelligence
Market breadth, IME data, FX/energy/freight drivers, news and value-chain spreads.
### R4 — forecast lab
Baselines, backtesting, confidence intervals, scenario comparison and explainability.
### R5 — enterprise
Cloud sync, user roles, shared watchlists, API, scheduled reports, licensed benchmark feeds and audit controls.

## Definition of done
A release is not complete because code was committed. It must pass automated build, unit/parser tests, Android installation, notification tests with app closed, data persistence/restart tests, stale-source tests, duplicate-alert tests and documented deployment checks.
