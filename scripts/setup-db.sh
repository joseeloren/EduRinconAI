#!/bin/bash

# Cargar variables de entorno
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/edurinconai"

# Push schema
echo "📦 Pushing database schema..."
npx drizzle-kit push --config=drizzle.config.ts --force

echo "✅ Schema pushed successfully!"
