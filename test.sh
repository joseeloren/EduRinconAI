#!/bin/bash

# Script de Testing para EduRinconAI
# Prueba todas las funcionalidades sin dependencia de Ollama

echo "==================================="
echo "EduRinconAI - Testing Suite"
echo "==================================="
echo ""

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3000"

# Función para imprimir resultados
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ $2${NC}"
    else
        echo -e "${RED}✗ $2${NC}"
    fi
}

echo "1. Testing página de login..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/login)
if [ "$STATUS" -eq 200 ]; then
    print_result 0 "Página de login carga correctamente"
else
    print_result 1 "Página de login falló (HTTP $STATUS)"
fi
echo ""

echo "2. Testing redirección sin autenticación..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/teacher)
if [ "$STATUS" -eq 307 ]; then
    print_result 0 "Redirección a login funciona"
else
    print_result 1 "Redirección falló (HTTP $STATUS)"
fi
echo ""

echo "3. Testing API de usuarios..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api/users)
if [ "$STATUS" -eq 401 ]; then
    print_result 0 "API users requiere autenticación correctamente"
else
    print_result 1 "API users no requiere auth (HTTP $STATUS)"
fi
echo ""

echo "4. Testing página de crear asistente..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/teacher/assistants/create)
if [ "$STATUS" -eq 307 ]; then
    print_result 0 "Página crear asistente redirige a login"
else
    print_result 1 "Crear asistente no redirige (HTTP $STATUS)"
fi
echo ""

echo "5. Testing página de gestión de usuarios..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/admin/users)
if [ "$STATUS" -eq 307 ]; then
    print_result 0 "Gestión de usuarios redirige a login"
else
    print_result 1 "Gestión usuarios no redirige (HTTP $STATUS)"
fi
echo ""

echo "6. Testing página de historial de chats..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/student/chats)
if [ "$STATUS" -eq 307 ]; then
    print_result 0 "Historial de chats redirige a login"
else
    print_result 1 "Historial no redirige (HTTP $STATUS)"
fi
echo ""

echo "7. Testing página 404..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/pagina-que-no-existe)
if [ "$STATUS" -eq 404 ]; then
    print_result 0 "Página 404 personalizada funciona"
else
    print_result 1 "404 personalizada falló (HTTP $STATUS)"
fi
echo ""

echo "8. Testing API de chats..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api/chats)
if [ "$STATUS" -eq 401 ]; then
    print_result 0 "API chats requiere autenticación"
else
    print_result 1 "API chats no requiere auth (HTTP $STATUS)"
fi
echo ""

echo "==================================="
echo "Testing completado"
echo "==================================="
echo ""
echo -e "${YELLOW}Nota: Estos tests verifican la estructura y autenticación.${NC}"
echo -e "${YELLOW}Para testing funcional completo, usa el navegador una vez configurado Ollama.${NC}"
