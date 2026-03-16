---
trigger: always_on
---

## 🎯 OBJETIVO

Este documento es tu **prompt de sistema** para pasar a Cursor, Antigrávity, o Claude cuando generes código para el proyecto RAG Ascensores.


---

## 📋 INSTRUCCIONES DE SISTEMA

### CONTEXTO DEL PROYECTO

**Proyecto:** Sistema RAG para análisis de especificaciones de pedidos de ascensores.

**Stack:**
- Frontend: Next.js 16 + React 19 + TypeScript strict
- Backend: Next.js API Routes (Route Handlers)
- Tooling: Turbopack (Build & Dev)
- DB: MongoDB Atlas
- AI/ML: Gemini API (LLM + embeddings)
- Hosting: Vercel
- UI: Tailwind CSS 4 + Shadcn UI

**Duración:** 4 semanas para MVP, luego evolución 18 meses.

**Audiencia del código:** Desarrolladores profesionales, producción desde día 1.

---

## ⚡ REGLAS NO NEGOCIABLES

Estas reglas NUNCA se rompen. Si IA las viola → PR rechazado.

### 1. TypeScript Strict Mode (ERA 8 Scoped)

```
REGLA: tsconfig.json DEBE tener "strict": true.

PROHIBICIÓN ESTRICTA (ERA 8):
❌ Prohibido `: any` en: core schemas, exported lib/services, API responses.
⚠️ Permitido `: any` (DEUDA ERA 9) en: UI internals, inline components, demo code.

VALIDACIÓN:
❌ const x: any = ... (en lib/services)
✅ const x: string = ...
✅ catch (error: unknown) { ... }

SI ROMPES: Rechazamos tu PR sin piedad.
```

### 2. Zod Validation BEFORE Processing

```
REGLA: Todos los inputs (form, query, body, file) se validan con Zod ANTES.

PATRÓN:
1. Define schema con z.object()
2. Llama .parse() AL INICIO de la función
3. SI validation falla → throw ValidationError
4. Si pasa → procesa con confianza

VALIDACIÓN:
❌ if (file.size > MAX) { ... } // Validación DESPUÉS
✅ const validated = FileSchema.parse({file})
   // Procesar validated.file

SI ROMPES: Rechazamos tu PR sin piedad.
```

### 3. AppError para Todo Error

```
REGLA: Nunca throw Error() genérico. Siempre AppError o subclass.

SUBCLASSES DISPONIBLES:
- ValidationError (400)
- DatabaseError (500)
- ExternalServiceError (503)
- NotFoundError (404)

PATRÓN:
try { ... }
catch (error) {
  if (error instanceof AppError) {
    return NextResponse.json({ code, message, details }, { status })
  }
  // Desconocido → 500
  throw new AppError('INTERNAL_ERROR', 500, 'Something went wrong')
}

SI ROMPES: Rechazamos tu PR sin piedad.
```

### 4. Structured Logging

```
RULE: Every significant event must be logged with a consistent structure.

MANDATORY:
- await logEvento({ level, source, action, message, correlationId, details })
- correlationId = Unique UUID per request
- level = DEBUG | INFO | WARN | ERROR
- source = module name (API_PEDIDOS, RAG, PDF, etc)
- details = relevant objects (timing, models, bytes, etc)

PATTERN:
const correlationId = generateUUID()
await logEvento({ level: 'INFO', source: 'API_PEDIDOS', ... , correlationId })
try { ... }
catch (error) {
  await logEvento({ level: 'ERROR', ... , correlationId, stack: error.stack })
}

IF BROKEN: Your PR will be rejected.
```

### 5. NO Browser Storage APIs

```
REGLA: NUNCA uses localStorage, sessionStorage, document.cookie, IndexedDB.
RAZÓN: Vercel Serverless → throws SecurityError.

ALTERNATIVAS:
✅ React Context (client-side state)
✅ HTTP Cookies (cookies utils server-side)
✅ NextAuth (Fase 2)

SI ROMPES: Rechazamos tu PR sin piedad.
```

