---
description: Audita y valida cualquier ruta o archivo nuevo/modificado según los estándares de ABD RAG Platform (Definition of Done).
---

# Code Quality Auditor - ABD RAG Platform

## Propósito

Esta skill audita **cualquier ruta o archivo nuevo o modificado** en la aplicación ABD RAG Platform, asegurando que cumple con todos los estándares de calidad, seguridad, accesibilidad, i18n, logging, y multi-tenancy definidos en la "Definition of Done".

## Cuándo Usar

- **Antes de crear** una nueva ruta API, servicio, página o componente
- **Después de modificar** código existente que afecte lógica de negocio, seguridad o UX
- **En code reviews** para validar que se cumplen todos los estándares
- **Cuando detectes** código legacy que no cumple estándares actuales

## Proceso de Auditoría

### 1. Identificar Tipología

Determina qué tipo de archivo estás auditando:

- **API Route** (`app/api/.../route.ts`)
- **Servicio de Dominio** (`lib/*-service.ts`, `services/*`, `workers/*`)
- **Página/Componente React** (`app/.../page.tsx`, `components/*`)
- **Autenticación/Seguridad** (`lib/auth.ts`, `middleware.ts`, `*-guard.ts`)
- **Logging/Auditoría** (`lib/logger.ts`, `*-audit*.ts`)

### 2. Aplicar Checklist Específica

Según la tipología, aplica la checklist correspondiente:

---

## Checklist: API Routes (`app/api/.../route.ts`)

### ✅ Autenticación y Permisos
- [ ] Usa `auth()` de `lib/auth` para obtener sesión en rutas protegidas
- [ ] Valida `rol` y `tenantId` antes de operar (ADMIN, SUPERADMIN, etc.)
- [ ] Si es API pública, valida `x-api-key` con `ApiKeyService.validateApiKey`
- [ ] Usa `enforcePermission(resource, action)` para permisos granulares

### ✅ Rate Limiting
- [ ] Rutas sensibles (auth, login, magic link) usan `checkRateLimit(ip, LIMITS.AUTH)`
- [ ] Rutas de core business usan `checkRateLimit(ip, LIMITS.CORE)`

### ✅ Validación de Entrada
- [ ] Define schema Zod en `lib/schemas.ts` o `lib/schemas/*.ts`
- [ ] Valida `req.json()` / `formData` con el schema **antes** de procesar
- [ ] Lanza `ValidationError` / `AppError` específicos, **nunca** `Error` genérico

**Ejemplo correcto**:
```typescript
const BodySchema = z.object({
  name: z.string().min(1),
  tenantId: z.string()
});

const body = await req.json();
const validated = BodySchema.parse(body); // Throws ZodError if invalid
```

### ✅ Manejo de Errores
- [ ] Captura `AppError` → `return NextResponse.json(error.toJSON(), { status: error.status })`
- [ ] Captura `ZodError` → `return NextResponse.json({ code: 'VALIDATION_ERROR', details: error.issues }, { status: 400 })`
- [ ] Otros errores → log + `INTERNAL_ERROR` 500 estándar
- [ ] **No exponer** detalles sensibles (stack traces, secretos) al cliente

**Ejemplo correcto**:
```typescript
try {
  // ... lógica
} catch (error: any) {
  if (error instanceof z.ZodError) {
    return NextResponse.json({
      code: 'VALIDATION_ERROR',
      message: 'Invalid input',
      details: error.issues
    }, { status: 400 });
  }
  if (error instanceof AppError) {
    return NextResponse.json(error.toJSON(), { status: error.status });
  }
  
  await logEvento({
    level: 'ERROR',
    source: 'API_MODULE',
    action: 'OPERATION_FAILED',
    message: error.message,
    correlationId,
    stack: error.stack
  });
  
  return NextResponse.json(
    new AppError('INTERNAL_ERROR', 500, 'Something went wrong').toJSON(),
    { status: 500 }
  );
}
```

### ✅ Logging y Auditoría
- [ ] Registra `logEvento` en operaciones importantes con:
  - `source`: identificador del módulo (ej. `API_USER_DOCS`, `API_KEYS`)
  - `action`: verbo claro (CREATE, UPDATE, DELETE, CALL_ERROR, PERFORMANCE_SLA_VIOLATION)
  - `details`: IDs de recursos, tenantId, tamaños, parámetros clave
