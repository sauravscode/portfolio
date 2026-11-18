#!/usr/bin/env python3
"""Sync the owner's Instagram photos into the portfolio.

One-time setup
--------------
1. Instagram account: convert the account (https://www.instagram.com/picsxarchive/)
   to a Creator or Business account.
2. Meta app: create an app at https://developers.facebook.com/ and add the
   "Instagram API with Instagram Login" product. Grant the app the basic
   Instagram permission (instagram_business_basic).
3. Token: generate a long-lived access token for that app. Long-lived Instagram
   tokens are valid for roughly 60 days; regenerate before they expire.
4. Export the token only through the environment (it is never written to disk,
   logged, or printed):

       export IG_ACCESS_TOKEN="…"

Usage
-----
    IG_ACCESS_TOKEN=… python3 scripts/sync-instagram.py [--limit 24]

The script downloads up to --limit IMAGE posts from the official Instagram API
into photography/img/<id>.jpg, writes js/photos.js (window.PHOTOS), and prunes
local JPEGs that are no longer in the feed. VIDEO posts are skipped. It uses
only the Python standard library.

Test-only flags: --api-base http://127.0.0.1:PORT (allows http media from
127.0.0.1 only) and --out-root DIR. --dry-run fetches and reports without
writing anything.
"""

import argparse
import json
import os
import re
import struct
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlsplit
from urllib.request import Request, urlopen

SOURCE_PROFILE = "https://www.instagram.com/picsxarchive/"
DEFAULT_API_BASE = "https://graph.instagram.com"
FIELDS = (
    "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,"
    "children{media_type,media_url}"
)
TIMEOUT_SECONDS = 20
MAX_IMAGE_BYTES = 15 * 1024 * 1024
CHUNK_BYTES = 64 * 1024
USER_AGENT = "saurav-portfolio-instagram-sync/1.0"

ID_RE = re.compile(r"^[0-9A-Za-z_]{1,64}$")
JPEG_SOF_MARKERS = {0xC0, 0xC1, 0xC2}
PERMALINK_PREFIXES = ("https://www.instagram.com/", "https://instagram.com/")
REJECTED_MESSAGE = (
    "Instagram API rejected the token (expired or invalid). "
    "Generate a new long-lived token."
)


class ApiError(Exception):
    """A failure that should end the run with a specific exit code."""

    def __init__(self, message, exit_code):
        super().__init__(message)
        self.exit_code = exit_code


# ---------------------------------------------------------------------------
# Output / redaction helpers
# ---------------------------------------------------------------------------

def redact(message, token):
    """Defensive: make sure the token can never appear in any message."""
    text = str(message)
    if token:
        text = text.replace(token, "***")
    return text


def warn(message, token):
    print("warning: " + redact(message, token), file=sys.stderr)


# ---------------------------------------------------------------------------
# API access
# ---------------------------------------------------------------------------

def media_api_url(api_base, token, limit):
    query = urlencode({
        "fields": FIELDS,
        "limit": str(limit),
        "access_token": token,
    })
    return api_base.rstrip("/") + "/me/media?" + query


def api_get(url, token):
    """GET a JSON document, translating failures into ApiError."""
    try:
        request = Request(url, headers={"Accept": "application/json",
                                        "User-Agent": USER_AGENT})
        with urlopen(request, timeout=TIMEOUT_SECONDS) as response:
            body = response.read()
    except HTTPError as exc:
        if exc.code in (400, 401, 403):
            raise ApiError(REJECTED_MESSAGE, 3)
        raise ApiError(
            "Instagram API request failed (HTTP %s: %s)."
            % (exc.code, redact(getattr(exc, "reason", "") or "", token)),
            4,
        )
    except URLError as exc:
        raise ApiError(
            "Network error talking to the Instagram API: %s"
            % redact(getattr(exc, "reason", exc), token),
            4,
        )
    except (OSError, ValueError) as exc:
        raise ApiError(
            "Network error talking to the Instagram API: %s" % redact(exc, token),
            4,
        )
    except Exception as exc:  # http.client.HTTPException, etc.
        raise ApiError(
            "Network error talking to the Instagram API: %s" % redact(exc, token),
            4,
        )

    try:
        payload = json.loads(body.decode("utf-8"))
    except (UnicodeDecodeError, ValueError):
        raise ApiError("Instagram API returned a response that was not valid JSON.", 4)

    if not isinstance(payload, dict):
        raise ApiError("Instagram API returned an unexpected response.", 4)
    if "error" in payload:
        raise ApiError(REJECTED_MESSAGE, 3)
    return payload


