import re, subprocess, tempfile
from pathlib import Path
html = Path("index.html").read_text(encoding="utf-8")
scripts = re.findall(r"<script(?:\s[^>]*)?>([\s\S]*?)</script>", html, re.I)
inline = [x for x in scripts if x.strip()]
if not inline:
    raise SystemExit("No inline application script found")
for source in inline:
    with tempfile.NamedTemporaryFile("w", suffix=".js", encoding="utf-8") as f:
        f.write(source); f.flush()
        subprocess.run(["node", "--check", f.name], check=True)
print("PWA inline JavaScript syntax check passed")
