"""Check that each portfolio route renders its JS-generated content in local Chrome."""

import os
import shutil
import subprocess
import tempfile
import threading
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CHROME = (os.environ.get("CHROME_BIN") or shutil.which("google-chrome")
          or shutil.which("chromium") or "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")
PAGES = {"/": 'class="hero-name', "/photography/": 'class="page-sub-link',
         "/about/": 'class="about-text'}


def main():
    handler = partial(SimpleHTTPRequestHandler, directory=str(ROOT))
    with ThreadingHTTPServer(("127.0.0.1", 0), handler) as server, tempfile.TemporaryDirectory() as profile:
        threading.Thread(target=server.serve_forever, daemon=True).start()
        try:
            for route, marker in PAGES.items():
                url = f"http://127.0.0.1:{server.server_port}{route}"
                page = subprocess.run(
                    [CHROME, "--headless", "--disable-background-networking",
                     "--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1",
                     f"--user-data-dir={profile}", "--dump-dom", url],
                    capture_output=True, text=True, timeout=40, check=True,
                )
                if marker not in page.stdout:
                    raise SystemExit(f"FAIL {route} missing rendered element {marker}")
                print(f"PASS {route}", flush=True)
        finally:
            server.shutdown()


if __name__ == "__main__":
    main()
