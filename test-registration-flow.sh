#!/bin/bash
# Test script for Storage Valet registration and promotion flow

echo "=== Storage Valet Registration Flow Test ==="
echo

# Test 1: Complete registration with all fields
echo "Test 1: Full registration with all fields"
TIMESTAMP="$(date +%s)"
RESULT=$(curl -s -X POST http://localhost:3000/api/ingest/registration \
  -H 'Content-Type: application/json' \
  -d "{
    \"email\": \"full.test.$TIMESTAMP@example.com\",
    \"full_name\": \"Full Test User\",
    \"phone\": \"(201) 555-1234\",
    \"property_name\": \"The Avalon\",
    \"unit\": \"12A\",
    \"referral_source\": \"Building-QR\",
    \"marketing_opt_in\": true,
    \"agree_tos\": true,
    \"form_source\": \"Softr\",
    \"submission_id\": \"softr-full-$TIMESTAMP\",
    \"submission_ts\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
  }")
echo "$RESULT" | jq -c '.'
LEAD_ID=$(echo "$RESULT" | jq -r '.lead_id')
echo

# Test 2: Minimal registration (only required fields)
echo "Test 2: Minimal registration"
TIMESTAMP="$(date +%s)"
curl -s -X POST http://localhost:3000/api/ingest/registration \
  -H 'Content-Type: application/json' \
  -d "{
    \"email\": \"minimal.$TIMESTAMP@example.com\",
    \"full_name\": \"Minimal User\",
    \"agree_tos\": \"yes\"
  }" | jq -c '.'
echo

# Test 3: String boolean variants
echo "Test 3: Various boolean string formats"
TIMESTAMP="$(date +%s)"
curl -s -X POST http://localhost:3000/api/ingest/registration \
  -H 'Content-Type: application/json' \
  -d "{
    \"email\": \"bool.$TIMESTAMP@example.com\",
    \"full_name\": \"Boolean Test\",
    \"marketing_opt_in\": \"checked\",
    \"agree_tos\": \"1\"
  }" | jq -c '.'
echo

# Test 4: Case-insensitive select fields
echo "Test 4: Case-insensitive selects"
TIMESTAMP="$(date +%s)"
curl -s -X POST http://localhost:3000/api/ingest/registration \
  -H 'Content-Type: application/json' \
  -d "{
    \"email\": \"case.$TIMESTAMP@example.com\",
    \"full_name\": \"Case Test\",
    \"referral_source\": \"web\",
    \"form_source\": \"jotform\",
    \"agree_tos\": true
  }" | jq -c '.'
echo

# Test 5: Promote lead to customer
if [ ! -z "$LEAD_ID" ] && [ "$LEAD_ID" != "null" ]; then
  echo "Test 5: Promoting lead $LEAD_ID to customer"
  curl -s -X POST http://localhost:3000/api/ingest/promote-lead \
    -H 'Content-Type: application/json' \
    -d "{\"lead_id\":\"$LEAD_ID\"}" | jq -c '.'
else
  echo "Test 5: Skipping promotion (no valid lead_id)"
fi
echo

echo "=== All tests completed ==="