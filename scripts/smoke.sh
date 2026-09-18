#!/usr/bin/env bash
# P1 smoke test — requires: docker compose up -d, prisma migrate+seed, API running on :3001,
# and a REAL OPENAI_API_KEY in .env (the agent makes live model calls).
set -euo pipefail

API=${API:-http://localhost:3001}
JAR=$(mktemp)
T1=$(mktemp)
T2=$(mktemp)
trap 'rm -f "$JAR" "$T1" "$T2"' EXIT

echo "→ healthz"
curl -sf "$API/healthz" | grep -q '"db":"ok"'

echo "→ turn 1: menu question (expect text_delta + menu_card + done)"
curl -sN -c "$JAR" -X POST "$API/api/chat" \
  -H 'content-type: application/json' \
  -d '{"message":"What pastas do you have?"}' > "$T1"
grep -q 'event: text_delta' "$T1"
grep -q 'event: ui_block' "$T1"
grep -q '"type":"menu_card"' "$T1"
grep -q 'event: done' "$T1"

echo "→ turn 2: same cookie, follow-up (expect nutrition_table; check API logs for cached tokens)"
curl -sN -b "$JAR" -X POST "$API/api/chat" \
  -H 'content-type: application/json' \
  -d '{"message":"How many calories are in the carbonara? Show me the breakdown."}' > "$T2"
grep -q '"type":"nutrition_table"' "$T2"
grep -q 'event: done' "$T2"

echo "✅ smoke passed"
echo "   (verify prompt caching: API log 'model turn usage' on turn 2 should show inputTokensDetails.cached_tokens > 0)"