- [ ] Para cambios de configuración, seguridad o administración, usa `AuditTrailService` (`src/lib/services/audit-trail-service`):
  - `logConfigChange`: Para cambios en settings, planes, o governance.
  - `logAdminOp`: Para operaciones manuales, scripts de mantenimiento o seeds.
  - `logDataAccess`: Para acceso a datos sensibles (PII, Reports).
- [ ] Incluye `actorType` ('USER' | 'IA' | 'SYSTEM'), `actorId`, `reason` (obligatorio en cambios críticos) y `correlationId`.

### ✅ Observabilidad y Uso
- [ ] Para operaciones RAG/LLM/vector search:
  - Crea span con `trace.getTracer(...).startActiveSpan`
  - Registra duración, `tenant.id`, `correlation.id`, resultado clave
  - Llama a `UsageService.trackLLM` / `trackVectorSearch` si aplica

### ✅ Multi-tenant y Entorno
- [ ] Filtra **siempre** por `tenantId` y `environment` donde corresponda
- [ ] Usa `getTenantCollection(collectionName, session)` para aislamiento automático
- [ ] Mantiene `industry`, `scope` y `environment` coherentes con el pipeline

### ✅ Seguridad
- [ ] **Nunca** confía en `tenantId`, `role` ni IDs que vengan del cliente
- [ ] **No devuelve** secretos (API keys completas, tokens Cloudinary, passwords)
- [ ] Usa IDs públicos o URLs pensadas para frontend

### ✅ Performance
- [ ] Mide duración (`Date.now()`) y loguea si supera SLA definido
- [ ] SLAs típicos:
  - Lectura simple: P95 < 200ms
  - Operación compleja: P95 < 500ms
  - Análisis/LLM: P95 < 2000ms

---

## Checklist: Servicios de Dominio (`lib/*-service.ts`, `workers/*`)

### ✅ Diseño y Responsabilidad
- [ ] Servicio tiene cohesión clara (ej. `MfaService`, `IngestPreparer`, `MultilingualService`)
- [ ] **No mezcla** lógica de API (req/res) dentro del servicio
- [ ] Métodos estáticos o clase singleton según convenga

### ✅ Validación y Tipos
- [ ] Valida datos de entrada con Zod **antes** de persistir en Mongo
- [ ] Define tipos de retorno explícitos (**no `any`** salvo legacy)

### ✅ Resiliencia
- [ ] Llamadas a LLMs/externos usan `executeWithResilience` y/o `withLLMRetry`
- [ ] Configura `maxRetries`, `timeout` y `backoff` adecuados
- [ ] Loguea intentos y fallos con `logEvento` (source: `LLM_RETRY`)

### ✅ Audit Trail
- [ ] Para cambios de estado importantes (FSM de ingesta, casos, relaciones):
  - Genera `correlationId` con `crypto.randomUUID()`
  - Registra `AuditTrailService.record` o método específico en cada cambio relevante
  - Asegura que se captura el estado previo (`before`) y posterior (`after`) para auditorías de diferencia.

### ✅ Errores
- [ ] Usa clases de error del dominio (`ExternalServiceError`, `NotFoundError`, etc.)
- [ ] **No usa** excepciones como control de flujo "normal"

---

## Checklist: Páginas y Componentes React (`app/*`, `components/*`)

### ✅ i18n (next-intl)
- [ ] Usa `useTranslations('namespace')` en componentes cliente
- [ ] Usa `getTranslations('namespace')` en componentes servidor
- [ ] Añade **todas** las cadenas nuevas en `messages/[locale]/[namespace].json` bajo namespace adecuado
- [ ] **Evita** texto hardcodeado en español/inglés; migra a i18n cuando se detecte

**Ejemplo correcto**:
```typescript
// Client Component
const t = useTranslations('knowledgeAssets');
<h1>{t('title')}</h1>

// Server Component
const t = await getTranslations('knowledgeAssets');
<h1>{t('title')}</h1>
```

### ✅ Accesibilidad (a11y)
- [ ] Dashboards y componentes interactivos tienen roles/aria:
  - `role="region"`, `aria-label` para bloques significativos
  - `aria-busy`, `aria-live="polite"` para estados de carga
