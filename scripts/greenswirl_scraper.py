#!/usr/bin/env python3
"""
Greenswirl.ca Wayback Machine Blog Scraper
Scrapes all posts + info pages, deduplicates, saves to greenswirl_scraped.json.

Usage:
  pip install requests beautifulsoup4
  python scripts/greenswirl_scraper.py

Output: scripts/greenswirl_scraped.json
"""

import json
import re
import time
import sys
import os

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("Missing deps. Run:  pip install requests beautifulsoup4")
    sys.exit(1)

# ── Config ───────────────────────────────────────────────────────────────────
SITE      = "www.greenswirl.ca"
BLOG_PATH = "/blog/"
SNAP      = "20111231203848"
INDEX_URL = f"https://web.archive.org/web/{SNAP}/http://{SITE}{BLOG_PATH}"
CDX_API   = "https://web.archive.org/cdx/search/cdx"
DELAY     = 1.5
OUT_FILE  = os.path.join(os.path.dirname(__file__), "greenswirl_scraped.json")

session = requests.Session()
session.headers["User-Agent"] = (
    "GreenSwirlPersonalArchiver/1.0 (personal blog restoration; myklove@gmail.com)"
)

# ── HTTP ─────────────────────────────────────────────────────────────────────
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

# ── URL helpers ───────────────────────────────────────────────────────────────
def normalize(url):
    """Canonical key for deduplication — strips scheme, www variants, trailing slash."""
    u = url.lower()
    u = re.sub(r'^https?://', '', u)
    u = u.rstrip('/')
    return u

def wp_id(url):
    m = re.search(r'[?&]p=(\d+)', url)
    return int(m.group(1)) if m else None

def is_post(url):
    if re.search(r'[?&]p=\d+', url):
        return True
    if re.search(r'/blog/\d{4}/\d{2}/.+', url):
        return True
    return False

def is_page(url):
    if re.search(r'[?&]page_id=\d+', url):
        return True
    # Named WP pages like /blog/links/, /blog/about/ — but NOT year archives
    path = re.sub(r'^https?://[^/]+', '', url).rstrip('/')
    if re.match(r'^/blog/[a-z][a-z0-9-]+$', path):
        return True
    return False

def is_archive(url):
    """Pagination, category, tag, date archives — skip."""
    return bool(re.search(r'/page/\d+|[?&](cat|tag|m=\d|author)=', url))

def is_junk(url):
    """WP admin, feeds, theme assets, etc."""
    skip = ["wp-", "feed", "xmlrpc", "wp-login", "wp-admin",
            "sitemap", "robots.txt", "favicon", "trackback",
            "comment", "?replytocom", "?like_comment"]
    return any(p in url for p in skip)

# ── CDX discovery ─────────────────────────────────────────────────────────────
def cdx_discover():
    params = {
        "url"     : f"{SITE}{BLOG_PATH}*",
        "output"  : "json",
        "fl"      : "original,timestamp",
        "filter"  : "statuscode:200",
        "collapse": "urlkey",          # one entry per unique URL (CDX-canonical)
        "limit"   : 1000,
        "from"    : "20070101",
        "to"      : "20120101",
    }
    try:
        r = session.get(CDX_API, params=params, timeout=30)
        rows = r.json()
    except Exception as e:
        print(f"  CDX error: {e}")
        return []
    if len(rows) < 2:
        return []
    return [(orig, ts) for orig, ts in rows[1:]]

# ── Index scrape (supplement) ─────────────────────────────────────────────────
def scrape_index():
    print(f"  Fetching index: {INDEX_URL}")
    html = fetch(INDEX_URL)
    if not html:
        return []
    soup = BeautifulSoup(html, "html.parser")
    found = []
    for a in soup.find_all("a", href=True):
        m = re.search(r'/web/(\d+)/(https?://[^\s"\'<>]+)', a["href"])
        if m and SITE in m.group(2):
            orig = m.group(2).split("#")[0]
            found.append((orig, m.group(1)))
    return found

# ── HTML extraction ───────────────────────────────────────────────────────────
TITLE_SELS = [
    "h1.entry-title", ".entry-title", "h1.post-title", ".post-title",
    "h2.entry-title", ".storytitle", "h1.title", "h2.title", "h1",
]
DATE_SELS = [
    "abbr.published", "time[datetime]", "time.published",
    ".entry-date", ".published", ".post-date", ".date",
    ".postmetadata", ".entry-meta",
]
CONTENT_SELS = [
    ".entry-content", ".post-content", ".post-body",
    ".storycontent", "#post-content", ".entry-body",
    ".postbody", ".text",
]

def clean_soup(html):
    soup = BeautifulSoup(html, "html.parser")
    for sel in ["#wm-ipp-base", "#wm-ipp", ".wb-autocomplete-suggestions"]:
        for el in soup.select(sel):
            el.decompose()
    for el in soup.find_all("script"):
        el.decompose()
    for sel in ["#comments", ".comments-area", "#respond",
                "#sidebar", ".sidebar", "nav", "header.site-header",
                ".sharedaddy", ".navigation", ".wpcnt"]:
        for el in soup.select(sel):
            el.decompose()
    return soup

