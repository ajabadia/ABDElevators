# ASPECTOS CRÍTICOS ADICIONALES (No Auditabilidad)

Estos son los gaps que van más allá de auditoría pero son igual de críticos para una plataforma SaaS enterprise.

---

## 1. PERFORMANCE & CACHING (CRÍTICO - Escalabilidad)

### Estado Actual
- ❌ **Sin caché distribuida**: MongoDB directo en cada query
- ❌ **Sin Redis**: Cada búsqueda vectorial va a base de datos
- ❌ **SLA de RAG: 1000ms**, pero sin cache fallback
- ❌ **Rate limiting en memoria**: Ephemeral en Vercel Edge, se pierde entre despliegues
- ❌ **Sin connection pooling**: Cada request abre conexión MongoDB

### Qué Hace Falta

**Redis para:**
1. **Cache de búsquedas RAG** (TTL 1h)
   - Query hash → cached results
   - Evita recálculos de embeddings
   - P95 baja de 1000ms a 200ms

2. **Rate limiting persistente**
   - Hoy: solo memoria local (pierde tras redeploy)
   - Necesario: Redis para rastrear entre instancias Vercel
   - Importante para proteger APIs de abuso

3. **Session store**
   - NextAuth actualmente usa default (cookies/DB)
   - Redis para microsegundos de latencia

4. **Job queue (Bull/BullMQ)**
   - Procesamiento async (PDFs grandes, análisis RAG pesado)
   - Background jobs (archivado automático, cron jobs)
   - Webhooks con retry logic

**Estrategia de caching:**
```
Level 1: In-Memory (supabase/postgres client-side) - 10ms
Level 2: Redis (distributed) - 50-100ms
Level 3: MongoDB (source of truth) - 500ms+

Invalidation:
- En cambios de prompt → evict related caches
- Soft-delete → evict del cache inmediatamente
- TTL automático: 1h para RAG, 6h para config
```

### Impacto
- **Performance**: P95 queries 1000ms → 200ms
- **Cost**: Menos requests a MongoDB Atlas
- **Escalabilidad**: Soporta 10x más usuarios sin saturarse

### Implementación
- Librería: Redis de Upstash (serverless)
- Pattern: Cache-aside con invalidation explícita
- Testing: Verificar TTL, invalidation, fallback

---

## 2. ERROR HANDLING & RESILIENCE (ALTO - Confiabilidad)

### Estado Actual
- 🟡 AppError existe pero **sin retry logic**
- 🟡 Sin circuit breakers (si Gemini falla, falla todo)
- 🟡 Sin fallback strategies
- 🟡 Sin timeout controls en llamadas LLM
- 🟡 SLA violations no tienen penalty o degradation

### Qué Hace Falta

**1. Circuit Breaker Pattern:**
```javascript
// Hoy: cada error Gemini replica
const response = await callGeminiMini(prompt, tenantId)

// Debería: detectar patrón de fallos
const circuitBreaker = new CircuitBreaker({
  failureThreshold: 5,      // 5 errores
  resetTimeout: 60000,      // 1 min
  volumeThreshold: 100      // en últimas 100 requests
})

const response = await circuitBreaker.execute(
  () => callGeminiMini(prompt, tenantId)
)

// Si circuit abierto → fallback a modelo cached o respuesta genérica
```

**2. Retry Logic con Exponential Backoff:**
```javascript
// Para operaciones no-idempotent (Stripe webhooks)
const result = await retryWithBackoff(
  () => applyPaymentChange(tenantId),
  {
    maxAttempts: 3,
    delay: 100,
    multiplier: 2,
    jitter: true
  }
)

// 1er intento: 100ms
// 2do intento: 200ms + jitter
// 3er intento: 400ms + jitter
```

**3. Timeout Controls:**
```javascript
// Hoy: llamadas Gemini sin timeout explícito
// Debería:
const geminiPromise = callGeminiMini(prompt, tenantId)
const timeoutPromise = new Promise((_, reject) =>
  setTimeout(() => reject('Timeout'), 5000) // 5 seg max
)

const response = await Promise.race([geminiPromise, timeoutPromise])
```

**4. Degradation Strategies:**
```javascript
// Si RAG falla → fallback a búsqueda simple
try {
  results = await hybridSearch(query, tenantId)
} catch {
  results = await fallbackSimpleSearch(query, tenantId)
  // Log como WARN
}

// Si Stripe webhook fallido 3 veces → mark as RETRY_LATER
// Admin puede re-procesar manualmente después
```