- [ ] Formularios:
  - `<Label htmlFor={id}>` + `id` en inputs
  - `aria-describedby` para mensajes de ayuda/errores si aplica
- [ ] Modales, tabs, tablas: usa componentes de librería interna (`Dialog`, `Tabs`, `Table`) que gestionan accesibilidad

### ✅ Estados de Carga y Error
- [ ] Muestra skeleton/loader consistente mientras `isLoading`
- [ ] Muestra mensaje de error legible al usuario (y opcionalmente toast) si falla fetch
- [ ] **No deja** al usuario en pantallas en blanco sin feedback

### ✅ UX y Consistencia Visual
- [ ] Usa `PageContainer`, `PageHeader`, `ContentCard`, `MetricCard`, `Table` donde aplique
- [ ] Paginación y filtros con textos traducidos si la lista puede crecer
- [ ] Mensajes de vacío ("no hay datos") en vez de tablas vacías

### ✅ Rendimiento y Optimización (Vercel Standards)
- [ ] **Eliminación de Waterfalls**: Usa `Promise.all()` para fetches independientes (`async-parallel`).
- [ ] **Componentes de Servidor (RSC)**: La página/sección es RSC por defecto a menos que necesite interactividad (`use client`).
- [ ] **Bundle Optimization**: Evita "barrel files" e importa componentes/iconos directamente (`bundle-barrel-imports`).
- [ ] **Carga Diferida**: Usa `next/dynamic` para componentes pesados o pesados en JS (`bundle-dynamic-imports`).
- [ ] **Eficiencia de Re-render**: Memoriza componentes pesados con `memo()` y evita props no primitivas estáticas (`rerender-memo`).
- [ ] **Data Fetching**: Usa `SWR` o `React.cache()` para deduplicar peticiones (`client-swr-dedup` / `server-cache-react`).

### ✅ Arquitectura de Componentes (Composition Patterns)
- [ ] **Evita Props Booleanas**: No añadas props booleanas para personalizar comportamiento; usa composición (`architecture-avoid-boolean-props`).
- [ ] **Compound Components**: Estructura componentes complejos con contexto compartido (`architecture-compound-components`).
- [ ] **Variantes Explícitas**: Crea componentes de variante explícitos en lugar de modos booleanos (`patterns-explicit-variants`).
- [ ] **Children sobre Render Props**: Usa `children` para composición en lugar de props `renderX` (`patterns-children-over-render-props`).
- [ ] **Desacoplar Implementación**: El Provider es el único lugar que conoce cómo se gestiona el estado (`state-decouple-implementation`).

---

## Checklist: Autenticación, Seguridad y MFA

### ✅ Middleware y Rutas Protegidas
- [ ] Nuevas rutas admin/dashboard/settings están cubiertas por el middleware
- [ ] Respeta reglas:
  - No sesión → redirect a login o 401 en API
  - `mfaPending` → solo accesibles rutas permitidas cuando MFA esté activo

### ✅ MFA
- [ ] Si interactúa con MFA:
  - Asegura coherencia `users.mfaEnabled` y `mfa_configs.enabled`
  - Usa `MfaService.enable` / `MfaService.verify` en backend
  - Devuelve códigos claros (`MFA_REQUIRED`, `INVALID_MFA_CODE`) al frontend
- [ ] En login UI, gestiona estados `requiresMfa`, `mfaCode`, `mfaPending` coherentemente

### ✅ Perfil y Roles
- [ ] **No expone** `password` ni datos sensibles en APIs de perfil
- [ ] Para cambios de identidad (nombre, apellidos, puesto), exige rol ADMIN/SUPERADMIN y loguea intentos no autorizados

---

## Checklist: Logging, Auditoría y Métricas

### ✅ Logging Estructurado
- [ ] Usa `logEvento` en puntos clave:
  - Éxito de operaciones importantes
  - Errores (con stack y details)
  - Violaciones de SLA (`PERFORMANCE_SLA_VIOLATION` con duración)
- [ ] Incluye **siempre** `tenantId` cuando tenga sentido multi-tenant

### ✅ Audit Trail
- [ ] Para cambios de configuración (tipos de documentos, taxonomías, permisos, relaciones, configuraciones de tenant):
  - Registra entrada en el trail de auditoría unificado vía `AuditTrailService.logConfigChange`.
  - Especifica el `reason` del cambio si la interfaz lo permite o es una acción de administración.