def get_title(soup):
    for sel in TITLE_SELS:
        el = soup.select_one(sel)
        if el and el.get_text(strip=True):
            return el.get_text(strip=True)
    return None

def get_date(soup):
    for sel in DATE_SELS:
        el = soup.select_one(sel)
        if el:
            d = el.get("title") or el.get("datetime") or el.get_text(strip=True)
            if d and len(d.strip()) > 3:
                return d.strip()
    return None

def get_content(soup):
    for sel in CONTENT_SELS:
        el = soup.select_one(sel)
        if el:
            for rm in el.select(".sharedaddy, .post-tags, .postmetadata"):
                rm.decompose()
            html = str(el)
            # Strip Wayback CDX prefixes from any embedded links
            html = re.sub(r'https?://web\.archive\.org/web/\d+/', '', html)
            return html
    # Fallback: grab .post / .hentry
    for sel in [".post", ".hentry", "article"]:
        el = soup.select_one(sel)
        if el:
            for rm in el.select("h1, h2, .entry-title, .entry-meta, "
                                ".post-meta, .post-footer, .postmetadata, .navigation"):
                rm.decompose()
            html = str(el)
            html = re.sub(r'https?://web\.archive\.org/web/\d+/', '', html)
            return html
    return ""

# ── Scrapers ──────────────────────────────────────────────────────────────────
def scrape_post(orig, ts):
    wb = f"https://web.archive.org/web/{ts}/{orig}"
    html = fetch(wb)
    if not html:
        return None
    soup  = clean_soup(html)
    title = get_title(soup)
    date  = get_date(soup)
    body  = get_content(soup)
    return {
        "title"       : title or "Untitled",
        "date"        : date,
        "content"     : body or f'<p>(<a href="{wb}" target="_blank">View on Wayback Machine</a>)</p>',
        "wayback_url" : wb,
        "original_url": orig,
        "wp_id"       : wp_id(orig),
    }

def scrape_page(orig, ts):
    wb = f"https://web.archive.org/web/{ts}/{orig}"
    html = fetch(wb)
    if not html:
        return None
    soup = clean_soup(html)
    return {
        "name"        : get_title(soup) or "Info Page",
        "body"        : get_content(soup) or f'<p>(<a href="{wb}" target="_blank">View on Wayback Machine</a>)</p>',
        "wayback_url" : wb,
        "original_url": orig,
    }

# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    print("═" * 60)
    print("  Greenswirl.ca Wayback Scraper  (clean run)")
    print("═" * 60)

    # 1. Discover
    print("\n[1/4] CDX API …")
    cdx = cdx_discover()
    print(f"      {len(cdx)} raw CDX entries")

    print("\n[2/4] Index scan …")
    idx = scrape_index()
    print(f"      {len(idx)} candidate links from index")

    # 2. Deduplicate — key = normalize(url), keep earliest timestamp
    seen_posts = {}   # norm_key → (orig, ts)
    seen_pages = {}

    for orig, ts in cdx + idx:
        if is_junk(orig) or is_archive(orig):
            continue
        key = normalize(orig)
        if is_post(orig):
            if key not in seen_posts:
                seen_posts[key] = (orig, ts)
        elif is_page(orig):
            if key not in seen_pages:
                seen_pages[key] = (orig, ts)

    post_pairs = sorted(seen_posts.values(), key=lambda x: (wp_id(x[0]) or 0, x[0]))
    page_pairs = list(seen_pages.values())

    print(f"\n      Unique posts : {len(post_pairs)}")
    print(f"      Unique pages : {len(page_pairs)}")

    # 3. Scrape posts
    print(f"\n[3/4] Scraping {len(post_pairs)} posts …")
    posts = []
    for i, (orig, ts) in enumerate(post_pairs):
        print(f"  [{i+1:03d}/{len(post_pairs)}] p={wp_id(orig) or '?':>4}  {orig[-55:]}")
        r = scrape_post(orig, ts)
        if r:
            posts.append(r)

    # 4. Scrape pages
    print(f"\n[4/4] Scraping {len(page_pairs)} info pages …")
    pages = []
    for i, (orig, ts) in enumerate(page_pairs):
        print(f"  [{i+1}/{len(page_pairs)}] {orig[-55:]}")
        r = scrape_page(orig, ts)
        if r:
            pages.append(r)

    with open(OUT_FILE, "w", encoding="utf-8") as f:
        json.dump({"posts": posts, "info_pages": pages}, f, ensure_ascii=False, indent=2)

    print("\n" + "═" * 60)
    print(f"  Done!  {len(posts)} posts  |  {len(pages)} info pages")
    print(f"  Saved → {OUT_FILE}")
    print("  Next:   python scripts/greenswirl_import.py --clear")
    print("═" * 60)

if __name__ == "__main__":
    main()
