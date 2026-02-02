# 📋 Guía de Onboarding para IA Programadora
## Proyecto: ABD RAG Platform (Next.js + MongoDB + RAG Enterprise)

**Versión:** 1.0  
**Tiempo estimado de lectura:** 15-20 minutos  
**Prioridad:** CRÍTICA - Leer en orden

---

## 🎯 FASE 1: Contexto Global (5 minutos)

### 1.1 Archivos de Entrada Obligatorios
Leer primero estos 3 archivos para entender el "qué" y el "porqué":

1. **`/package.json`**
   - Identificar dependencias críticas: `next-auth`, `mongodb`, `zod`, `framer-motion`, `@radix-ui/*`
   - Notar scripts disponibles (`dev`, `build`, `lint`)

2. **`/next.config.js` (o .mjs)`**
   - Verificar configuración de imágenes (Cloudinary)
   - Variables de entorno expuestas al cliente
   - Rewrites/redirects si existen

3. **`/src/app/layout.tsx`**
   - Estructura de providers (ThemeProvider, SessionProvider, NextIntlClientProvider)
   - Tipografía (Geist Sans/Mono)
   - Metadatos y SEO base

### 1.2 Entender el Propósito
Este NO es un CRUD simple. Es una **plataforma de conocimiento técnico inteligente** para industrias reguladas (ascensores, equipos industriales). Cada línea de código debe considerar:
- Multi-tenancy estricto (aislamiento de datos por organización)
- Compliance normativo (trazabilidad completa, GDPR)
- Procesamiento de PDFs con IA (RAG)

---

## 🏗️ FASE 2: Arquitectura Base (5 minutos)

### 2.1 Sistema de Autenticación y Seguridad
**Orden de lectura:**
1. **`/src/lib/auth.config.ts`** → Configuración de NextAuth (providers, callbacks)
2. **`/src/lib/auth.ts`** → Helpers de autorización (`requireSuperAdmin`, `requireAuth`)
3. **`/src/middleware.ts`** → Protección de rutas, redirecciones por rol

**Aspectos críticos a notar:**
- Roles jerárquicos: `SUPER_ADMIN` > `ADMIN` > `ENGINEERING` > `TECHNICAL`
- El `tenantId` viene en la sesión y DEBE filtrar TODAS las queries
- Middleware "Fail Closed": Si falla, deniega acceso (no permite bypass)

### 2.2 Conexión a Datos
**Orden de lectura:**
1. **`/src/lib/db.ts`** → Conexión a MongoDB (AuthDB + Business DB)
2. **`/src/lib/db-tenant.ts`** → `getTenantCollection()` - **FUNCIÓN CRÍTICA**
3. **`/src/lib/schemas.ts`** → Esquemas Zod base (User, Tenant, etc.)

**Patrón arquitectónico clave:**
```typescript
// SIEMPRE usar getTenantCollection en lugar de db.collection directo
const collection = await getTenantCollection('pedidos', session);
// Esto automáticamente inyecta el filtro { tenantId: session.user.tenantId }
2.3 Manejo de Errores y Logging
Leer:
/src/lib/errors.ts → Clases AppError, ValidationError, NotFoundError
/src/lib/logger.ts → logEvento() - Toda operación debe loguearse
Regla de Oro:
Todo endpoint DEBE envolver su lógica en try-catch y usar handleApiError() o logEvento(). El correlationId es obligatorio para trazabilidad.
🧠 FASE 3: Sistemas Core (8 minutos)
3.1 Entity Engine (El "Cerebro")
Archivos esenciales:
/src/core/engine/EntityEngine.ts (o donde esté definido)
/src/app/api/core/entities/[type]/route.ts → API universal
/src/components/shared/DynamicFormModal.tsx → UI generada dinámica
Concepto a entender:
Las entidades (pedidos, equipos, clientes) NO son clases estáticas. Se definen en una ontología (configuración) y el sistema genera automáticamente:
Formularios
Tablas
Validaciones
APIs
Campos especiales a reconocer:
searchable: true → Se indexa para búsqueda
encrypted: true → Se cifra con SecurityService
type: 'relation' → Referencia a otra entidad
3.2 Workflow Engine
Archivos esenciales:
/src/lib/workflow-service.ts (o similar)
/src/app/api/admin/workflow-definitions/route.ts
/src/components/workflow/WorkflowStatusBar.tsx
Concepto clave:
Máquina de estados finita (FSM) donde:
Los estados son configurables por tenant (colores, nombres)
Las transiciones requieren permisos (allowedRoles)
Se puede requerir firma digital (requiresSignature: true)
El historial es append-only (nunca se borra)
3.3 Sistema RAG (IA/Vectorial)
Archivos esenciales:
/src/lib/rag-service.ts → hybridSearch(), generación de embeddings
/src/app/api/admin/ingest/route.ts → Procesamiento de PDFs
/src/services/ingest-service.ts → Lógica de chunking
Flujo de datos:
Copy
PDF Upload → Cloudinary → Text Extraction → Chunking → Embeddings → MongoDB (Atlas Vector Search)
                                                    ↓
