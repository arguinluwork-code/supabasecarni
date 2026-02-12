#!/bin/bash

# Script para testear conexión directa con Odoo usando curl

echo "🔍 Testing Odoo JSON-RPC connection..."
echo ""

# EDITA ESTAS VARIABLES
ODOO_URL="https://sgb-carnes2.odoo.com"
ODOO_DB="sgb-carnes2"
ODOO_USER="tu-email@gmail.com"
ODOO_API_KEY="tu-api-key"

echo "Config:"
echo "  URL: $ODOO_URL"
echo "  DB: $ODOO_DB"
echo "  User: $ODOO_USER"
echo "  API Key: ${ODOO_API_KEY:0:10}..."
echo ""
echo "---"
echo ""

# Test 1: Authentication
echo "1. Testing authentication..."

response=$(curl -s -w "\n%{http_code}" -X POST "${ODOO_URL}/jsonrpc" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "call",
    "params": {
      "service": "common",
      "method": "authenticate",
      "args": ["'$ODOO_DB'", "'$ODOO_USER'", "'$ODOO_API_KEY'", {}]
    },
    "id": 1
  }')

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

echo "   HTTP Status: $http_code"

if [ "$http_code" = "200" ]; then
  echo "   ✅ Success!"
  echo "   Response: $body" | head -c 200
  echo ""
else
  echo "   ❌ Failed (HTTP $http_code)"
  echo "   Response preview:"
  echo "$body" | head -c 500
  echo ""
  echo ""
  echo "🔍 Trying alternative endpoint: /web/session/authenticate"
  
  alt_response=$(curl -s -w "\n%{http_code}" -X POST "${ODOO_URL}/web/session/authenticate" \
    -H "Content-Type: application/json" \
    -d '{
      "jsonrpc": "2.0",
      "params": {
        "db": "'$ODOO_DB'",
        "login": "'$ODOO_USER'",
        "password": "'$ODOO_API_KEY'"
      }
    }')
  
  alt_http_code=$(echo "$alt_response" | tail -n1)
  echo "   HTTP Status: $alt_http_code"
  
  if [ "$alt_http_code" = "200" ]; then
    echo "   ✅ Alternative endpoint works!"
  else
    echo "   ❌ Alternative endpoint also failed"
  fi
fi

echo ""
echo "---"
echo ""
echo "💡 If you see HTML in the response (404 error page),"
echo "   it means the JSON-RPC endpoint is not available at this URL."
echo ""
echo "   Solutions:"
echo "   1. Verify the Odoo URL in your browser"
echo "   2. Check if it's Odoo Online (odoo.com) or On-premise"
echo "   3. For Odoo Online, the endpoint might be different"
echo "   4. Contact Odoo support if API is not accessible"