### 6. Validación Cliente + Servidor

```
REGLA: Validar SIEMPRE en ambos lados.

FLUJO:
Cliente:
  1. Validar con Zod schema
  2. Si fail → mostrar error inmediato
  3. Si success → enviar al servidor

Servidor:
  1. Validar OTRA VEZ con Zod schema
  2. Si fail → ValidationError
  3. Si success → procesar

RAZÓN: Cliente es no-confiable. Servidor es fuente de verdad.

SI ROMPES: Rechazamos tu PR sin piedad.
```

### 7. Operaciones DB Atómicas

```
REGLA: Múltiples operaciones DB = usar transaction (session.withTransaction).

PROBLEMA SIN TRANSACTION:
INSERT pedido OK
UPDATE usuario FAIL
→ Inconsistencia (pedido quedó "huérfano")

SOLUCIÓN:
await session.withTransaction(async () => {
  await pedidos.insertOne(data, { session })
  await usuarios.updateOne(..., { session })
  // Si cualquiera falla → rollback automático
})

SI ROMPES: Rechazamos tu PR sin piedad.
```

### 8. Measurable Performance

```
RULE: Measure time in endpoints. Log if it exceeds SLA.

SLAs:
- /api/pedidos/analyze: P95 < 500ms, MAX 2000ms
- /api/pedidos/[id]/informe: P95 < 300ms, MAX 1000ms
- /api/admin/logs: P95 < 200ms, MAX 500ms

PATTERN:
const start = Date.now()
try { ... }
finally {
  const duration = Date.now() - start
  if (duration > THRESHOLD) {
    await logEvento({ level: 'WARN', details: { duration_ms: duration } })
  }
}

IF BROKEN: Your PR will be rejected.
```

### 9. Security Headers

```
REGLA: Todos los endpoints devuelven security headers correctos.

OBLIGATORIO (en middleware.ts):
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
- CORS whitelist (no Access-Control-Allow-Origin: *)
- Rate limiting (100 req/h por usuario)

SI ROMPES: Rechazamos tu PR sin piedad.
```

### 10. accessibility (Regla de Oro #10)

```
REGLA: Todo componente UI debe ser accesible por defecto.

OBLIGATORIO:
- Roles semánticos (main, nav, section, article).
- Atributos ARIA (aria-label, aria-describedby, aria-hidden).
- Gestión de foco (focus-visible).
- Contraste WCAG AA (mínimo 4.5:1).

SI ROMPES: Deuda técnica inaceptable.
```

### 11. Multi-tenant Harmony (Regla de Oro #1)

```
REGLA: Toda operación de DB debe realizarse a través de SecureCollection para garantizar aislamiento.

PATRÓN:
const collection = await getTenantCollection('nombre_colección', session);
// El filtro de tenantId y Soft Delete se aplica automáticamente.

VALIDACIÓN:
❌ db.collection('pedidos').find({ ... })
✅ const collection = await getTenantCollection('pedidos', session);
   await collection.find({ ... });

SI ROMPES: Riesgo de filtración de datos entre clientes. Rechazo inmediato.
```

### 12. Prompt Governance (Regla de Oro #4)

```
REGLA: Todo prompt maestro debe residir en la DB para trazabilidad y edición dinámica.

PATRÓN:
1. Definir fallback en src/lib/prompts.ts.
2. Consumir vía PromptService.getPrompt(key, tenantId).
3. Sincronizar fallbacks a DB mediante sync script si no existen.

SI ROMPES: Perdemos capacidad de ajuste en caliente.
```

### 13. Data Protection (Regla de Oro #3)

```
REGLA: Datos PII o sensibles deben cifrarse en reposo.

OBLIGATORIO:
- Uso de `SecurityService.encrypt()` para campos marcados en la ontología.
- No loguear valores sensibles en texto plano.

SI ROMPES: Violación de cumplimiento GDPR/SOC2.
```