def iter_pages(api_base, token, limit):
    """Yield each page's `data` list, following same-origin paging.next links."""
    base = urlsplit(api_base)
    allowed_origin = (base.scheme.lower(), (base.hostname or "").lower())
    url = media_api_url(api_base, token, limit)
    seen = set()

    while url:
        if url in seen:
            warn("paging.next repeated; stopping pagination.", token)
            return
        seen.add(url)

        payload = api_get(url, token)
        data = payload.get("data")
        if not isinstance(data, list):
            raise ApiError("Instagram API returned an unexpected response.", 4)
        yield data

        paging = payload.get("paging")
        next_url = paging.get("next") if isinstance(paging, dict) else None
        if not isinstance(next_url, str) or not next_url:
            return

        try:
            nxt = urlsplit(next_url)
            origin = (nxt.scheme.lower(), (nxt.hostname or "").lower())
        except ValueError:
            warn("Ignoring a malformed paging.next URL.", token)
            return
        if origin != allowed_origin:
            warn("Ignoring paging.next for a different host.", token)
            return
        url = next_url


# ---------------------------------------------------------------------------
# Media selection and download
# ---------------------------------------------------------------------------

def image_url_for(item):
    """Return the image URL for an IMAGE or CAROUSEL_ALBUM post, else None."""
    media_type = item.get("media_type")
    if media_type == "IMAGE":
        return item.get("media_url")
    if media_type == "CAROUSEL_ALBUM":
        children = item.get("children")
        if isinstance(children, dict):
            for child in children.get("data") or []:
                if isinstance(child, dict) and child.get("media_type") == "IMAGE":
                    return child.get("media_url")
    return None


def allowed_media_url(url, test_mode):
    """Allow https CDN URLs, plus http://127.0.0.1 in local test mode only."""
    if not isinstance(url, str) or not url.strip():
        return False
    try:
        parsed = urlsplit(url.strip())
    except ValueError:
        return False
    if parsed.username or parsed.password:
        return False

    scheme = parsed.scheme.lower()
    host = (parsed.hostname or "").lower().rstrip(".")
    if scheme == "https":
        return host.endswith(".cdninstagram.com") or host.endswith(".fbcdn.net")
    if test_mode and scheme == "http":
        return host == "127.0.0.1"
    return False


def jpeg_size(data):
    """(width, height) from a JPEG's SOF0/SOF1/SOF2 marker, or None."""
    if len(data) < 4 or data[0:2] != b"\xff\xd8":
        return None

    index = 2
    length = len(data)
    while index < length:
        if data[index] != 0xFF:
            index += 1
            continue
        while index < length and data[index] == 0xFF:
            index += 1
        if index >= length:
            return None
        marker = data[index]
        index += 1

        # Standalone markers carry no length field.
        if marker in (0x01, 0xD8, 0xD9) or 0xD0 <= marker <= 0xD7:
            continue
        if marker == 0xDA:  # start of scan, before any SOF: cannot measure
            return None
        if index + 2 > length:
            return None
        segment_length = struct.unpack(">H", data[index:index + 2])[0]
        if segment_length < 2 or index + segment_length > length:
            return None

        if marker in JPEG_SOF_MARKERS:
            if segment_length < 7:
                return None
            height, width = struct.unpack(">HH", data[index + 3:index + 7])
            if width <= 0 or height <= 0:
                return None
            return width, height

        index += segment_length
    return None