Query Usuario → Embedding → Vector Search + Text Search → Re-rank (si existe) → Prompt Gemini → Respuesta
Colecciones importantes:
knowledge_assets → Metadatos de documentos
document_chunks → Fragmentos vectoriales
rag_evaluations → Métricas de calidad (faithfulness, relevance)
🎨 FASE 4: Patrones de Frontend (5 minutos)
4.1 Hooks Genéricos (NO usar useEffect directo para data fetching)
Leer:
/src/hooks/useApiList.ts → Para listados con paginación
/src/hooks/useApiItem.ts → Para detalle de entidades
/src/hooks/useApiMutation.ts → Para POST/PUT/DELETE
/src/hooks/useFormModal.ts → Gestión de modales CRUD
Ejemplo de uso correcto:
TypeScript
Copy
// ✅ BIEN
const { data, isLoading, refresh } = useApiList<Entity>({
  endpoint: entity.api.list,
  dataKey: 'entities'
});

// ❌ MAL - No hacer fetch directo en useEffect
useEffect(() => {
  fetch('/api/entities').then(...) 
}, []);
4.2 Componentes UI Base
Leer:
/src/components/ui/page-container.tsx → Layout de páginas
/src/components/ui/data-table.tsx → Tablas dinámicas
/src/components/ui/content-card.tsx → Cards consistentes
Diseño visual:
Usar Tailwind con clases utilitarias
Paleta: Slate (grises) + Teal (acento) + colores semánticos (Emerald, Amber, Rose)
Dark mode soportado vía dark: prefix
Tipografía: Geist Sans (UI), Geist Mono (datos/código)
4.3 Internacionalización (i18n)
Usar next-intl
Textos hardcodeados en español en algunas partes, inglés en otras → Mantener consistencia del contexto
Si el archivo está en /app/(authenticated)/(admin)/, probablemente sea español
Si es código core/utils, inglés
⚠️ FASE 5: Reglas de Negocio Críticas (OBLIGATORIO)
5.1 Seguridad y Multi-tenancy (VIOLAR = BUG CRÍTICO)
REGLA #1: Aislamiento de Tenant
TypeScript
Copy
// SIEMPRE filtrar por tenantId en queries
const filter = userRole === 'SUPER_ADMIN' 
  ? {} 
  : { tenantId: session.user.tenantId };

