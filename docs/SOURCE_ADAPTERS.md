# Fooladban source adapters

This release adds a conservative source-adapter layer. It identifies known domains and attempts structured price extraction; it does not claim that every source is fully integrated.

## Current support matrix

| Source | Current behavior | Important limitation |
|---|---|---|
| Iran Mercantile Exchange (IME) | Domain recognized; generic structured extraction only | Official offers and transaction reports must be parsed separately. Base offer price is not the same as executed transaction price. No verified IME feed is enabled yet. |
| AhanOnline | Product/Offer JSON-LD, itemprop and OpenGraph price extraction | Requires a direct product page. A site search or homepage is not a product quote. |
| Markazeahan | Same conservative structured extraction | Product-specific selectors/API have not yet been validated. |
| Iromart | Same conservative structured extraction | Dynamic pages may not expose a server-readable price. |
| Pivan | Same conservative structured extraction | Direct product page and specification match required. |
| AhanPrice | Same conservative structured extraction | Price table/date/unit need source-specific validation. |
| Trading Economics | Product catalogue can map selected keys to benchmark pages; structured/meta price extraction attempted | A benchmark/CFD is not necessarily a physical transaction price. Some catalogue items map only to a broad steel benchmark; do not treat them as exact product equivalents. |

## Safety rules

- Known sources do not fall back to a loose text-number search when structured extraction fails. They return `adapter_price_not_found`.
- A successful parse is not sufficient by itself to establish product comparability. Currency, unit, tax basis, delivery terms, grade, size and timestamp must still be checked.
- The current parser does not discover domestic product URLs automatically. A direct product URL is still needed for those sites.
- No source has been marked production-verified by a successful fetch from the deployed Cloudflare Worker in this release.
- Central ingestion still depends on the user's Cloudflare D1/Worker setup and approved host allowlist.

## Next integration work

1. Validate each source's public product pages and robots/terms/access constraints.
2. Build and test dedicated adapters for IME offers/transactions and each private site's actual HTML/API shape.
3. Add product search/discovery only where the source exposes a stable, permitted search interface.
4. Add fixtures for representative product pages and regression tests for price, currency, unit, timestamp and tax basis.
5. Mark a source as live only after a successful deployed fetch and persisted observation are verified.
