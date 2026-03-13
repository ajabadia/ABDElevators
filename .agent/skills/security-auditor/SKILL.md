---
name: security-auditor
description: Audita vulnerabilidades técnicas (Inyecciones, Sesiones, Headers, PII, Encriptación) y complementa a GuardianV3.
---

# Security Auditor Skill

## Cuándo usar este skill
- Cuando el usuario pida revisar la seguridad técnica de un archivo o endpoint.
- Como parte de un `app-full-reviewer` para garantizar robustez técnica.
- Para detectar inyecciones (SQL/NoSQL/Regex), fugas de PII o configuraciones de headers débiles.

## Inputs necesarios
- **Ruta del archivo**: El archivo `.ts`, `.tsx` o endpoint a auditar.

## Workflow de Auditoría Técnica

### 1. Protección de Ruta y Sesión
1. **Middleware Check**: Verifica si la ruta está incluida en el matcher de `middleware.ts`.
2. **Auth Verification**: Si es un API Route o Server Action, verifica el uso de `auth()` (NextAuth) para validar el usuario.
   - ❌ **FALLO**: Endpoint administrativo accesible sin sesión activa.
3. **ERA 9 Hardening**: En rutas API y Server Actions críticos, valida que la lógica principal esté protegida por `enforcePermission` y que los SLA (rendimiento) se midan con `withPerformanceSLA` o equivalente.

### 2. Prevención de Inyecciones y Validación (Zod First)
1. **Zod Validation**: Verifica que TODOS los inputs (`body`, `query`, `params`, `file`, **Server Actions**) se validen con un schema de Zod **antes** de procesarlos.
   - ✅ **OBLIGATORIO**: `ZodSchema.parse()` al inicio de la función. Falla grave si un Server Action no lo usa.
2.    - **MongoDB NoSQL Shield**: 
        - ✅ **OBLIGATORIO**: Uso de `MongoSanitizer.sanitize()` al procesar inputs dinámicos en queries. 
        - ✅ **OBLIGATORIO**: Uso de `ObjectIdSchema.parse()` antes de instanciar `new ObjectId()`.
        - Verificar que las conexiones globales usen el proxy `wrapDb` / `wrapCollection` (implementado en `lib/db.ts`).
    - **Neo4j**: Verificar que se usen parámetros en `runQuery(query, params)` y no concatenación de strings.
    - **Redis Security (TLS)**: 
        - ✅ **OBLIGATORIO**: En producción, forzar el uso de `rediss://` (TLS). Verificar configuración en `lib/redis.ts`.
    - **Regex Injection**: Si se usa `new RegExp()`, asegurar que el input esté sanitizado.

### 3. Privacidad y Datos Sensibles (PII & Encryption)
1. **PII Masking**: En flujos de ingesta de documentos o logs masivos, verificar el uso de `PIIMasker.mask()`.
2. **Sensitive Fields**: Verificar si el archivo maneja campos como `password`, `iban`, `dni`, `secret`.
    - ✅ **OBLIGATORIO**: Uso de `SecurityService.encrypt()` antes de persistir y `.decrypt()` al recuperar.
4. **BullMQ / Queue Security**: 
    - ✅ **OBLIGATORIO**: Datos sensibles en colas (ej. `analysis-queue`) deben cifrarse con `SecurityService.encrypt` antes de añadirse al job.
    - Verificar que los workers desencripten el payload si existe un campo `encryptedPayload`.
5. **Secret Leakage & ENV Validate**: 
    - Asegurar que no haya API Keys, tokens o URLs críticas hardcodeadas.
    - Verificar que el uso directo de `process.env.VAR` cuente con validación defensiva o lógica de fallback segura.
    - ✅ **NUEVO**: Validar presencia de `INTERNAL_API_BASE_URL` y `ALLOWED_HOSTS` para protección SSRF/Host.

### 3.5 Trazabilidad Estructurada y Logs Seguros (Regla de Oro #4)
1. **Correlation IDs**: Toda llamada a `logEvento` debe incluir explícitamente un `correlationId` para asegurar auditoría transversal (ERA 11).
2. **Protección Cero-Leak en Logs (Regla #13)**: Asegurar expresamente que los objetos crudos (Requests enteros, diccionarios de subrequest, resultados raw) no se filtren enteros en el campo `details` de `logEvento`. Usar destructuring o enmascarar (PIIMasker) siempre antes de guardar los `details`.

### 4. Headers y Rate Limiting
1. **Rate Limit Concurrente**: Verifica si el endpoint utiliza `checkRateLimit(identifier, LIMITS.X)`. Preferir limitar por `userId` o `tenantId` en lugar de limitarse a la IP, que puede ser spoofeada.
2. **Security Headers**: Si es un componente UI o middleware, verificar presencia de:
   - `Content-Security-Policy` (con Nonce para scripts).
   - `X-Content-Type-Options: nosniff`.
   - `X-Frame-Options: DENY`.

### 5. Multi-tenant Hardening (Regla de Oro #11)
1. **Secure Access**: En API Routes o Server Actions, verifica que el acceso a colecciones se realice vía `getTenantCollection` o directamente con la instancia de `SecureCollection`.
    - ❌ **RED FLAG**: Uso de `db.collection('name')` directamente (Evita el aislamiento automático y el Soft Delete).
    - ✅ **CORRECTO**: `const col = await getTenantCollection('name', session);`.

### 6. SGSI & Evidence Update (ISO 27001)
1. **Document Verification**: Evalúa si el componente auditado requiere una actualización en la carpeta `/security` (ej: nuevos riesgos en `risk-register.md` o cambios en `auth-and-session-flow.md`).
2. **SSRF & Host Validation**: Verificar que el middleware valide `Allowed Hosts` y use URLs internas seguras (`INTERNAL_API_BASE_URL`).
3. **PII Masking Audit**: Si el flujo maneja logs, verifica que el enmascaramiento implementado en `LoggingService` sea suficiente para los datos específicos tratados.

## Output (formato exacto)
1. **Status de Seguridad Técnica**: `[SEGURO | VULNERABLE | RIESGO_DETECTADO]`.
2. **Checklist de Vulnerabilidades**:
   - [ ] Inyección (Zod Validation)
   - [ ] Sesión / Auth
   - [ ] Fuga de PII / Sensibles
   - [ ] Rate Limit / Headers
   - [ ] Multi-tenant Isolation (Rule #11)
   - [ ] ISO Documentation (SGSI)
3. **Hallazgos**: Tabla con "Línea", "Categoría" y "Riesgo".
4. **Corrección Sugerida**: Código específico para mitigar el riesgo.

## Instrucciones y Reglas
- **FAIL-CLOSED**: Si no se puede verificar la seguridad de un flujo, se considera vulnerable por defecto.
- **ZOD-FIRST**: La ausencia de validación formal es un fallo de gravedad "MEDIA/ALTA".
- **ENCRYPTION-BY-DEFAULT**: Datos de identidad o financieros deben estar cifrados en DB.
- **AUDIT-SECURITY-EVENTS**: Intentos de acceso no autorizados, bloqueos de MFA o violaciones de integridad detectadas DEBEN registrarse vía `AuditTrailService.record(...)` con source `SECURITY_EVENT`.
