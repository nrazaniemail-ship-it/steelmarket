import sqlite3
from pathlib import Path

schema = Path("workers/schema.sql").read_text(encoding="utf-8")
db = sqlite3.connect(":memory:")
db.executescript(schema)
db.execute("INSERT INTO sources(id,product_key,product_name,source_kind,url,created_at) VALUES(?,?,?,?,?,?)",
           ("s1", "rebar-16", "میلگرد ۱۶", "factory", "https://prices.example.com", 1))
db.execute("INSERT INTO observations(id,source_id,product_key,source_kind,raw_price,currency,measure_unit,observed_at,recorded_at) VALUES(?,?,?,?,?,?,?,?,?)",
           ("o1", "s1", "rebar-16", "factory", 30000, "IRT", "kg", 1, 1))
for statement in ("UPDATE observations SET raw_price=1 WHERE id='o1'",
                  "DELETE FROM observations WHERE id='o1'"):
    try:
        db.execute(statement)
        raise AssertionError("Observation ledger allowed mutation: " + statement)
    except sqlite3.IntegrityError as exc:
        assert "append-only" in str(exc)
assert db.execute("SELECT COUNT(*) FROM observations").fetchone()[0] == 1
print("D1 schema test passed: observation rows reject UPDATE and DELETE")
