import subprocess, tempfile
from pathlib import Path
html = Path("index.html").read_text(encoding="utf-8")
start = html.find("<script>")
if start < 0:
    raise SystemExit("No inline application script found")
start += len("<script>")
end = html.find("</script>", start)
if end < 0:
    raise SystemExit("Inline application script is not closed")
source = html[start:end]
if not source.strip():
    raise SystemExit("Inline application script is empty")
with tempfile.NamedTemporaryFile("w", suffix=".js", encoding="utf-8") as f:
    f.write(source); f.flush()
    subprocess.run(["node", "--check", f.name], check=True)
print("PWA inline JavaScript syntax check passed")