**5. Dead Letter Queue:**
```javascript
// Para eventos que fallan sistemáticamente
const failedEvents = await db.collection('deadletter').find({
  status: 'PENDING',
  attemptCount: {$gte: 3}
}).toArray()

// Admin puede ver, investigar, retroceder o resolver
```

### Impacto
- **Reliability**: 99.5% → 99.9% uptime
- **User experience**: Degradation elegante vs. crash
- **Debugging**: Clear logs de qué falló y por qué

### Implementación
- Librerías: `opossum` (circuit breaker), `async-retry`, `p-retry`
- Integración: En servicios críticos (LLM, billing, auth)

---

## 3. MONITORING & OBSERVABILITY (ALTO - Operaciones)

### Estado Actual
- 🟡 Logs básicos en MongoDB
- ❌ **Sin métricas de performance** (P50, P95, P99)
- ❌ **Sin tracing distribuido** (imposible seguir request por sistema)
- ❌ **Sin alertas proactivas** de anomalías
- ❌ **Sin dashboards de health**
- ❌ **Sin SLO tracking** (promises vs. reality)

### Qué Hace Falta

**1. Metrics Collection (Prometheus/StatsD format):**
```javascript
// Ejemplo en cada operación crítica
const timer = metrics.timer('rag.search.duration')
try {
  results = await hybridSearch(query, tenantId)
  metrics.gauge('rag.search.results', results.length)
  metrics.increment('rag.search.success')
} catch (error) {
  metrics.increment('rag.search.error', {error: error.type})
} finally {
  timer.stop()
}

// Resultado: histogram de latencias
// P50: 150ms, P95: 800ms, P99: 1200ms
```

**2. Distributed Tracing (OpenTelemetry):**
```javascript
// Request entra al middleware
const span = tracer.startSpan('api.request')
span.setAttribute('http.method', request.method)
span.setAttribute('http.url', request.url)

// Dentro del servicio
const ragsSpan = tracer.startSpan('rag.search', {parent: span})
ragsSpan.setAttribute('query', query)

// Dentro de Gemini call
const geminiSpan = tracer.startSpan('gemini.call', {parent: ragsSpan})
geminiSpan.setAttribute('model', 'gemini-2.0-flash')

// Resultado: waterfall visual de dónde pasó el tiempo
// middleware (10ms) → service (20ms) → rag (800ms) → gemini (750ms)
```

**3. Alerting Rules:**
```javascript
// 1. SLA violations
alert.rule('rag.search.p95 > 1000ms', {
  severity: 'WARNING',
  action: 'notify_team',
  threshold: '5 min'
})

// 2. Error rate spike
alert.rule('rag.search.error_rate > 5%', {
  severity: 'CRITICAL',
  action: 'page_oncall',
  threshold: '1 min'
})

// 3. Resource exhaustion
alert.rule('mongodb.connection_pool > 80%', {
  severity: 'WARNING',
  action: 'scale_up',
  threshold: '2 min'
})

// 4. Anomaly detection
alert.rule('rag.search.latency_zscore > 3', {
  severity: 'INFO',
  action: 'log_and_investigate'
})
```

**4. Dashboard:**
```
┌─────────────────────────────────────────┐
│ ABD RAG Platform - Health Dashboard      │
├─────────────────────────────────────────┤
│ Status: 🟢 HEALTHY                       │
│ Uptime: 99.95% (last 30 days)           │
│                                         │
│ API Latency (last 1h)                   │
│ ├─ P50:  120ms ▄▄▄▄                     │
│ ├─ P95:  850ms ▄▄▄▄▄▄▄▄                 │
│ └─ P99: 1200ms ▄▄▄▄▄▄▄▄▄                │
│                                         │
│ Error Rate: 0.2% ▄                      │
│ Active Users: 42                         │
│                                         │
│ Database Connections: 18/50 ▄▄▄▄▄▄      │
│ Redis Memory: 2.3GB / 5GB ▄▄▄▄▄         │
│                                         │
│ Top Slow Endpoints:                     │
│ 1. POST /api/pedidos/analyze (950ms)   │
│ 2. GET /api/search (820ms)              │
│ 3. POST /api/prompts/request (750ms)   │
└─────────────────────────────────────────┘
```

