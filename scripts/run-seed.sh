#!/bin/bash

# Cargar variables de entorno
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/edurinconai"

# Ejecutar seed
echo "🌱 Seeding database with test users..."
npx tsx scripts/seed-users.ts

echo "✅ Seed completed!"
