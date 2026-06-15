#!/usr/bin/env python3
"""
Greenswirl Date Fixer
Re-fetches each archived post, extracts the original date from the full HTML,
then PUTs the correct date to the Railway API.

Usage:
  python scripts/greenswirl_fix_dates.py
"""

import json
import re
import time
import os
import sys
from datetime import datetime

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("Missing deps. Run:  pip install requests beautifulsoup4")
    sys.exit(1)

API_BASE = "https://portfolio-and-blog-production.up.railway.app/api/blog"
IN_FILE  = os.path.join(os.path.dirname(__file__), "greenswirl_scraped.json")
DELAY    = 1.5

session = requests.Session()
session.headers["User-Agent"] = "GreenSwirlDateFixer/1.0 (myklove@gmail.com)"

# ── Date extraction ───────────────────────────────────────────────────────────
# Broad CSS selectors — cast a wide net
DATE_SELS = [
    ".postmetadata", "p.postmetadata", "div.postmetadata",
    ".entry-date", ".post-date", ".published", ".date",
    "abbr.published", "time", "time[datetime]",
    ".entry-meta", ".post-meta", ".postinfo",
    "small", ".meta", "#date", ".timestamp",
]

# Regex: finds "Month DD, YYYY" or "Month YYYY" or "DD Month YYYY" anywhere in text
DATE_RE = re.compile(
    r'\b(January|February|March|April|May|June|July|August|'
    r'September|October|November|December)'
    r'[\s,]+(\d{1,2})?[\s,]+(\d{4})\b'
    r'|\b(\d{1,2})\s+'
    r'(January|February|March|April|May|June|July|August|'
    r'September|October|November|December)\s+(\d{4})\b',
    re.IGNORECASE
)

def fetch(url, retries=3):
    for attempt in range(retries):
        time.sleep(DELAY)
        try:
            r = session.get(url, timeout=30)
            if r.status_code == 200:
                return r.text
            print(f"    HTTP {r.status_code} (attempt {attempt+1})")
        except Exception as e:
            print(f"    Error: {e} (attempt {attempt+1})")
        time.sleep(DELAY * (attempt + 1))
    return None

def extract_date(html):
    soup = BeautifulSoup(html, "html.parser")

    # Remove Wayback toolbar noise
    for sel in ["#wm-ipp-base", "#wm-ipp"]:
        for el in soup.select(sel):
            el.decompose()

    # 1. Try CSS selectors first
    for sel in DATE_SELS:
        el = soup.select_one(sel)
        if el:
            text = el.get("datetime") or el.get("title") or el.get_text(" ", strip=True)
            m = DATE_RE.search(text)
            if m:
                return m.group(0).strip()

    # 2. Regex scan of the entire page text
    text = soup.get_text(" ")
    m = DATE_RE.search(text)
    if m:
        return m.group(0).strip()

    return None

def parse_date(date_str):
    """Try to turn the raw date string into an ISO date string."""
    if not date_str:
        return None
    formats = [
        "%B %d, %Y", "%B %d %Y", "%B, %d, %Y",
        "%d %B %Y", "%d %B, %Y",
        "%B %Y",           # fallback: just month+year
    ]
    clean = re.sub(r'\s+', ' ', date_str).strip()
    for fmt in formats:
        try:
            return datetime.strptime(clean, fmt).isoformat()
        except ValueError:
            pass
    return None

# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    print("═" * 60)
    print("  Greenswirl Date Fixer")
    print("═" * 60)

    # Load scraped JSON for wayback URLs
    with open(IN_FILE, encoding="utf-8") as f:
        scraped = json.load(f)
    scraped_posts = scraped["posts"]  # ordered by WP ID

    # Fetch current posts from API (to get MongoDB IDs)
    print("\nFetching posts from API …")
    r = requests.get(f"{API_BASE}/posts", timeout=30)
    if r.status_code != 200:
        print(f"API error: {r.status_code} {r.text}")
        sys.exit(1)
    api_posts = r.json()
    print(f"  {len(api_posts)} posts in database, {len(scraped_posts)} in JSON")

    # Match by title (most reliable)
    api_by_title = {p["title"].strip(): p for p in api_posts}

    ok = fail = skip = 0
    for i, sp in enumerate(scraped_posts):
        title = sp["title"].strip()
        wb_url = sp["wayback_url"]
        api_post = api_by_title.get(title)

        if not api_post:
            print(f"  [{i+1:03d}] ⚠  No DB match for: {title[:50]}")
            skip += 1
            continue

        post_id = api_post["id"]
        print(f"  [{i+1:03d}/{len(scraped_posts)}] {title[:55]}")

        # Fetch archived post page
        html = fetch(wb_url)
        if not html:
            print(f"    ✗  Could not fetch Wayback page")
            fail += 1
            continue

        raw_date = extract_date(html)
        iso_date = parse_date(raw_date) if raw_date else None

        if not iso_date:
            print(f"    ⚠  No date found (raw: {raw_date!r})")
            skip += 1
            continue

        print(f"    Found: {raw_date!r} → {iso_date}")

        # PUT to API
        try:
            resp = requests.put(
                f"{API_BASE}/posts/{post_id}",
                json={"title": api_post["title"],
                      "content": api_post["content"],
                      "date": iso_date},
                timeout=20
            )
            if resp.status_code == 200:
                print(f"    ✓  Updated")
                ok += 1
            else:
                print(f"    ✗  PUT failed: {resp.status_code} {resp.text[:80]}")
                fail += 1
        except Exception as e:
            print(f"    ✗  {e}")
            fail += 1

    print("\n" + "═" * 60)
    print(f"  Updated : {ok}")
    print(f"  No date : {skip}")
    print(f"  Failed  : {fail}")
    print("═" * 60)

if __name__ == "__main__":
    main()