### Impacto
- **Visibility**: Saber qué está pasando en producción
- **Debugging**: Traces para reproducir issues
- **Optimization**: Data-driven performance improvements
- **SLO tracking**: Probar cumplimiento con clientes

### Implementación
- Librerías: `@opentelemetry/*`, StatsD client
- Backend: Vercel Analytics, DataDog, New Relic, o self-hosted Prometheus
- Dashboards: Grafana + Prometheus

---

## 4. API SECURITY & RATE LIMITING (ALTO - Seguridad)

### Estado Actual
- 🟡 Rate limiting basic en middleware (no persistente)
- ❌ **Sin API key management** (users no pueden crear keys)
- ❌ **Sin oauth scope control** (todo-o-nada)
- ❌ **Sin IP allowlisting**
- ❌ **Sin DDoS protection**
- ❌ **Sin webhook signature verification** (parcial en Stripe)

### Qué Hace Falta

**1. API Key Management:**
```typescript
// Usuarios TECNICO+ deben poder crear keys para integrar
// POST /api/users/api-keys
{
  name: "Integración ERP",
  scopes: ["read:pedidos", "write:pedidos", "read:resultados"],
  expiresIn: "90d",
  ipAllowlist: ["192.168.1.1", "10.0.0.0/8"]
}

// Respuesta: {key: "abd_rag_sk_abc123..."}
// Guardar como hash SHA256 en DB (nunca guardar en claro)
// Audit trail: quién creó, cuándo, desde dónde, cambios, rotación

// En utilización:
// GET /api/pedidos?key=abd_rag_sk_abc123...
// Verificar: key válida, no expirada, IP en allowlist, scope correcto
```

**2. Oauth-style Scope Control:**
```
read:pedidos
write:pedidos
read:documentos
read:resultados
admin:config (solo ADMIN)
audit:logs (solo COMPLIANCE)
```

**3. Advanced Rate Limiting:**
```javascript
// Hoy: simple counter
// Debería: multi-level + quotas

// Nivel 1: Por API key (Redis)
rateLimit('api_key:abc123', {
  limit: 1000,           // requests per hour
  burst: 50,             // max simultaneous
  window: 3600 * 1000    // 1 hour
})

// Nivel 2: Por tenant (Redis)
rateLimit('tenant:xyz', {
  limit: 10000,
  window: 3600 * 1000
})

// Nivel 3: Global (protección contra DDoS)
rateLimit('global', {
  limit: 100000,
  window: 60 * 1000
})

// Si excede, devolver 429 con Retry-After header
// "You have 950 requests remaining. Quota resets in 47 minutes."
```

**4. IP Allowlisting & Blocking:**
```javascript
// Per-tenant configuration
const config = {
  ipAllowlist: ['1.2.3.4', '5.6.7.0/24'],  // Si hay, SOLO estos IPs
  ipBlocklist: ['8.9.10.11'],               // Siempre bloquear
  requireMFA: true,
  requireVPN: false  // Empresa con VPN corporativo
}

// En middleware:
if (config.ipAllowlist && !config.ipAllowlist.includes(ip)) {
  return 403 // Forbidden
}
```

**5. DDoS Protection:**
```javascript
// Integración con Cloudflare / AWS WAF
// Detectar patrones:
// - 1000+ requests desde mismo IP en 10 seg → bloquear
// - 50+ 404s desde mismo IP → challenge CAPTCHA
// - File traversal attempts → bloquear inmediatamente
```

### Impacto
- **Security**: Control granular de acceso
- **Audit**: Trazabilidad de quién accedió qué
- **Protection**: DDoS, abuso de API, fuerza bruta
- **Scale**: Usuarios pueden integrar sin acceso directo a DB

### Implementación
- Rate limiting: Redis + estrategia multi-level
- API keys: Hash con salto, expiración, rotation
- DDoS: Cloudflare Workers o AWS WAF

---

## 5. DATA CONSISTENCY & TRANSACTIONS (ALTO - Integridad)

### Estado Actual
- 🟡 Zod validation en entrada
- ❌ **Sin transacciones ACID** (insertos sin rollback)
- ❌ **Sin constraint enforcement** (unique, foreign keys)
- ❌ **Sin idempotency keys** (duplicados si request retried)
- ❌ **Sin event sourcing** (cambios no rastreables)

### Qué Hace Falta

