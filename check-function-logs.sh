#!/bin/bash

# Check Supabase function logs for debugging

echo "🔍 Checking fetch-events-realtime function logs..."
echo ""

# Invoke the function directly with test data
echo "📡 Testing function with NYC location..."
supabase functions invoke fetch-events-realtime \
  --body '{"source":["ticketmaster","eventbrite"],"center":{"lat":40.7128,"lng":-74.006},"radius":25,"timeframe":"24h"}' \
  | python3 -m json.tool

echo ""
echo "To see recent logs, run:"
echo "supabase functions logs fetch-events-realtime"