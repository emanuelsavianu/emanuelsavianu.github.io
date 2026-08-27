#!/usr/bin/env python3
"""Bing Webmaster API — instant batch URL submission.

Pushes the site's sitemap URLs (or an explicit list) to Bing in a single
batch call, so new/updated pages get crawled immediately instead of waiting
for the Bingbot crawl queue.

Usage:
    python tools/bing_submit.py YOUR_BING_API_KEY
    python tools/bing_submit.py YOUR_BING_API_KEY https://savianu.it/ https://savianu.it/ssn/

Bing Webmaster API key: Bing Webmaster Tools → Settings → API Access.
"""
import json
import sys
import urllib.request
import urllib.error
import xml.etree.ElementTree as ET

DOMAIN = "https://savianu.it"
SITEMAP = "https://savianu.it/sitemap.xml"
ENDPOINT = "https://ssl.bing.com/webmaster/api.svc/json/SubmitUrlbatch?apikey={key}"


def urls_from_sitemap():
    try:
        req = urllib.request.Request(SITEMAP, headers={"User-Agent": "savianu-seo/1.0"})
        with urllib.request.urlopen(req, timeout=20) as resp:
            data = resp.read().decode("utf-8")
        ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
        root = ET.fromstring(data)
        return [loc.text for loc in root.findall(".//sm:loc", ns) if loc.text]
    except Exception as e:  # noqa: BLE001
        print(f"Could not read sitemap ({e}); falling back to core URLs.")
        return None


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(2)

    api_key = sys.argv[1]
    if len(sys.argv) > 2:
        urls = sys.argv[2:]
    else:
        urls = urls_from_sitemap() or [
            "https://savianu.it/",
            "https://savianu.it/ssn/",
            "https://savianu.it/privati/",
            "https://savianu.it/international/",
            "https://savianu.it/ssn/poster-it.html",
            "https://savianu.it/ssn/poster-en.html",
            "https://savianu.it/ssn/poster-ro.html",
            "https://savianu.it/ssn/poster-bn.html",
            "https://savianu.it/ssn/poster-ur.html",
        ]

    payload = {"siteUrl": DOMAIN, "urlList": urls}
    req = urllib.request.Request(
        ENDPOINT.format(key=api_key),
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json; charset=utf-8"},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = resp.read().decode("utf-8", "replace")
            print(f"Bing batch submission: HTTP {resp.status} {resp.reason}")
            print(f"Submitted {len(urls)} URLs.")
            if body:
                print("Response:", body[:500])
    except urllib.error.HTTPError as e:
        print(f"Bing batch submission FAILED: HTTP {e.code} {e.reason}")
        print(e.read().decode("utf-8", "replace")[:500])
        sys.exit(1)
    except Exception as e:  # noqa: BLE001
        print(f"Bing batch submission FAILED: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