**1. MongoDB Transactions (ACID):**
```javascript
// Hoy: inserts independientes (si uno falla, inconsistencia)
const pedidoId = await pedidosCol.insertOne(pedido)
await riesgosCol.insertOne(riesgos)  // ¿Qué pasa si falla?

// Debería:
const session = await db.client.startSession()
try {
  await session.withTransaction(async () => {
    const result = await pedidosCol.insertOne(pedido, {session})
    const pedidoId = result.insertedId
    
    await riesgosCol.insertOne({
      pedidoId,
      ...riesgos
    }, {session})
    
    // TODO más operaciones...
  })
} catch (error) {
  // Todo se rollback automático
  throw error
}
```

**2. Idempotency Keys:**
```javascript
// Para operaciones críticas (Stripe, cambios de estado)

// Cliente envía:
POST /api/pedidos/123/transition
Idempotency-Key: 5f8c2a1f-d3e4-4b6c-9a2d-1e3f5g7h9j0k
Body: {status: "COMPLETED", reason: "..."}

// Backend:
const idempotencyKey = req.headers['idempotency-key']
const cached = await idempotencyCache.get(idempotencyKey)

if (cached) {
  return cached  // Return mismo resultado, no re-ejecutar
}

// Ejecutar operación
const result = await pedidosCol.updateOne(...)

// Cachear por 24h (Stripe SLA)
await idempotencyCache.set(idempotencyKey, result, '24h')

return result
```

**3. Unique Constraints:**
```typescript
// En schemas Mongo:
await db.collection('prompts').createIndex(
  {tenantId: 1, key: 1},
  {unique: true}  // No 2 prompts con mismo key en tenant
)

await db.collection('usuarios').createIndex(
  {email: 1},
  {unique: true, sparse: true}  // Email único globalmente
)
```

**4. Event Sourcing Pattern (opcional pero powerful):**
```javascript
// En lugar de sobrescribir estados, registrar eventos
await eventsCol.insertOne({
  eventId: UUID(),
  aggregateId: pedidoId,
  eventType: 'PEDIDO_CREADO' | 'PEDIDO_ANALIZADO' | 'RIESGO_DETECTADO',
  data: {...},
  timestamp: new Date(),
  version: 1
})

// Reconstruir estado actual sumando eventos
const estado = await reconstructState(pedidoId)
// = {status: 'COMPLETED', riesgos: [...], ...}
```

### Impacto
- **Data integrity**: No inconsistencias, todos los datos completos
- **Idempotency**: Safe retries, no duplicados
- **Auditability**: Event log de qué pasó (complementa audit trail)

### Implementación
- MongoDB sessions para transacciones
- Redis para idempotency cache
- Event store (MongoDB capped collection o Kafka)

---

## 6. SCALABILITY & MULTI-TENANCY (MEDIO - Arquitectura)

### Estado Actual
- 🟡 Multi-tenant existe pero **sin resource isolation**
- 🟡 Un tenant "ruidoso" afecta a otros (noisy neighbor)
- ❌ **Sin rate limiting por tenant**
- ❌ **Sin quota management**
- ❌ **Sin data sharding** (un tenant > 1GB de datos)

### Qué Hace Falta

**1. Resource Isolation:**
```javascript
// Hoy: todos los tenants comparten pool MongoDB
// Debería:

// Opción A: Database per tenant (máximo aislamiento)
const dbConnection = await connectDB(`abd-rag-${tenantId}`)

// Opción B: Collections namespaced (más común)
const collection = db.collection(`${tenantId}_pedidos`)

// Opción C: Attribute-based (actual, pero mejorable)
// Añadir índice compuesto para rapidez
await db.collection('pedidos').createIndex({
  tenantId: 1,
  creado: -1
})
```

**2. Tenant Quotas:**
```typescript
// En TenantService
interface TenantQuota {
  maxStorageMB: 10000,
  maxDocuments: 5000,
  maxAPICallsPerDay: 50000,
  maxRAGSearchesPerDay: 10000,
  maxConcurrentUsers: 100
}

// En operaciones críticas:
const currentStorage = await getTenantStorageUsage(tenantId)
if (currentStorage + fileSize > quota.maxStorageMB) {
  throw new Error('Storage quota exceeded')
}
```