### 18. EntityId Strict Typing (NEW ERA 12)

```
REGLA: Prohibido usar `string` para Foreign Keys (IDs de otras colecciones).

OBLIGATORIO:
- Usar `EntityIdSchema` (Zod Branded Type) para `userId`, `tenantId`, `spaceId`, etc.
- Validación asíncrona `validateExists` si el ID debe existir en DB en el momento de la creación.

SI ROMPES: Generas "Islas de Datos" e inconsistencia referencial.
```

### 19. Zero Spanish in the Data Layer (NEW ERA 15)

```
REGLA: Prohibido usar términos en castellano en la capa de datos.

OBLIGATORIO:
- Keys de base de datos (ej: `client` en lugar de `cliente`).
- Estados y Enums (ej: `ACTIVE`, `PENDING` en lugar de `vigente`, `pendiente`).
- Nombres de colecciones y campos internos.
- Códigos de error y mensajes internos no destinados al usuario.

SI ROMPES: Creas deuda técnica de internacionalización y dificultas el mantenimiento global.
```

---

### 14. Composition Patterns

```
REGLA: Preferir composición sobre props booleanas para variantes.

PATRÓN:
❌ <Button loading={true} error={false} primary={true} />
✅ <PrimaryButton icon={<Loader />} />
✅ Estructura de "Compound Components" para UI compleja (Context-based).

SI ROMPES: Deuda técnica por explosión de props.
```

### 15. Route Registry is Source of Truth (NEW ERA 8)

```
REGLA: Toda ruta debe existir en `map.md` y `route_registry.md`.

PATRÓN:
1. No crear una página sin antes categorizarla en el mapa.
2. Definir si es CANÓNICA o REDIRECT.
3. Respetar el cluster (Mis Documentos, Soporte, Audit, Tasks).

SI ROMPES: Generas navegación fantasma.
```

### 16. UI & Notification Standards (NEW ERA 8)

```
REGLA: Usar componentes DRY y una única librería de notificaciones.

ESTÁNDARES:
✅ Notificaciones: `import { toast } from 'sonner'`.
❌ Prohibido: `@/hooks/use-toast`.
✅ Dashboards: Usar `<HubPage>` y `<MetricCard>`.

SI ROMPES: Deuda visual inconsistente.
```

### 17. Fake Data Isolation (NEW ERA 8)

```
REGLA: Prohibido contaminar producción con datos fake.

MECANISMO:
1. Datos fake solo en `src/demo/`.
2. Páginas de demo etiquetadas con badge `INTERNAL DEMO`.
3. Lógica condicionada por `NEXT_PUBLIC_DEMO_MODE`.

SI ROMPES: Riesgo de filtración de mocks en Real-Estate/Ascensores.
```

---

## 🚫 RED FLAGS (RECHAZAMOS AUTOMÁTICO)

Si generas alguno de estos → PR rechazado sin Review:

```
❌ const x: any = ...
❌ console.log('API Key:', apiKey)
❌ logEvento(...) sin await
❌ db.collection('pedidos').find({}).toArray() sin .limit()
❌ Hardcoded thresholds (MAX_FILE_SIZE = 50000000)
❌ Comentarios que no matchean código
❌ function getData(email) { if (!user) return 'User not found' } // timing attack
❌ Función que hace 3 cosas distintas (responsabilidad única)
❌ Query en loop (N+1 queries)
❌ Floating promises: asyncFn() sin await
❌ Uso de términos en castellano en DB (status: 'pendiente', key: 'cliente')
```

**Cuando veas RED FLAG en prompt:** Regresa y corrige ANTES de generar código.

---

## ✅ MEJORES PRÁCTICAS

Estas son "strongly recommended" (no rechazamos si no las haces, pero mejora calidad):

### Función Pequeña & Pura

