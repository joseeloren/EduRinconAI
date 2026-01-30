# SECURITY.md - EduRinconAI

## 🔒 Políticas de Seguridad

Este documento describe las medidas de seguridad implementadas en EduRinconAI para proteger datos sensibles de evaluación y garantizar privacidad de los estudiantes.

## 🛡️ Control de Acceso por Roles (RBAC)

### Roles Definidos

1. **ADMIN**
   - Acceso completo a todas las funcionalidades
   - Gestión de usuarios
   - Visualización de todas las métricas

2. **TEACHER** (Profesor)
   - Crear y gestionar asistentes propios
   - Subir y gestionar documentos
   - Asignar asistentes a alumnos específicos
   - Ver analíticas de sus  propios asistentes
   - **NO PUEDE**: Ver asistentes de otros profesores (a menos que sean públicos)

3. **STUDENT** (Alumno)
   - Acceder solo a asistentes asignados explícitamente o públicos
   - Chatear con asistentes permitidos
   - **NO PUEDE**: Ver prompts del sistema
   - **NO PUEDE**: Acceder a embeddings/documentos fuera de su contexto
   - **NO PUEDE**: Ver calificaciones o datos de otros alumnos

### Implementación de RBAC

- **Middleware**: `middleware.ts` protege rutas a nivel de Next.js
- **API Routes**: Cada endpoint valida sesión y permisos
- **Database Queries**: Filtrado por `userId` y `assistantId`
- **Frontend**: Componentes condicionales según rol

## 🔐 Autenticación

### NextAuth.js v5

- **Estrategia**: JWT con cookies HTTP-only
- **Provider**: Credentials (email/password)
- **Hash**: bcryptjs con salt rounds = 10
- **Session**: Incluye `id`, `email`, `name`, `role`

### Mejores Prácticas

```typescript
// ✅ Correcto: Siempre validar sesión
const session = await auth();
if (!session?.user) {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}

// ❌ Incorrecto: Confiar en datos del cliente
const userId = request.headers.get('x-user-id'); // NUNCA hacer esto
```

## 🗄️ Seguridad en Base de Datos

### Aislamiento de Datos

Los alumnos están aislados mediante:

1. **assistant_access**: Tabla de permisos explícitos
2. **Consultas filtradas**: Siempre incluir `userId` en WHERE clauses
3. **Foreign Keys**: Cascadas `onDelete: 'cascade'` para limpieza automática

### Vector Embeddings

```typescript
// ✅ Seguro: Filtrar por assistantId antes de buscar embeddings
const contexts = await retrieveContext(query, assistantId, topK);

// ❌ Inseguro: Buscar en todos los embeddings
const contexts = await db.select().from(embeddings); // NO HACER
```

### Row Level Security (RLS) - Recomendación Futura

Para mayor seguridad, considera implementar RLS directamente en PostgreSQL:

```sql
-- Ejemplo de política RLS para embeddings
CREATE POLICY student_embeddings_policy ON embeddings
  USING (
    EXISTS (
      SELECT 1 FROM documents d
      JOIN assistants a ON d.assistant_id = a.id
      JOIN assistant_access aa ON aa.assistant_id = a.id
      WHERE d.id = embeddings.document_id
        AND aa.user_id = current_setting('app.user_id')::uuid
    )
  );
```

## 📤 Upload de Documentos

### Validaciones Implementadas

1. **Tamaño**: Máximo 10MB por archivo
2. **Tipo MIME**: Solo PDF, DOCX, TXT
3. **Permisos**: Solo profesores pueden subir
4. **Sanitización**: Nombres de archivo aleatorizados (UUID)

### Storage

- **Directorio**: `./uploads/` (fuera de `public/`)
- **Nombres**: UUID + extensión original
- **Acceso**: Solo mediante API autenticada

```typescript
// ✅ Correcto: Generar nombre único
const uniqueFilename = `${randomUUID()}${fileExtension}`;

// ❌ Incorrecto: Usar nombre original sin sanitizar
const filename = file.name; // Riesgo de path traversal
```

## 🧠 LLM y Prompts

### Protección del System Prompt

- Los alumnos **NUNCA** ven el `systemPrompt` del asistente
- Solo se envía al LLM en el backend
- Frontend solo muestra `name` y `description`

### Inyección de Prompts

Aunque el riesgo es bajo en este contexto educativo:

```typescript
// ⚠️ El contenido del usuario se pasa directamente al LLM
// Considera sanitizar si los prompts contienen instrucciones sensibles
const userMessage = sanitize(input); // Opcional
```

### Context Leakage

- RAG recupera solo documentos del `assistantId` actual
- No hay cross-contamination entre asistentes
- Las fuentes se muestran pero NO el contenido completo de otros chunks

## 🚨 Validaciones Críticas

### En cada API call de chat:

```typescript
// 1. Validar sesión
const session = await auth();

// 2. Validar existencia del asistente
const assistant = await db.select().from(assistants).where(...);

// 3. Validar acceso explícito
const hasAccess = canAccessAssistant(
  session.user.role,
  session.user.id,
  assistant.createdById,
  hasExplicitAccess,
  isPublic
);

// 4. Solo entonces, proceder
if (!hasAccess) return Response.json({ error: 'Forbidden' }, { status: 403 });
```

## 🔄 Manejo de Sesiones

### Expiración

- JWT expira según configuración de NextAuth (default: 30 días)
- Cookies son HTTP-only (no accesibles desde JavaScript)
- Secure flag en producción (solo HTTPS)

### Logout

```typescript
// Cliente
import { signOut } from 'next-auth/react';
await signOut({ callbackUrl: '/login' });

// Servidor (form action)
<form action="/api/auth/signout" method="POST">
  <button type="submit">Cerrar sesión</button>
</form>
```

## 📊 Auditoría y Logging

### Logs Recomendados

```typescript
// En producción, loggear:
console.log(`User ${userId} accessed assistant ${assistantId}`);
console.log(`Document ${documentId} uploaded by ${uploaderId}`);
console.error(`Failed auth attempt for ${email}`);
```

### Datos NO Loggear

- ❌ Passwords (ni siquiera hasheados)
- ❌ Tokens JWT completos
- ❌ Contenido completo de mensajes (solo IDs)

## 🌐 Headers de Seguridad

Añadir en `next.config.js`:

```javascript
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    },
  ];
}
```

## 🐛 Reporte de Vulnerabilidades

Si encuentras una vulnerabilidad de seguridad:

1. **NO** abras un issue público
2. Contacta directamente al equipo de desarrollo
3. Proporciona detalles técnicos y pasos para reproducir
4. Espera confirmación antes de divulgar públicamente

## ✅ Checklist de Despliegue

Antes de pasar a producción:

- [ ] `NEXTAUTH_SECRET` es una cadena aleatoria de 32+ caracteres
- [ ] `DATABASE_URL` usa SSL (`?sslmode=require`)
- [ ] Variables de entorno NO están en el código
- [ ] Docker expone solo puertos necesarios
- [ ] PostgreSQL no es accesible públicamente
- [ ] Backups automáticos configurados
- [ ] Logs de errores enviados a servicio externo (Sentry, etc.)
- [ ] Rate limiting implementado en API routes
- [ ] HTTPS/TLS configurado en el servidor
- [ ] CORS configurado correctamente

## 📚 Referencias

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NextAuth.js Security](https://next-auth.js.org/configuration/options#security)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/auth-pg-hba-conf.html)

---

**Última actualización**: Enero 2026  
**Mantenido por**: Equipo de Desarrollo EduRinconAI