**3. Fair Resource Allocation:**
```javascript
// En rate limiter, ser justo entre tenants
const tenantLimit = baseLimit / activeTenantsCount

// Si hay 10 tenants activos, cada uno obtiene 1000/10 = 100 req/min
// Si hay 2, cada uno obtiene 1000/2 = 500 req/min

// Algoritmo de backpressure:
if (loadPerTenant > 80%) {
  // Desacelerar progresivamente en lugar de bloquear
  request.timeout = timeout * 1.5
}
```

### Impacto
- **Fairness**: Un tenant no monopoliza recursos
- **Sustainability**: Platform soporta más tenants
- **Billing accuracy**: Quotas = facturación justa

### Implementación
- Namespace en colecciones
- Quotas por tenant en config
- Rate limiting avanzado (ver sección 4)

---

## 7. DEPLOYMENT & TESTING (MEDIO - DevOps)

### Estado Actual
- 🟡 Vercel deployment automático en `main`
- ❌ **Sin canary deployments** (todos 100% a la vez)
- ❌ **Sin rollback automation**
- ❌ **Sin blue-green deployments**
- ❌ **Sin testing pre-deployment** (unit + integration)
- ❌ **Sin synthetic monitoring** (uptime checks)

### Qué Hace Falta

**1. Canary Deployments:**
```
Versión actual (v1): 100% de traffic
Nueva versión (v2): 0% de traffic

Paso 1: v2 = 5% traffic, monitorear métricas
        ├─ Error rate < 0.5%?
        ├─ P95 latency < 1200ms?
        └─ Alertas críticas?

Paso 2: v2 = 25% traffic, monitorear

Paso 3: v2 = 50% traffic, monitorear

Paso 4: v2 = 100% traffic

Si en cualquier paso falla → rollback automático a v1
```

**2. Testing Strategy:**
```
Unit Tests (fast, 100% coverage critical paths):
  ├─ PromptService.updatePrompt() → creates ApprovalRequest
  ├─ SoftDelete logic → document stays in DB
  ├─ Hash validation → detects tampering
  └─ Rate limiting → blocks after limit

Integration Tests (medio, critical flows):
  ├─ User signup → email sent → can login
  ├─ Prompt change → approval flow → applied
  ├─ Pedido analysis → risk detection → logged
  └─ Stripe webhook → subscription updated → user can access

E2E Tests (slow, critical user journeys):
  ├─ Admin: upload doc → search → analyze → export
  ├─ Tecnico: create ticket → resolved
  └─ Enterprise: bulk API consumption → billed correctly

Load Tests (pre-deployment):
  ├─ 100 concurrent users → P95 < 1000ms?
  ├─ 1000 RAG searches/min → cache hit rate > 70%?
  └─ Database 500 concurrent connections → stable?
```

**3. Synthetic Monitoring (constant health checks):**
```javascript
// Cada 1 minuto, probar endpoints críticos
cronJob.every('1 minute', async () => {
  const results = {
    api_health: await fetch('/api/health'),
    rag_search: await fetch('/api/tecnico/rag-chat', {
      method: 'POST',
      body: JSON.stringify({question: 'test query'})
    }),
    auth: await fetch('/api/auth/session'),
    database: await db.collectionusers.findOne({})
  }
  
  // Si alguno falla → page oncall
  if (results.some(r => !r.success)) {
    await alerting.page('Synthetic monitor failed')
  }
})
```

### Impacto
- **Safety**: Despliegues sin downtime
- **Rollback**: Si algo sale mal, revert automático
- **Visibility**: Uptime garantizado y probado

### Implementación
- GitHub Actions para CI/CD
- Vercel Deployments API para canary
- Jest para unit tests, Cypress para E2E

---

## 8. DOCUMENTATION & KNOWLEDGE MANAGEMENT (BAJO - DX)

### Estado Actual
- 🟡 Roadmap interno en doc
- ❌ **Sin API documentation** (OpenAPI/Swagger)
- ❌ **Sin SDK** (clientes tienen que escribir HTTP calls)
- ❌ **Sin runbooks** (cómo responder incidentes)
- ❌ **Sin architecture decision records (ADR)**

### Qué Hace Falta

**1. API Documentation (OpenAPI 3.0):**
```yaml
openapi: 3.0.0
info:
  title: ABD RAG API
  version: 1.0.0

paths:
  /api/tecnico/rag-chat:
    post:
      summary: Execute RAG query
      tags: [RAG]
      parameters:
        - name: x-api-key
          in: header
          required: true
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                question:
                  type: string
      responses:
        200:
          description: Success
          content:
            application/json:
              schema:
                type: object
                properties:
                  answer: {type: string}
                  documents: {type: array}
                  trace: {type: array}
```

