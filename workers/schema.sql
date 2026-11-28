PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS sources (
 id TEXT PRIMARY KEY, product_key TEXT NOT NULL, product_name TEXT NOT NULL,
 specification TEXT NOT NULL DEFAULT '', source_kind TEXT NOT NULL CHECK(source_kind IN ('factory','ime','free_market','export','other')),
 market TEXT NOT NULL DEFAULT 'Iran', url TEXT NOT NULL, parser_mode TEXT NOT NULL DEFAULT 'auto',
 selector TEXT, regex TEXT, json_path TEXT, currency TEXT NOT NULL DEFAULT 'IRR',
 measure_unit TEXT NOT NULL DEFAULT 'kg', delivery TEXT NOT NULL DEFAULT '',
 tax_basis TEXT NOT NULL DEFAULT '', interval_minutes INTEGER NOT NULL DEFAULT 15,
 enabled INTEGER NOT NULL DEFAULT 1, last_attempt_at INTEGER, last_success_at INTEGER,
 last_error TEXT, consecutive_failures INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sources_enabled ON sources(enabled);
CREATE TABLE IF NOT EXISTS observations (
 id TEXT PRIMARY KEY, source_id TEXT NOT NULL REFERENCES sources(id),
 product_key TEXT NOT NULL, source_kind TEXT NOT NULL, raw_price REAL NOT NULL,
 currency TEXT NOT NULL, measure_unit TEXT NOT NULL, irr_per_kg REAL,
 observed_at INTEGER NOT NULL, recorded_at INTEGER NOT NULL, response_hash TEXT
);
CREATE INDEX IF NOT EXISTS idx_obs_product_time ON observations(product_key,observed_at);
CREATE INDEX IF NOT EXISTS idx_obs_source_time ON observations(source_id,observed_at);
CREATE TRIGGER IF NOT EXISTS observations_no_update BEFORE UPDATE ON observations BEGIN SELECT RAISE(ABORT,'observations are append-only'); END;
CREATE TRIGGER IF NOT EXISTS observations_no_delete BEFORE DELETE ON observations BEGIN SELECT RAISE(ABORT,'observations are append-only'); END;
CREATE TABLE IF NOT EXISTS market_events(id TEXT PRIMARY KEY,product_key TEXT NOT NULL,source_id TEXT NOT NULL,old_price REAL,new_price REAL NOT NULL,change_pct REAL,created_at INTEGER NOT NULL,FOREIGN KEY(source_id) REFERENCES sources(id));
CREATE INDEX IF NOT EXISTS idx_events_time ON market_events(created_at);