def fetch_jpeg(url, token):
    """Download one JPEG, returning (bytes, ratio) or None after a warning."""
    try:
        request = Request(url, headers={"Accept": "image/jpeg,image/*",
                                        "User-Agent": USER_AGENT})
        with urlopen(request, timeout=TIMEOUT_SECONDS) as response:
            chunks = []
            total = 0
            while True:
                chunk = response.read(CHUNK_BYTES)
                if not chunk:
                    break
                total += len(chunk)
                if total > MAX_IMAGE_BYTES:
                    warn("media file exceeds the 15 MB cap; skipped.", token)
                    return None
                chunks.append(chunk)
    except HTTPError as exc:
        warn("media download failed (HTTP %s); skipped." % exc.code, token)
        return None
    except URLError as exc:
        warn("media download failed (%s); skipped."
             % redact(getattr(exc, "reason", exc), token), token)
        return None
    except Exception as exc:  # includes OSError, ValueError, HTTPException
        warn("media download failed (%s); skipped." % redact(exc, token), token)
        return None

    data = b"".join(chunks)
    if not data.startswith(b"\xff\xd8"):
        warn("media file is not a JPEG; skipped.", token)
        return None

    size = jpeg_size(data)
    if size is None:
        warn("could not read JPEG dimensions; skipped.", token)
        return None
    width, height = size
    return data, round(width / height, 4)


# ---------------------------------------------------------------------------
# Feed collection
# ---------------------------------------------------------------------------

def clean_caption(value):
    """First usable line, hashtags removed, whitespace collapsed, max 80 chars."""
    if not isinstance(value, str):
        return ""
    for line in value.splitlines():
        line = re.sub(r"#\w+", " ", line)
        line = " ".join(line.split()).strip()
        if line:
            if len(line) > 80:
                return line[:79].rstrip() + "\u2026"
            return line
    return ""


def clean_permalink(value):
    if not isinstance(value, str):
        return ""
    url = value.strip()
    return url if url.startswith(PERMALINK_PREFIXES) else ""


def collect_assets(api_base, token, limit, test_mode):
    """Return (assets, videos, errors) where asset = (id, entry, image_bytes)."""
    assets = []
    videos = 0
    errors = 0
    seen_ids = set()

    for page in iter_pages(api_base, token, limit):
        for item in page:
            if len(assets) >= limit:
                break
            if not isinstance(item, dict):
                errors += 1
                warn("unexpected feed item; skipped.", token)
                continue

            media_type = item.get("media_type")
            if media_type == "VIDEO":
                videos += 1
                continue

            url = image_url_for(item)
            if not url:
                errors += 1
                warn("post has no downloadable image; skipped.", token)
                continue

            ident = item.get("id")
            if not isinstance(ident, str) or not ID_RE.match(ident):
                errors += 1
                warn("post has an invalid id; skipped.", token)
                continue
            if ident in seen_ids:
                continue
            if not allowed_media_url(url, test_mode):
                errors += 1
                warn("media host is not an allowed Instagram CDN; skipped.", token)
                continue

            fetched = fetch_jpeg(url, token)
            if fetched is None:
                errors += 1
                continue
            image_bytes, ratio = fetched

            timestamp = item.get("timestamp")
            entry = {
                "src": "img/%s.jpg" % ident,
                "ratio": ratio,
                "caption": clean_caption(item.get("caption")),
                "permalink": clean_permalink(item.get("permalink")),
                "date": timestamp.strip() if isinstance(timestamp, str) else "",
            }
            assets.append((ident, entry, image_bytes))
            seen_ids.add(ident)

        if len(assets) >= limit:
            break

    return assets, videos, errors


# ---------------------------------------------------------------------------
# Writing and pruning
# ---------------------------------------------------------------------------

def atomic_write(path, payload):
    """Write bytes via a temp file in the same directory, then os.replace."""
    path.parent.mkdir(parents=True, exist_ok=True)
    handle, temp_name = tempfile.mkstemp(prefix=".tmp-", suffix=".part",
                                         dir=str(path.parent))
    temp_path = Path(temp_name)
    try:
        with os.fdopen(handle, "wb") as stream:
            stream.write(payload)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(str(temp_path), str(path))
    except BaseException:
        try:
            temp_path.unlink()
        except OSError:
            pass
        raise


