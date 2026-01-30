# 🚀 Guía de Instalación Rápida - EduRinconAI

## ⚠️ Solución de Problemas de Instalación

Si tienes problemas con `npm install` debido a cache corrupto, sigue estos pasos:

### Opción 1: Limpiar completamente npm (Recomendado)

```bash
# 1. Cerrar VS Code y cualquier terminal abierta

# 2. Eliminar node_modules manualmente desde Windows Explorer
# Navega a c:\Users\Jose\workspace\EduRinconAI y elimina la carpeta node_modules

# 3. Abrir PowerShell como Administrador y ejecutar:
cd c:\Users\Jose\workspace\EduRinconAI
Remove-Item -Path node_modules -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path package-lock.json -Force -ErrorAction SilentlyContinue

# 4. También limpia tu propia carpeta de caché npm (run en PowerShell como admin):
Remove-Item -Path "$env:APPDATA\npm-cache" -Recurse -Force -ErrorAction SilentlyContinue

# 5. Ahora instala:
npm install --legacy-peer-deps
```

### Opción 2: Usar Yarn (Alternativa más estable)

```bash
# 1. Instalar Yarn  si no lo tienes
npm install -g yarn

# 2. Eliminar node_modules y package-lock.json
rm -rf node_modules package-lock.json

# 3. Instalar con Yarn
yarn install
```

### Opción 3: Instalación paso a paso con registros

Si las anteriores no funcionan:

```bash
# 1. Verificar versión de Node.js (debe ser 18+)
node -v

# 2. Actualizar npm
npm install -g npm@latest

# 3. Limpiar cache npm
npm cache clean --force

# 4. Instalar dependencias con verbose logging
npm install --legacy-peer-deps --verbose > install-log.txt 2>&1
```

## ✅ Pasos Post-Instalación

Una vez que las dependencias estén instaladas:

### 1. Configurar Base de Datos

```bash
# Levantar PostgreSQL con Docker
docker-compose up -d

# Esperar a que PostgreSQL esté listo (30 segundos)

# Crear el schema en la base de datos
npm run db:push

# Habilitar extensión pgvector
npm run db:migrate
```

### 2. Crear Usuarios de Prueba

```bash
npm run seed
```

Esto creará tres usuarios:
- `admin@iesrincon.es` (Admin) - password: `password`
- `teacher@iesrincon.es` (Profesor) - password: `password`
- `student@iesrincon.es` (Alumno) - password: `password`

### 3. Configurar Ollama (En tu VDI)

En tu servidor VDI con Ollama:

```bash
# Descargar los modelos necesarios
ollama pull llama3.2
ollama pull nomic-embed-text

# Verificar que Ollama esté corriendo
ollama list
```

**Importante**: Actualiza el archivo `.env.local` con la IP de tu VDI:

```env
LLM_API_BASE_URL="http://TU_IP_VDI:11434/v1"
```

### 4. Iniciar la Aplicación

```bash
npm run dev
```

La aplicación estará disponible en: [http://localhost:3000](http://localhost:3000)

## 🔧 Scripts Disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build para producción
npm run start        # Servidor de producción
npm run lint         # Linting
npm run db:push      # Push schema a PostgreSQL
npm run db:generate  # Generar migraciones
npm run db:studio    # Abrir Drizzle Studio
npm run seed         # Crear usuarios de prueba
```

## 📝 Notas Importantes

1. **Node.js**: Requiere versión 18 o superior
2. **Docker**: Debe estar corriendo para PostgreSQL
3. **Ollama**: Debe estar accesible desde tu máquina local
4. **Firewall**: Asegúrate de que el puerto 11434 de tu VDI sea accesible

## 🐛 Problemas Comunes

### Error: "Cannot find module 'next'"
- Solución: Reinstalar dependencias con `npm install --legacy-peer-deps`

### Error: "Connection refused" al conectar a BD
- Verificar que Docker esté corriendo: `docker ps`
- Reiniciar contenedor: `docker-compose restart`

### Error: LLM no responde / Headers Timeout
- **Si la app está en un servidor y Ollama en otra máquina**: NO uses `localhost`. Usa la IP del VDI: `LLM_API_BASE_URL="http://IP_VDI:11434/v1"`
- Verificar que Ollama esté corriendo: `ollama list`
- Probar conexión: `curl http://IP_VDI:11434/v1/models`
- **Modelos grandes** (deepseek-r1:32b, etc.): Aumentar timeouts en `.env.local`:
  - `LLM_HEADERS_TIMEOUT_MS=180000` (3 min)
  - `LLM_BODY_TIMEOUT_MS=600000` (10 min)

### Error de permisos en Windows
- Ejecutar terminal como Administrador
- Desactivar temporalmente antivirus
- Usar PowerShell en lugar de CMD

## 📚 Estructura Creada

El proyecto incluye:
- ✅ Configuración completa de Next.js 15
- ✅ Esquema de base de datos con pgvector
- ✅ Autenticación con NextAuth.js v5
- ✅ API routes para chat, documentos y asistentes
- ✅ Componentes UI con Shadcn/UI
- ✅ Pipeline RAG completo
- ✅ Dashboards para Admin, Profesor y Alumno

## 🎯 Próximos Pasos

1. ✅ Instalar dependencias (este paso)
2. ✅ Levantar base de datos
3. ✅ Crear usuarios de prueba
4. ✅ Configurar Ollama en VDI
5. ✅ Iniciar desarrollo
6. 🔜 Crear tu primer asistente
7. 🔜 Subir documentos
8. 🔜 Probar el chat

¡Buena suerte! 🚀