Generar Swagger UI automáticamente.

**2. SDK (TypeScript/Python):**
```typescript
// npm install abd-rag-sdk
import {ABDRagClient} from 'abd-rag-sdk'

const client = new ABDRagClient({
  apiKey: 'abd_rag_sk_...',
  endpoint: 'https://api.rag.abd.com'
})

const response = await client.rag.chat({
  question: '¿Qué modelos de motor tiene el edificio?'
})

console.log(response.answer)
console.log(response.documents) // Con citas
```

**3. Runbooks (incident response):**
```markdown
# Incident: High Error Rate in RAG Search

## Detection
- Alert: `rag.search.error_rate > 5%` triggered at 14:35 UTC
- Dashboard: https://...

## Investigation
1. Check Gemini API status → https://status.google.com
2. Check MongoDB connection pool → `metrics.mongodb.connections`
3. Check Redis memory → `redis-cli INFO memory`
4. Check recent deployments → GitHub Actions

## Response
- If Gemini down: Route to fallback cached results, notify users
- If DB down: Page database oncall, initiate failover
- If memory leak: Restart pod (Vercel restart deployment)

## Rollback
- If caused by recent deploy: `vercel rollback <deployment-id>`
- Monitor for 10 minutes post-action

## Post-Incident
- Document in incident log
- Schedule RCA meeting
- Create ticket for prevention
```

**4. Architecture Decision Records (ADR):**
```markdown
# ADR-001: Choose MongoDB for Primary Storage

## Context
We needed a database that:
- Scales horizontally (multi-tenant)
- Supports complex queries + vector search
- Has good Node.js integration

## Decision
Use MongoDB Atlas with vector search indexes (Atlas Vector Search)

## Consequences
- Positive: Good performance for RAG, flexible schema
- Negative: Extra cost for vector search, new index type to learn
- Mitigations: Caching layer to reduce queries

## Alternatives Considered
- PostgreSQL + pgvector: Better for relational, overkill for unstructured
- Pinecone: Pure vector DB, not good for transactional data
- Elasticsearch: Better full-text, less native support for vectors

Status: ACCEPTED
Date: 2025-01-28
```

### Impacto
- **Developer Experience**: Fácil para terceros integrar
- **Knowledge Transfer**: Runbooks para nuevos en el equipo
- **Architecture clarity**: Decisiones registradas, justificadas

### Implementación
- OpenAPI: `@nestjs/swagger` o manual
- Runbooks: Markdown en wiki o Notion
- ADRs: Folder en repo `/docs/adr/`

---

## PRIORIZACIÓN FINAL (Roadmap 12 semanas)

