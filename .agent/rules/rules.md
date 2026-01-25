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
- Frontend: Next.js 15 + React 19 + TypeScript strict
- Backend: Next.js API Routes
- DB: MongoDB Atlas
- AI/ML: Gemini API (LLM + embeddings)
- Hosting: Vercel

**Duración:** 4 semanas para MVP, luego evolución 18 meses.

**Audiencia del código:** Desarrolladores profesionales, producción desde día 1.

---

## ⚡ REGLAS NO NEGOCIABLES

Estas reglas NUNCA se rompen. Si IA las viola → PR rechazado.

### 1. TypeScript Strict Mode

```
REGLA: tsconfig.json DEBE tener:
- "strict": true
- "noImplicitAny": true
- "strictNullChecks": true

VALIDACIÓN:
❌ const x: any = ...
❌ function f(x) { ... }
✅ const x: string = ...
✅ function f(x: string): void { ... }

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

### 4. Logging Estructurado

```
REGLA: Todo evento importante se loguea con estructura consistente.

OBLIGATORIO:
- await logEvento({ nivel, origen, accion, mensaje, correlacion_id, detalles })
- correlacion_id = UUID único por request
- nivel = DEBUG | INFO | WARN | ERROR
- origen = nombre del módulo (API_PEDIDOS, RAG, PDF, etc)
- detalles = objetos relevantes (tiempos, modelos, bytes, etc)

PATRÓN:
const correlacion_id = generateUUID()
await logEvento({ nivel: 'INFO', origen: 'API_PEDIDOS', ... , correlacion_id })
try { ... }
catch (error) {
  await logEvento({ nivel: 'ERROR', ... , correlacion_id, stack: error.stack })
}

SI ROMPES: Rechazamos tu PR sin piedad.
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

### 8. Performance Medible

```
REGLA: Medir tiempo en endpoints. Loguear si excede SLA.

SLAs:
- /api/pedidos/analyze: P95 < 500ms, MAX 2000ms
- /api/pedidos/[id]/informe: P95 < 300ms, MAX 1000ms
- /api/admin/logs: P95 < 200ms, MAX 500ms

PATRÓN:
const inicio = Date.now()
try { ... }
finally {
  const duracion = Date.now() - inicio
  if (duracion > THRESHOLD) {
    await logEvento({ nivel: 'WARN', detalles: { duracion_ms } })
  }
}

SI ROMPES: Rechazamos tu PR sin piedad.
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

### 10. NO Secrets en Código

```
REGLA: Nunca hardcodear API keys, tokens, URLs. Variables de entorno SIEMPRE.

VARIABLES:
❌ const GEMINI_API_KEY = "AIzaSyXxxx"
✅ const apiKey = process.env.GEMINI_API_KEY
✅ const publicUrl = process.env.NEXT_PUBLIC_APP_URL (para frontend)

ALMACENAMIENTO:
- Local: .env.local (en .gitignore)
- Producción: Vercel dashboard (no en código)

SI ROMPES: Rechazamos tu PR sin piedad.
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
6. Loguear con logEvento() (origen: API_PEDIDOS, accion: ANALIZAR_PEDIDO)
7. Devolver { success: true, pedido_id, numero_pedido, modelos_detectados }
8. Si error: throw AppError correspondiente

REGLAS A SEGUIR:
- TypeScript STRICT
- Zod validation FIRST
- AppError en catches
- logEvento con correlacion_id
- Performance: loguear si > 2000ms
- No secrets, variables de entorno

REFERENCIAS:
- lib/db.ts para connectDB()
- lib/llm.ts para extractModelsWithGemini()
- lib/pdf-utils.ts para extractTextFromPDF()
- lib/logger.ts para logEvento()
- lib/errors.ts para AppError, ValidationError, DatabaseError
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
**Versión:** 1.0  
**Vigente:** 21 de enero de 2026+  
**Aplicabilidad:** 100% de código generado por IA