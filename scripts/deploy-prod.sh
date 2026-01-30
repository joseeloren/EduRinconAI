#!/usr/bin/env bash
set -euo pipefail

# Despliegue remoto para EduRinconAI
# Uso: ./deploy-prod.sh [REMOTE_DIR]
# Requiere acceso SSH (clave o contraseña) al servidor indicado en las variables.

SSH_USER="ab0f72e8-4478-498c-802b-325282d754ba"
SSH_HOST="sites.escritorios.ieselrincon.es"
SSH_PORT="443"
REMOTE_DIR="${1:-~/edurinconai}"

echo "-> Desplegando en ${SSH_USER}@${SSH_HOST}:${SSH_PORT} -> ${REMOTE_DIR}"

echo "Conectando y ejecutando comandos remotos... (puede pedir contraseña/clave)"

ssh -p "${SSH_PORT}" "${SSH_USER}@${SSH_HOST}" "bash -s" <<'REMOTE_SCRIPT'
set -euo pipefail
REMOTE_DIR="'"${REMOTE_DIR}"'"

cd "$REMOTE_DIR" || { echo "Directorio $REMOTE_DIR no existe en remoto."; exit 1; }

# Asegurar estado limpio y actualizar código
git fetch --all --prune || true
git reset --hard origin/main || true
git pull origin main || true

# Instalar dependencias y compilar
npm install --legacy-peer-deps
npm run build

# Reiniciar con PM2
pm2 delete edurinconai || true
pm2 start npm --name "edurinconai" -- start --update-env

echo "Despliegue remoto finalizado."
REMOTE_SCRIPT

echo "Despliegue iniciado. Revisa la salida anterior para errores." 
