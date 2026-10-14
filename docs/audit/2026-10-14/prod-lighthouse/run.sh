#!/usr/bin/env bash
# Core Web Vitals di PRODUZIONE — Lighthouse 12 mobile, 3 run per pagina.
# Mandato: handover 2026-10-13/14 (P1-3). Misura il DEPLOYATO, non l'albero locale.
set -u
OUT=/home/es/Projects/savianu.it/docs/audit/2026-10-14/prod-lighthouse
mkdir -p "$OUT"
export CHROME_PATH=/usr/bin/google-chrome-stable
for p in / /ssn/ /privati/ /international/ /colleghi/; do
  name=$(echo "$p" | tr -d '/'); [ -z "$name" ] && name=home
  for i in 1 2 3; do
    npx -y lighthouse@12 "https://savianu.it$p" \
      --only-categories=performance,accessibility,best-practices,seo \
      --form-factor=mobile \
      --chrome-flags="--headless=new --no-sandbox --disable-dev-shm-usage" \
      --output=json --output-path="$OUT/${name}-run${i}.json" --quiet 2>&1 | tail -2
    echo "done $name run$i"
  done
done
echo ALL_DONE