```
PATRÓN:
1. Funciones con responsabilidad única
2. Preferentemente puras (mismo input = mismo output)
3. Side effects aislados (al final)

EJEMPLO MALO:
async function analyzePedidoAndSave(file) {
  const text = await extractText(file)
  const modelos = await gemini(text)
  await db.insert(modelos)
  return { ok: true }
}

EJEMPLO BUENO:
// Pura
async function extractText(file) { return ... }
// Pura
async function extractModels(text) { return ... }
// IO
async function savePedido(data) { return ... }
// Orquestación
async function analyze(file) {
  const text = await extractText(file)
  const modelos = await extractModels(text)
  return await savePedido(modelos)
}
```

### Retry Logic

```
PATRÓN: Para llamadas externas (Gemini, MongoDB), retry con backoff.

return withRetry(
  () => extractModelsWithGemini(text),
  { maxRetries: 3, initialDelayMs: 100 }
)
```

### Idempotency Keys

```
PATRÓN: Para operaciones críticas, usar idempotency-key header.

const existing = await db.collection('requests_processed')
  .findOne({ idempotency_key: key })

if (existing) return existing.result // Idempotent

// Procesar
const result = await process(...)
await db.collection('requests_processed')
  .insertOne({ idempotency_key: key, result })
return result
```

### Distributed Tracing

```
PATRÓN: trace_id que sigue request por toda la stack.

const traceId = uuidv4()
await log({ trace_id: traceId, accion: 'INIT' })
// ... operaciones
await log({ trace_id: traceId, accion: 'EXTRACT_TEXT' })
// ... más operaciones
await log({ trace_id: traceId, accion: 'SAVE_DB' })

En producción: Axiom/Datadog agrupa por trace_id
```

### Feature Flags

```
PATRÓN: Control remoto de features sin deploy.

if (isFeatureEnabled('RAG_VECTOR_SEARCH')) {
  // Nueva búsqueda
} else {
  // Búsqueda clásica (fallback)
}
```

### React 19 Patterns

```
REGLA: Usar APIs modernas de React 19.

OBLIGATORIO:
- NO usar `forwardRef`. Pasar `ref` como una prop normal.
- Usar `use(Context)` en lugar de `useContext` para lectura condicional si aplica.
- Usar `startTransition` para actualizaciones no urgentes que puedan ser interrumpidas.
```

### Performance Optimization (Waterfalls)

```
REGLA: Evitar cascadas de promesas (Waterfalls).

PATRÓN:
❌ await getA(); await getB(); // Cascada
✅ const [a, b] = await Promise.all([getA(), getB()]); // Paralelo

MANDATORIO: Paralelizar fetches independientes en Server Components y API Routes.
```

### Localized Formatting

```
REGLA: No usar `Intl` directamente con locales hardcoded.

PATRÓN:
✅ Usar `useFormatter` de `next-intl` para moneda, números y fechas.
```

### JSDoc

```
PATRÓN: Documentar funciones públicas con JSDoc.

/**
 * Extrae texto de un PDF.
 * @param buffer - Buffer del archivo PDF
 * @returns Promise<string> - Texto extraído
 * @throws PDFError si hay error parsing
 * @example
 * const text = await extractTextFromPDF(pdfBuffer)
 */
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  ...
}
```

---

## 📝 CUANDO GENERES CÓDIGO

### Pre-Generación: Verifica

```
Antes de generar código, pregunta:
1. ¿Existe schema Zod para este input?
2. ¿Cuáles son los SLAs de performance?
3. ¿Qué AppError usamos si falla?
4. ¿Qué loguear (origen, accion)?
5. ¿Hay operaciones múltiples DB? (¿Transaction?)
6. ¿Security headers necesarios?
7. ¿Variables de entorno requeridas?

Si falta algo → SAY MISSING
Si todo está → GENERAR
```

### Post-Generación: Autocheckea

```
Después de generar, verifica:
☑️ TypeScript strict (tipos explícitos en función)
☑️ Zod schema en top (inputs validados)
☑️ AppError thrown (no Error())
☑️ logEvento() llamado con correlacion_id
☑️ No localStorage/sessionStorage
☑️ Cliente + servidor validación
☑️ Tiempo medido si endpoint
☑️ Comentarios explican PORQUÉ (no QUÉ)
☑️ No `any`
☑️ No secrets

Si falta algo → SAY FIX
Si todo está → READY FOR PR
```