def photos_js(entries, generated_at):
    count = len(entries)
    noun = "photo" if count == 1 else "photos"
    header = (
        "/* ============================================================================\n"
        "   photos.js — GENERATED FILE. Do not edit by hand.\n"
        "   ----------------------------------------------------------------------------\n"
        "   Written by scripts/sync-instagram.py from the owner's Instagram feed\n"
        "   (%s).\n"
        "\n"
        "   Generated at %s - %d %s.\n"
        "\n"
        "   Shape: window.PHOTOS = [{ src, ratio, caption, permalink, date }]\n"
        "\n"
        "   Until the sync runs, the array is empty and js/photography.js falls back to\n"
        "   DATA.photography.photos (Cloudinary, or the PENDING UPLOAD placeholder).\n"
        "   ========================================================================== */\n"
        "\n"
        "window.PHOTOS = "
    ) % (SOURCE_PROFILE, generated_at, count, noun)
    return header + json.dumps(entries, ensure_ascii=True, indent=2) + ";\n"


def prune_stale(img_dir, keep_ids, token):
    """Delete local JPEGs whose id is no longer in the feed. Returns the count."""
    removed = 0
    if not img_dir.is_dir():
        return removed

    for path in sorted(img_dir.iterdir()):
        if not path.is_file() or path.suffix != ".jpg":
            continue
        if not ID_RE.match(path.stem):
            continue
        if path.stem in keep_ids:
            continue
        try:
            path.unlink()
            removed += 1
        except OSError as exc:
            warn("could not remove stale file %s (%s)."
                 % (path.name, redact(exc, token)), token)
    return removed


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def parse_args(argv):
    parser = argparse.ArgumentParser(
        description="Sync Instagram photos into photography/img/ and js/photos.js.",
    )
    parser.add_argument("--limit", type=int, default=24,
                        help="maximum number of image posts (1-100, default 24)")
    parser.add_argument("--api-base", default=DEFAULT_API_BASE,
                        help=argparse.SUPPRESS)
    parser.add_argument("--out-root", default=None,
                        help=argparse.SUPPRESS)
    parser.add_argument("--dry-run", action="store_true",
                        help="fetch and report, but write nothing")
    return parser.parse_args(argv)


def main(argv=None):
    args = parse_args(argv)

    if not 1 <= args.limit <= 100:
        print("error: --limit must be between 1 and 100", file=sys.stderr)
        return 2

    token = os.environ.get("IG_ACCESS_TOKEN", "").strip()
    if not token:
        print("IG_ACCESS_TOKEN is not set", file=sys.stderr)
        return 2

    api_base = args.api_base.rstrip("/")
    try:
        base = urlsplit(api_base)
    except ValueError:
        base = None
    if base is None or base.scheme.lower() not in ("http", "https") or not base.hostname:
        print("error: --api-base must be an http(s) URL", file=sys.stderr)
        return 2
    test_mode = (base.hostname or "").lower() == "127.0.0.1"

    out_root = Path(args.out_root).resolve() if args.out_root \
        else Path(__file__).resolve().parents[1]

    try:
        assets, videos, errors = collect_assets(
            api_base, token, args.limit, test_mode
        )
    except ApiError as exc:
        print(redact(str(exc), token), file=sys.stderr)
        return exc.exit_code

    if not assets:
        warn("no images collected; photos.js and photography/img were left untouched.",
             token)
        return 5

    entries = [entry for _ident, entry, _data in assets]

    if args.dry_run:
        print("Synced %d photos (skipped %d videos, %d errors). Pruned 0 stale files."
              % (len(entries), videos, errors))
        print("Dry run: no files were written.")
        return 0

    img_dir = out_root / "photography" / "img"
    try:
        for ident, _entry, image_bytes in assets:
            atomic_write(img_dir / ("%s.jpg" % ident), image_bytes)

        generated_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        atomic_write(out_root / "js" / "photos.js",
                     photos_js(entries, generated_at).encode("utf-8"))
    except OSError as exc:
        print(redact("error: could not write output: %s" % exc, token),
              file=sys.stderr)
        return 4

    keep_ids = {ident for ident, _entry, _data in assets}
    removed = prune_stale(img_dir, keep_ids, token)

    print("Synced %d photos (skipped %d videos, %d errors). Pruned %d stale files."
          % (len(entries), videos, errors, removed))
    return 0


if __name__ == "__main__":
    sys.exit(main())