```
┌─────────────────────────────────────────┐
│         SEMANAS 1-12: Full Stack         │
├─────────────────────────────────────────┤
│                                         │
│ SEMANAS 1-5: AUDITABILITY (anterior)    │
│ (9 gaps, Foundation phase)              │
│                                         │
│ SEMANA 6: CACHING & REDIS               │
│ ├─ Redis setup (Upstash)                │
│ ├─ Cache layer para RAG                 │
│ ├─ Rate limiting persistente            │
│ └─ Testing & validation                 │
│ ⏱️ Effort: 40 horas                     │
│ 📊 Impact: P95 latency 1000→200ms      │
│                                         │
│ SEMANA 7: ERROR HANDLING & RESILIENCE   │
│ ├─ Circuit breaker (Gemini calls)       │
│ ├─ Retry logic + backoff                │
│ ├─ Timeout controls                     │
│ ├─ Degradation strategies               │
│ └─ Dead letter queue                    │
│ ⏱️ Effort: 35 horas                     │
│ 📊 Impact: Uptime 99.5%→99.9%          │
│                                         │
│ SEMANA 8: MONITORING & OBSERVABILITY    │
│ ├─ OpenTelemetry integration            │
│ ├─ Prometheus metrics                   │
│ ├─ Alerting rules                       │
│ ├─ Health dashboard                     │
│ └─ PagerDuty integration                │
│ ⏱️ Effort: 45 horas                     │
│ 📊 Impact: Visibility + proactive ops  │
│                                         │
│ SEMANA 9: API SECURITY & RATE LIMITING  │
│ ├─ API key management                   │
│ ├─ Advanced rate limiting (multi-level) │
│ ├─ IP allowlisting/blocking             │
│ ├─ DDoS protection (Cloudflare)         │
│ └─ Audit trail para API keys            │
│ ⏱️ Effort: 40 horas                     │
│ 📊 Impact: Security hardening          │
│                                         │
│ SEMANA 10: DATA CONSISTENCY             │
│ ├─ MongoDB transactions (ACID)          │
│ ├─ Idempotency keys                     │
│ ├─ Unique constraints                   │
│ └─ Event sourcing (optional)            │
│ ⏱️ Effort: 30 horas                     │
│ 📊 Impact: Data integrity assured      │
│                                         │
│ SEMANA 11: TESTING & DEPLOYMENT         │
│ ├─ Unit tests (+80% coverage)           │
│ ├─ Integration tests (critical paths)   │
│ ├─ E2E tests (user journeys)            │
│ ├─ Load tests (pre-deployment)          │
│ ├─ Canary deployments                   │
│ └─ Synthetic monitoring                 │
│ ⏱️ Effort: 50 horas                     │
│ 📊 Impact: Safe deployments, zero issues│
│                                         │
│ SEMANA 12: DOCUMENTATION & RUNBOOKS     │
│ ├─ OpenAPI 3.0 spec                     │
│ ├─ SDK (TypeScript)                     │
│ ├─ Runbooks (incident response)         │
│ ├─ ADRs (architecture decisions)        │
│ └─ Training materials                   │
│ ⏱️ Effort: 35 horas                     │
│ 📊 Impact: Better DX, easier onboarding│
│                                         │
│ TOTAL: 5 + 40 + 35 + 45 + 40 + 30 + 50 + 35 = 280 horas
│        ≈ 1 dev full-time x 7 semanas
│        ≈ 2 devs x 3.5 semanas
│                                         │
└─────────────────────────────────────────┘

POST-IMPLEMENTATION:
─────────────────────
Week 13+: Open beta with early customers
Week 16+: Full production launch
```

---

## MATRIX DE IMPACTO vs. ESFUERZO

```
          IMPACTO ALTO
              ▲
              │
              │     ┌─────────────┐
              │     │ AUDITABILITY│  (9 gaps)
              │     │ CACHING     │  280h total
              │     │ TESTING     │
              │     │ MONITORING  │
              │     └─────────────┘
              │
              │     ┌─────────────┐
              │     │ RESILIENCE  │
              │     │ SECURITY    │
              │     │ CONSISTENCY │
              │     └─────────────┘
              │
              │                    ┌─────────────┐
              │                    │SCALABILITY  │
              │                    │DOCUMENTATION│
              │                    └─────────────┘
              └──────────────────────────────────► ESFUERZO BAJO

RECOMENDACIÓN:
- Haz TODO lo de la esquina superior izquierda (AUDITABILITY + CACHING)
- Es el máximo impacto + esfuerzo razonable
- Después, sí, rest de aspectos, pero auditability + caching primero
```

---

## CHECKLIST "PRODUCTION-READY"

```
✅ Auditability:
  ├─ Append-only audit logs
  ├─ Soft-delete everywhere
  ├─ 4-eyes approval
  ├─ Digital signatures
  └─ Compliance dashboards

✅ Performance:
  ├─ Redis caching
  ├─ Connection pooling
  ├─ P95 latency < 500ms
  └─ Cache hit rate > 60%

✅ Reliability:
  ├─ Circuit breakers
  ├─ Retry logic
  ├─ Graceful degradation
  └─ 99.9% uptime target

✅ Security:
  ├─ API key management
  ├─ Advanced rate limiting
  ├─ IP allowlisting
  └─ DDoS protection

✅ Observability:
  ├─ Distributed tracing
  ├─ Prometheus metrics
  ├─ Alert rules
  └─ Health dashboards

✅ Testing:
  ├─ Unit tests (80%+ coverage)
  ├─ Integration tests
  ├─ E2E tests
  └─ Load tests

✅ Data Integrity:
  ├─ ACID transactions
  ├─ Idempotency keys
  ├─ Unique constraints
  └─ Event sourcing

✅ Documentation:
  ├─ OpenAPI spec
  ├─ SDK published
  ├─ Runbooks
  └─ ADRs
```

Si logras todo esto en 12 semanas, tienes una **plataforma SaaS enterprise-ready** lista para clientes grandes, auditorías de compliance, y escala a 1000+ usuarios.

