#!/usr/bin/env python3
"""
Greenswirl.ca Blog Importer
Reads greenswirl_scraped.json → POSTs to Railway backend.

Usage:
  python scripts/greenswirl_import.py           # normal import
  python scripts/greenswirl_import.py --clear   # delete all existing first, then import
  python scripts/greenswirl_import.py --dry-run # preview only
"""

import json
import sys
import time
import os
import argparse

try:
    import requests
except ImportError:
    print("Missing dep. Run:  pip install requests")
    sys.exit(1)

API_BASE = "https://portfolio-and-blog-production.up.railway.app/api/blog"
IN_FILE  = os.path.join(os.path.dirname(__file__), "greenswirl_scraped.json")
DELAY    = 0.5

# ── Warmup ────────────────────────────────────────────────────────────────────
def warmup():
    """
    Wait until MongoDB is actually ready.
    Railway cold-starts in ~15s; MongoDB buffering clears shortly after.
    - Exception (ConnectionError/Timeout) = server still sleeping → retry
    - HTTP non-200 = server up, MongoDB still connecting → wait 8s, retry
    - HTTP 200 = fully ready
    """
    print("  Contacting backend (may take 30–60s if Railway is cold) …")
    for attempt in range(25):
        try:
            r = requests.get(f"{API_BASE}/posts", timeout=45)
            if r.status_code == 200:
                try:
                    data = r.json() if isinstance(r.json(), list) else []
                except Exception:
                    data = []
                print(f"  MongoDB ready — {len(data)} existing post(s)")
                time.sleep(2)
                return data
            else:
                # Server is alive but MongoDB still buffering
                print(f"  Server up (HTTP {r.status_code}) — waiting for MongoDB … ({attempt+1})")
                time.sleep(8)
        except requests.exceptions.ConnectionError:
            print(f"  Railway sleeping — waking it up … ({attempt+1})")
            time.sleep(6)
        except requests.exceptions.Timeout:
            print(f"  Request timed out — retrying … ({attempt+1})")
            time.sleep(4)
        except Exception as e:
            print(f"  {e} ({attempt+1})")
            time.sleep(5)
    print("  ⚠  Backend unresponsive after many attempts — aborting.")
    sys.exit(1)

# ── Clear ─────────────────────────────────────────────────────────────────────
def clear_all():
    print("\n  Deleting all existing posts …")
    existing = warmup()
    for p in existing:
        pid = p.get("id")
        try:
            r = requests.delete(f"{API_BASE}/posts/{pid}", timeout=15)
            print(f"    {'✓' if r.status_code == 200 else '✗ '+str(r.status_code)}  {pid}")
        except Exception as e:
            print(f"    ✗  {e}")
        time.sleep(0.2)

    print("  Deleting all existing info pages …")
    try:
        r = requests.get(f"{API_BASE}/info", timeout=30)
        pages = r.json() if r.status_code == 200 and isinstance(r.json(), list) else []
    except Exception:
        pages = []
    for p in pages:
        pid = p.get("id")
        try:
            r = requests.delete(f"{API_BASE}/info/{pid}", timeout=15)
            print(f"    {'✓' if r.status_code == 200 else '✗ '+str(r.status_code)}  {pid}")
        except Exception as e:
            print(f"    ✗  {e}")
        time.sleep(0.2)
    print("  Clear done.\n")

# ── POST with retry ───────────────────────────────────────────────────────────
def is_db_error(response_text):
    return "buffering timed out" in response_text or "MongoError" in response_text

def post_item(endpoint, payload, dry_run=False, retries=5):
    url = f"{API_BASE}/{endpoint}"
    if dry_run:
        label = payload.get("title") or payload.get("name", "?")
        print(f"    [dry-run] → {label!r}")
        return True
    for attempt in range(retries):
        try:
            r = requests.post(url, json=payload, timeout=45)
            if r.status_code in (200, 201):
                print(f"    ✓  {r.json().get('id','?')}")
                return True
            elif is_db_error(r.text) or r.status_code in (500, 503):
                wait = 10 * (attempt + 1)
                print(f"    DB not ready — retry in {wait}s (attempt {attempt+1}/{retries})")
                time.sleep(wait)
            else:
                print(f"    ✗  HTTP {r.status_code}: {r.text[:120]}")
                return False
        except requests.exceptions.Timeout:
            wait = 10 * (attempt + 1)
            print(f"    Timeout — retry in {wait}s (attempt {attempt+1}/{retries})")
            time.sleep(wait)
        except Exception as e:
            print(f"    ✗  {e} (attempt {attempt+1})")
            time.sleep(5)
    print(f"    ✗  Gave up after {retries} attempts")
    return False

# ── Importers ─────────────────────────────────────────────────────────────────
def import_posts(posts, dry_run):
    print(f"Importing {len(posts)} posts …")
    ok = fail = 0
    for i, p in enumerate(posts):
        title = p.get("title") or "Untitled"
        print(f"  [{i+1:03d}/{len(posts)}] {title[:65]}")
        payload = {
            "title"  : title,
            "content": p.get("content") or f'<p>(<a href="{p.get("wayback_url","")}">View on Wayback Machine</a>)</p>',
        }
        if p.get("date"):
            payload["date"] = p["date"]
        if post_item("posts", payload, dry_run):
            ok += 1
        else:
            fail += 1
        time.sleep(DELAY)
    return ok, fail

def import_pages(pages, dry_run):
    print(f"\nImporting {len(pages)} info pages …")
    ok = fail = 0
    for i, p in enumerate(pages):
        name = p.get("name") or "Info Page"
        print(f"  [{i+1}/{len(pages)}] {name[:65]}")
        payload = {
            "name": name,
            "body": p.get("body") or f'<p>(<a href="{p.get("wayback_url","")}">View on Wayback Machine</a>)</p>',
        }
        if post_item("info", payload, dry_run):
            ok += 1
        else:
            fail += 1
        time.sleep(DELAY)
    return ok, fail

# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--clear",   action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    print("═" * 60)
    print("  Greenswirl.ca Blog Importer")
    if args.dry_run:
        print("  *** DRY RUN — nothing will be sent ***")
    print("═" * 60)

    if not os.path.exists(IN_FILE):
        print(f"\nError: {IN_FILE} not found. Run the scraper first.")
        sys.exit(1)

    with open(IN_FILE, encoding="utf-8") as f:
        data = json.load(f)

    posts = data.get("posts", [])
    pages = data.get("info_pages", [])
    print(f"\nLoaded: {len(posts)} posts, {len(pages)} info pages")
    print(f"Target: {API_BASE}\n")

    if not posts and not pages:
        print("Nothing to import.")
        sys.exit(0)

    if not args.dry_run:
        if args.clear:
            print("⚠  --clear will DELETE all existing blog content first.")
        yn = input("Proceed? (y/N): ").strip().lower()
        if yn != "y":
            print("Aborted.")
            sys.exit(0)

        if args.clear:
            clear_all()

        # Final warmup before bulk insert — must confirm 200 before starting
        warmup()

    post_ok, post_fail = import_posts(posts, args.dry_run)
    page_ok, page_fail = import_pages(pages, args.dry_run)

    print("\n" + "═" * 60)
    print(f"  Posts      : {post_ok} created, {post_fail} failed")
    print(f"  Info pages : {page_ok} created, {page_fail} failed")
    if post_fail + page_fail:
        print("  ⚠  Re-run without --clear to retry failures only")
    print("═" * 60)

if __name__ == "__main__":
    main()