// NUNCA devolver datos de otro tenant
REGLA #2: Validación Zod ANTES de procesar
Todo input de usuario (body, query params, formData) debe pasar por Zod antes de tocar la DB.
REGLA #3: Campos Cifrados
Si un campo tiene encrypted: true en la ontología:
Usar SecurityService.encrypt() al guardar
Usar SecurityService.decrypt() al leer
Nunca loguear el valor descifrado
REGLA #4: Auditoría
Toda operación de escritura debe loguearse:
TypeScript
Copy
await logEvento({
  level: 'INFO' | 'WARN' | 'ERROR',
  source: 'NOMBRE_MODULO',
  action: 'NOMBRE_ACCION',
  message: 'Descripción',
  correlationId,
  details: { /* datos no sensibles */ }
});
5.2 Performance (SLAs)
El código tiene SLAs definidos:
Listados: < 200ms
Operaciones de escritura: < 1000ms
Ingesta de PDFs: < 20000ms (async si es posible)
Si una operación supera el SLA, loguear WARN:
TypeScript
Copy
if (duration > 1000) {
  await logEvento({
    level: 'WARN',
    source: 'API_XXX',
    action: 'PERFORMANCE_SLA_VIOLATION',
    message: `Operación lenta: ${duration}ms`,
    details: { durationMs: duration }
  });
}
5.3 Manejo de Archivos
Subida: Siempre a Cloudinary, nunca al filesystem local
URLs: Usar getPDFDownloadUrl() para generar URLs firmadas si es necesario
Soft Delete: Nunca borrar físicamente documentos de Cloudinary (compliance). Marcar como obsoleto en DB.
✅ CHECKLIST: Antes de Escribir Código
Para nuevas APIs (route.ts):
[ ] ¿Está el archivo en la ruta correcta (/api/[área]/...)?
[ ] ¿Importa auth() y verifica el rol adecuado?
[ ] ¿Extrae tenantId de la sesión y filtra queries?
[ ] ¿Usa Zod para validar inputs?
[ ] ¿Genera correlationId con crypto.randomUUID()?
[ ] ¿Envuelve la lógica en try-catch con handleApiError?
[ ] ¿Loguea la operación con logEvento?
[ ] ¿Mide tiempo de ejecución para detectar SLA violations?
Para nuevos Componentes:
[ ] ¿Usa useApiList/useApiItem para data fetching?
[ ] ¿Maneja estados de loading con skeletons?
[ ] ¿Usa componentes UI base (PageContainer, ContentCard)?
[ ] ¿Implementa optimistic updates si es mutación?
[ ] ¿Es responsive (mobile-first)?
Para nuevas Entidades (Entity Engine):
[ ] ¿Definió la ontología en el EntityEngine?
[ ] ¿Marcó campos sensibles como encrypted: true?
[ ] ¿Marcó campos buscables como searchable: true?
[ ] ¿Creó los índices MongoDB necesarios?
📚 FASE 6: Deep Dive por Área (Según la Tarea)
Si vas a trabajar en Autenticación/Autorización:
Revisar /src/app/api/auth/[...nextauth]/route.ts
Revisar /src/app/api/auth/invite/* (sistema de invitaciones)
Revisar /src/app/api/auth/mfa/* (autenticación multifactor)
Nota: Los usuarios se crean en authDb (MongoDB auth), no en business DB
Si vas a trabajar en RAG/IA:
Revisar /src/lib/rag-service.ts
Revisar /src/app/api/admin/ingest/*
Revisar /src/app/api/admin/knowledge-base/*
Nota: Los chunks deben incluir tenantId y status (vigente/obsoleto)
Si vas a trabajar en Workflows:
Revisar /src/lib/workflow-service.ts
Revisar /src/lib/workflow-engine.ts
Revisar /src/app/api/cases/[id]/transition/route.ts
Nota: Las transiciones pueden requerir firma digital (campo signature)
Si vas a trabajar en Billing/Facturación:
Revisar /src/lib/billing-service.ts
Revisar /src/lib/stripe.ts
Revisar /src/app/api/billing/*
Nota: Los planes se definen en pricing_plans collection
🔍 FASE 7: Debugging y Troubleshooting
Dónde buscar cuando algo falla:
Error de autenticación:
Verificar middleware.ts (matcher config)
Verificar auth.config.ts (callbacks session/jwt)
Logs en application_logs con source: 'AUTH'
Error de datos (datos no aparecen):
Verificar getTenantCollection está filtrando correctamente
Verificar índices en MongoDB (db.collection.getIndexes())
Verificar que el dataKey en useApiList coincida con la respuesta API
Error de RAG (respuestas malas):
Revisar rag_evaluations para ver scores de faithfulness
Verificar que los chunks tengan status: 'vigente' (no obsoleto)
Revisar logs de source: 'RAG_SERVICE'
Error de performance:
Buscar logs con action: 'PERFORMANCE_SLA_VIOLATION'
Revisar si hay N+1 queries (faltan $lookup o populate)
Verificar índices en campos de búsqueda frecuentes
🚀 Comandos Útiles para Empezar
bash
Copy
# Instalar dependencias
npm install

# Variables de entorno necesarias (.env.local)
# - MONGODB_URI (business DB)
# - MONGODB_AUTH_URI (auth DB)
# - NEXTAUTH_SECRET
# - CLOUDINARY_CLOUD_NAME, API_KEY, API_SECRET
# - GEMINI_API_KEY (o OPENAI_API_KEY)
# - STRIPE_SECRET_KEY (si trabajas en billing)

# Modo desarrollo
npm run dev

# Verificar tipos (obligatorio antes de commit)
npm run type-check

# Linting
npm run lint
📞 Escalación
Si encuentras algo que no está documentado aquí o no sigue estos patrones:
Buscar archivos similares existentes y copiar el patrón
Revisar /src/lib/README.md (si existe)
Consultar logs de application_logs para ver cómo se comporta en producción
Recuerda: Este es un sistema enterprise de misión crítica. La consistencia y seguridad son más importantes que la velocidad de desarrollo. Cuando dudes, sé más restrictivo (Fail Closed).
Fin de la Guía. Bienvenido al proyecto. 🚀