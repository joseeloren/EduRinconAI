# EduRinconAI

Plataforma educativa con asistentes IA personalizados para el IES El Rincón.

## 🚀 Características

- **Autenticación Segura**: NextAuth.js v5 con roles (Admin, Profesor, Alumno)
- **Asistentes IA**: Chatbots personalizados con contexto RAG
- **RAG (Retrieval Augmented Generation)**: Carga documentos (PDF, DOCX, TXT) y consulta con IA
- **Vectorización**: pgvector para búsqueda semántica
- **Streaming**: Respuestas en tiempo real con efecto "máquina de escribir"
- **Control de Acceso**: RBAC estricto por roles

## 📋 Requisitos Previos

- Node.js 18+
- Docker y Docker Compose
- Un servidor con Ollama/LocalAI corriendo (para el LLM)

## 🛠️ Instalación

### 1. Clonar el repositorio

```bash
cd c:/Users/Jose/workspace/EduRinconAI
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copia el archivo `.env.example` a `.env.local`:

```bash
cp .env.example .env.local
```

Edita `.env.local` con tus configuraciones:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/edurinconai"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="tu-clave-secreta-aleatoria-minimo-32-caracteres"
LLM_API_BASE_URL="http://tu-vdi-ip:11434/v1"
LLM_MODEL_NAME="llama3.2"
LLM_EMBEDDING_MODEL="nomic-embed-text"
```

### 4. Levantar la base de datos

```bash
docker-compose up -d
```

### 5. Ejecutar migraciones

```bash
npm run db:push
npm run db:migrate
```

### 6. Iniciar el servidor de desarrollo

```bash
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

## 📁 Estructura del Proyecto

```
EduRinconAI/
├── app/                      # Next.js App Router
│   ├── api/                  # API Routes
│   │   ├── auth/            # NextAuth endpoints
│   │   ├── chat/            # Chat streaming
│   │   ├── documents/       # Upload de documentos
│   │   └── assistants/      # CRUD asistentes
│   ├── login/               # Página de login
│   ├── student/             # Dashboard alumno
│   ├── teacher/             # Dashboard profesor
│   ├── admin/               # Dashboard admin
│   └── chat/[assistantId]/  # Interfaz de chat
├── components/              # React Components
│   ├── chat/               # ChatInterface
│   ├── documents/          # UploadZone
│   └── assistants/         # AssistantCard
├── lib/                    # Servicios y utilidades
│   ├── auth/              # Roles y permisos
│   ├── llm/               # Cliente LLM
│   └── rag/               # Procesamiento RAG
├── db/                    # Database
│   ├── schema.ts         # Drizzle schema
│   └── index.ts          # Conexión DB
├── docker-compose.yml    # PostgreSQL + pgvector
└── package.json          # Dependencies
```

## 🔐 Usuarios de Prueba

Para probar la aplicación, necesitarás crear usuarios en la base de datos. Aquí hay un script de ejemplo:

```typescript
import bcrypt from 'bcryptjs';
import { db } from './db';
import { users } from './db/schema';

async function seed() {
  const hashedPassword = await bcrypt.hash('password', 10);

  await db.insert(users).values([
    {
      email: 'admin@iesrincon.es',
      name: 'Admin',
      role: 'ADMIN',
      passwordHash: hashedPassword,
    },
    {
      email: 'teacher@iesrincon.es',
      name: 'Profesor Demo',
      role: 'TEACHER',
      passwordHash: hashedPassword,
    },
    {
      email: 'student@iesrincon.es',
      name: 'Alumno Demo',
      role: 'STUDENT',
      passwordHash: hashedPassword,
    },
  ]);
}

seed();
```

## 🎯 Flujo de Trabajo

### Para Profesores:

1. Crear un asistente con prompt personalizado
2. Subir documentos (PDF, DOCX, TXT)
3. Los documentos se procesan automáticamente (RAG pipeline)
4. Asignar acceso a alumnos específicos

### Para Alumnos:

1. Ver asistentes asignados
2. Chatear con los asistentes
3. Las respuestas incluyen citas de los documentos

## 🔒 Seguridad

- **Passwords**: Hasheados con bcryptjs
- **Sesiones**: JWT con cookies HTTP-only
- **RBAC**: Middleware de Next.js valida permisos
- **Aislamiento**: Los alumnos solo ven sus asistentes asignados
- **Validación**: Verificación de acceso en cada API call

## 🧪 Comandos Útiles

```bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Iniciar producción
npm start

# Linting
npm run lint

# Base de datos
npm run db:push       # Push schema a DB
npm run db:generate   # Generar migraciones
npm run db:studio     # Abrir Drizzle Studio
```

## 📦 Tecnologías Principales

- **Framework**: Next.js 15 (App Router)
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **Shadcn/UI**: Componentes UI
- **NextAuth.js v5**: Autenticación
- **Drizzle ORM**: Database ORM
- **PostgreSQL**: Base de datos
- **pgvector**: Vector embeddings
- **Vercel AI SDK**: Streaming LLM
- **LangChain**: Text splitting para RAG
- **Ollama/LocalAI**: LLM provider

## 🤝 Contribuir

Este es un proyecto educativo para el IES El Rincón. Para contribuir, contacta con el equipo de desarrollo.

## ⚠️ Notas Importantes

- **VDI con Ollama**: Asegúrate de que tu servidor VDI con Ollama/LocalAI esté accesible desde la aplicación
- **Modelos**: Los modelos recomendados son `llama3.2` para chat y `nomic-embed-text` para embeddings
- **Vector Dimensions**: El schema asume embeddings de 768 dimensiones (nomic-embed-text). Si usas otro modelo, actualiza el schema.

## 📄 Licencia

Proyecto educativo - IES El Rincón © 2026
