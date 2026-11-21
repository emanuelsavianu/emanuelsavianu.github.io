#!/usr/bin/env bash
# test-ruap-worker.sh — prova il worker della coda contro `wrangler dev` (locale).
# Nessuna credenziale cloud, nessuna scrittura su KV reale: Miniflare usa /tmp.
set -u
cd "$(dirname "$0")"

TOKEN=testtoken123
BASE=http://127.0.0.1:8788/api/ruap
OUT=/tmp/ruap-out.json
LOG=/tmp/ruap-wrangler.log
PASS=0
FAIL=0

chk() { # chk <descrizione> <atteso> <ottenuto>
  if [ "$2" = "$3" ]; then
    PASS=$((PASS + 1)); printf 'ok   %s\n' "$1"
  else
    FAIL=$((FAIL + 1)); printf 'FAIL %s (atteso %s, ottenuto %s)\n' "$1" "$2" "$3"
  fi
}

code() { curl -s -o "$OUT" -w '%{http_code}' "$@"; }

rm -rf /tmp/ruap-kv-test
npx wrangler dev --config wrangler-ruap.toml --port 8788 \
  --persist-to /tmp/ruap-kv-test \
  --var RUAP_PUBLISH_TOKEN:"$TOKEN" --var RUAP_NOTIFY_TO:test@example.com >"$LOG" 2>&1 &
WR=$!
trap 'kill $WR 2>/dev/null' EXIT

for _ in $(seq 1 60); do
  curl -s -o /dev/null "http://127.0.0.1:8788/api/ruap/pending" && break
  sleep 1
done

chk "senza token 401" 401 "$(code "$BASE/pending")"
chk "GET su publish 404" 404 "$(code -H "Authorization: Bearer $TOKEN" "$BASE/publish")"
chk "corpo non JSON 400" 400 "$(code -X POST -H "Authorization: Bearer $TOKEN" -H 'content-type: application/json' -d 'non-json' "$BASE/publish")"
chk "month invalido 422" 422 "$(code -X POST -H "Authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d '{"month":"2026-13","export":{"version":1,"doctors":[],"assignments":{}}}' "$BASE/publish")"
chk "chiave fuori mese 422" 422 "$(code -X POST -H "Authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d '{"month":"2026-12","export":{"version":1,"doctors":[{"id":"d1"}],"assignments":{"2027-01-04_mat_Subbiano":"d1"}}}' "$BASE/publish")"
chk "payload valido 202" 202 "$(code -X POST -H "Authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d '{"month":"2026-12","export":{"version":1,"doctors":[{"id":"d1"}],"assignments":{"2026-12-01_mat_Subbiano":"d1"}}}' "$BASE/publish")"

JOB=$(python3 -c 'import json;print(json.load(open("/tmp/ruap-out.json"))["jobId"])')
chk "jobId UUID" 1 "$(python3 -c 'import re,sys;print(1 if re.fullmatch(r"[0-9a-f-]{36}", sys.argv[1]) else 0)' "$JOB")"
chk "pending contiene il job" 1 "$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE/pending" | python3 -c 'import json,sys;print(len(json.load(sys.stdin)["jobs"]))')"
chk "stato queued" queued "$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE/jobs/$JOB" | python3 -c 'import json,sys;print(json.load(sys.stdin)["status"])')"
chk "ack status invalido 400" 400 "$(code -X POST -H "Authorization: Bearer $TOKEN" -H 'content-type: application/json' -d '{"status":"boh"}' "$BASE/jobs/$JOB/ack")"
chk "ack published 200" 200 "$(code -X POST -H "Authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d '{"status":"published","version":"2026-11-21T10:00:00Z","numbers":{"cells":1,"hours":6}}' "$BASE/jobs/$JOB/ack")"
chk "pending vuota" 0 "$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE/pending" | python3 -c 'import json,sys;print(len(json.load(sys.stdin)["jobs"]))')"
chk "stato published" published "$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE/jobs/$JOB" | python3 -c 'import json,sys;print(json.load(sys.stdin)["status"])')"
chk "ack ripetuto idempotente" 200 "$(code -X POST -H "Authorization: Bearer $TOKEN" -H 'content-type: application/json' -d '{"status":"published"}' "$BASE/jobs/$JOB/ack")"

printf '\n%d ok, %d fail\n' "$PASS" "$FAIL"
if [ "$FAIL" -ne 0 ]; then
  printf '\n--- wrangler log (ultime 40 righe) ---\n'
  tail -40 "$LOG"
fi
[ "$FAIL" -eq 0 ]
