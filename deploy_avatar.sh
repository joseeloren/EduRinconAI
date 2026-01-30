#!/bin/bash
echo "🚀 Iniciando despliegue de Avatar 3D..."

# 1. Asegurar que estamos en la rama correcta
git checkout main

# 2. Añadir todos los cambios (incluido el avatar .png y los componentes)
git add .

# 3. Guardar cambios
echo "📦 Guardando cambios..."
git commit -m "Feat: Complete 3D Avatar integration with TTS"

# 4. Subir a GitHub
echo "⬆️ Subiendo a GitHub..."
git push origin main

echo "✅ Listo! Ahora ve a tu servidor y ejecuta:"
echo "   git pull origin main"
echo "   npx next build"
echo "   pm2 restart edurincon"