---

## 🎬 EJEMPLO: CÓMO PEDIRLE CÓDIGO A IA

### Prompt Ejemplo

```
Generar endpoint POST /api/pedidos/analyze que:

REQUIREMENTS:
1. Aceptar FormData con 'file' (PDF) o 'texto' (string)
2. Validar con AnalyzePedidoSchema (ya existe en lib/schemas.ts)
3. Si PDF: extraer texto con extractTextFromPDF()
4. Analizar modelos con extractModelsWithGemini()
5. Guardarlo en MongoDB (tabla 'pedidos', atómico)
6. Log with logEvento() (source: API_PEDIDOS, action: ANALYZE_PEDIDO)
7. Return { success: true, pedido_id, numero_pedido, detectados }
8. If error: throw corresponding AppError

RULES TO FOLLOW:
- TypeScript STRICT
- Zod validation FIRST
- AppError in catches
- logEvento with correlationId
- Performance: log if > 2000ms
- No secrets, environment variables

REFERENCES:
- lib/db.ts for connectDB()
- lib/llm.ts for extractModelsWithGemini()
- lib/pdf-utils.ts for extractTextFromPDF()
- lib/logger.ts for logEvento()
- lib/errors.ts for AppError, ValidationError, DatabaseError
```

---

## 🔄 CUANDO HAY ERRORES

Si generaste código que viola reglas:

```
1. AI reconoce violación
2. Dice "REGLA VIOLATION: #X (descripción)"
3. Regenera respetando la regla
4. Añade checklist post-generación
```

---

## 📞 ESCALATION

Si hay ambigüedad sobre qué hacer:

```
ASK HUMAN:
1. ¿Qué SLA tiene este endpoint?
2. ¿Qué AppError usar si [scenario]?
3. ¿Hay schema Zod para este input?
4. ¿Performance crítica o no?

NUNCA ADIVINES. SI NO SABES → PREGUNTA.
```

---

## 🚀 RESUMEN EJECUCIÓN

**Para cada línea de código que generes:**

1. ✅ Seguir 10 reglas no negociables
2. ✅ Aplicar 10 mejores prácticas donde aplique
3. ✅ Evitar RED FLAGS
4. ✅ Incluir tipos, validación, error handling, logging
5. ✅ Auto-checklist post-generación
6. ✅ Si duda → preguntar a human

**Resultado:** Código production-ready, zero deuda técnica.

---

## 📋 REFERENCIA RÁPIDA

| Necesito | Archivo |
|----------|---------|
| Tipos/Interfaces | `lib/schemas.ts` |
| Validación | `lib/schemas.ts` (Zod) |
| DB Connection | `lib/db.ts` |
| Gemini/LLM | `lib/llm.ts` |
| PDF Parsing | `lib/pdf-utils.ts` |
| Logging | `lib/logger.ts` |
| Errors | `lib/errors.ts` |
| Retry Logic | `lib/retry.ts` |
| Performance | `middleware.ts` |
| Security Headers | `middleware.ts` |
| Feature Flags | `lib/featureFlags.ts` |
| Cookies | `lib/cookies.ts` |

---

## ✨ FINAL

Estos son tus límites y expectativas.

Respetarlos = código excelente.  
Romperlos = PR rechazado sin piedad.

**¿Entiendes estas reglas?**

Si IA: "Sí, entiendo completamente. Listo para generar código production-ready respetando todas las reglas."

Si Humano: Copia esto en Cursor/Antigrávity y comienza.

---

**Documento:** Instrucciones Master para IA  
**Versión:** 1.2 (ERA 12 Alignment)  
**Vigente:** 9 de marzo de 2026+  
**Aplicabilidad:** 100% de código generado por IA