### ✅ Métricas de Uso
- [ ] Para nuevas capacidades de RAG/LLM:
  - Usa `UsageService.trackLLM`, `trackVectorSearch`, `trackContextPrecision` donde encaje

---

## Checklist: i18n y Textos en Base de Datos

### ✅ Modelado de Textos
- [ ] Para entidades mostradas en UI (tipos de documento, taxonomías, plantillas):
  - Define campos multi-idioma (`nameEs`/`nameEn`) o
  - Guarda keys de i18n en DB y resuelve en frontend
- [ ] **Evita** guardar textos finales en un solo idioma si van a mostrarse al usuario final

---

## Proceso de Ejecución

### Paso 1: Leer el Archivo
```
view_file o view_code_item del archivo a auditar
```

### Paso 2: Identificar Tipología
Determina si es API Route, Servicio, Componente React, etc.

### Paso 3: Aplicar Checklist
Revisa cada ítem de la checklist correspondiente.

### Paso 4: Generar Reporte
Crea un reporte con:
- ✅ **Cumple**: Ítems que pasan la auditoría
- ⚠️ **Warnings**: Ítems que podrían mejorarse
- ❌ **Fallos Críticos**: Ítems que **deben** corregirse

### Paso 5: Proponer Fixes
Para cada fallo crítico, propone código corregido.

---

## Ejemplo de Uso

```
USER: Audita src/app/api/admin/knowledge-assets/route.ts

ASSISTANT:
1. Lee el archivo
2. Identifica: API Route
3. Aplica checklist de API Routes
4. Genera reporte:

## Auditoría: knowledge-assets/route.ts

### ✅ Cumple
- Autenticación con enforcePermission
- Validación Zod con QuerySchema
- Manejo de errores con AppError
- Logging con logEvento

### ⚠️ Warnings
- Falta rate limiting para operaciones de escritura
- No hay observabilidad (spans) para operaciones complejas

### ❌ Fallos Críticos
- NINGUNO

### Recomendaciones
1. Añadir checkRateLimit para POST/PUT/DELETE
2. Considerar añadir spans para operaciones de análisis
```

---

## Reglas Críticas

1. **NUNCA aprobar código** que:
   - No valide entrada con Zod
   - No maneje errores con AppError
   - Exponga secretos o datos sensibles
   - No tenga logging en operaciones críticas
   - No respete multi-tenancy

2. **SIEMPRE exigir**:
   - i18n para textos visibles al usuario
   - Accesibilidad básica (labels, roles, aria)
   - Logging estructurado con correlationId
   - Validación de permisos en rutas protegidas

3. **PRIORIZAR**:
   - Seguridad > Performance > UX
   - Multi-tenancy > Funcionalidad
   - Observabilidad > Código limpio

---

## Integración con Otras Skills

- **app-full-reviewer**: Usa esta skill como parte de la auditoría completa
- **guardian-auditor**: Complementa con auditoría específica de permisos
- **security-auditor**: Complementa con auditoría de vulnerabilidades técnicas
- **i18n-a11y-auditor**: Complementa con auditoría profunda de i18n/a11y
- **hygiene-reviewer**: Usa para detectar deuda técnica y patrones legacy

---

## Output Esperado

Al finalizar, genera un documento markdown con:

```markdown
# Auditoría: [Nombre del Archivo]

## Tipología
[API Route | Servicio | Componente React | etc.]

## Resumen
- ✅ Cumple: X/Y ítems
- ⚠️ Warnings: N ítems
- ❌ Fallos Críticos: M ítems

## Detalles

### ✅ Cumple
- [Lista de ítems que pasan]

### ⚠️ Warnings
- [Lista de mejoras recomendadas]

### ❌ Fallos Críticos
- [Lista de ítems que DEBEN corregirse]

## Fixes Propuestos
[Código corregido para cada fallo crítico]

## Próximos Pasos
[Acciones concretas para el desarrollador]
```

---

## Notas Finales

Esta skill es **la base** para mantener calidad consistente en toda la aplicación. Úsala **antes** de crear código nuevo y **durante** code reviews para asegurar que todo el código cumple con los estándares de ABD RAG Platform.
