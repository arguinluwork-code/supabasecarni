#!/bin/bash

# Carnicería Control - Test Script para Edge Functions
# Este script facilita el testing de las Edge Functions de Supabase

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar que existan las variables de entorno
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
  echo -e "${RED}Error: Falta configuración${NC}"
  echo ""
  echo "Configura las siguientes variables de entorno:"
  echo "  export SUPABASE_URL='https://tu-project-ref.supabase.co'"
  echo "  export SUPABASE_ANON_KEY='tu-anon-key'"
  echo ""
  echo "O usa el service_role key para testing:"
  echo "  export SUPABASE_ANON_KEY='tu-service-role-key'"
  echo ""
  echo "Obtén estas credenciales en:"
  echo "  Supabase Dashboard → Settings → API"
  exit 1
fi

# Función helper para hacer requests
function call_function() {
  local function_name=$1
  local method=${2:-POST}

  echo -e "${YELLOW}Calling: ${function_name}${NC}"
  echo ""

  response=$(curl -s -w "\n%{http_code}" -X $method \
    "${SUPABASE_URL}/functions/v1/${function_name}" \
    -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
    -H "Content-Type: application/json")

  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')

  if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓ Success (HTTP $http_code)${NC}"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
  else
    echo -e "${RED}✗ Error (HTTP $http_code)${NC}"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
  fi

  echo ""
  echo "---"
  echo ""
}

# Menú principal
echo ""
echo "╔════════════════════════════════════════════╗"
echo "║   Carnicería Control - Test Edge Functions ║"
echo "╚════════════════════════════════════════════╝"
echo ""
echo "Supabase URL: $SUPABASE_URL"
echo ""

PS3="Selecciona una opción: "
options=("Test Odoo Connection" "Sync Pull (Odoo → Supabase)" "Sync Push (Supabase → Odoo)" "Dashboard Stats" "Exit")

select opt in "${options[@]}"
do
  case $opt in
    "Test Odoo Connection")
      call_function "odoo-test-connection"
      ;;
    "Sync Pull (Odoo → Supabase)")
      echo -e "${YELLOW}ADVERTENCIA: Esto sobreescribirá todos los datos en Supabase${NC}"
      read -p "¿Continuar? (y/N): " confirm
      if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
        call_function "odoo-sync-pull"
      fi
      ;;
    "Sync Push (Supabase → Odoo)")
      echo -e "${YELLOW}ADVERTENCIA: Esto actualizará productos en Odoo${NC}"
      read -p "¿Continuar? (y/N): " confirm
      if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
        call_function "odoo-sync-push"
      fi
      ;;
    "Dashboard Stats")
      call_function "dashboard-stats" "GET"
      ;;
    "Exit")
      echo "Bye!"
      break
      ;;
    *)
      echo "Opción inválida"
      ;;
  esac
done
