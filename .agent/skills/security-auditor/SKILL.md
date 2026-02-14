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

### 2. Prevención de Inyecciones y Validación (Zod First)
1. **Zod Validation**: Verifica que TODOS los inputs (`body`, `query`, `params`, `file`) se validen con un schema de Zod **antes** de procesarlos.
   - ✅ **OBLIGATORIO**: `ZodSchema.parse()` al inicio de la función.
2. **Database Injections**:
   - **MongoDB**: Evitar queries dinámicas construidas con strings. Usar operadores de objeto seguros.
   - **Neo4j**: Verificar que se usen parámetros en `runQuery(query, params)` y no concatenación de strings.
   - **Regex Injection**: Si se usa `new RegExp()`, asegurar que el input esté sanitizado.

### 3. Privacidad y Datos Sensibles (PII & Encryption)
1. **PII Masking**: En flujos de ingesta de documentos o logs masivos, verificar el uso de `PIIMasker.mask()`.
2. **Sensitive Fields**: Verificar si el archivo maneja campos como `password`, `iban`, `dni`, `secret`.
   - ✅ **OBLIGATORIO**: Uso de `SecurityService.encrypt()` antes de persistir y `.decrypt()` al recuperar.
3. **Secret Leakage**: Asegurar que no haya API Keys, tokens o URLs críticas hardcodeadas (Uso de `process.env`).

### 4. Headers y Rate Limiting
1. **Rate Limit**: Verifica si el endpoint utiliza `checkRateLimit(identifier, LIMITS.X)`.
2. **Security Headers**: Si es un componente UI o middleware, verificar presencia de:
   - `Content-Security-Policy` (con Nonce para scripts).
   - `X-Content-Type-Options: nosniff`.
   - `X-Frame-Options: DENY`.

### 5. Multi-tenant Hardening (Regla de Oro #11)
1. **Secure Access**: En API Routes o Server Actions, verifica que el acceso a colecciones se realice vía `getTenantCollection` o directamente con la instancia de `SecureCollection`.
   - ❌ **RED FLAG**: Uso de `db.collection('name')` directamente (Evita el aislamiento automático y el Soft Delete).
   - ✅ **CORRECTO**: `const col = await getTenantCollection('name', session);`.

## Output (formato exacto)
1. **Status de Seguridad Técnica**: `[SEGURO | VULNERABLE | RIESGO_DETECTADO]`.
2. **Checklist de Vulnerabilidades**:
   - [ ] Inyección (Zod Validation)
   - [ ] Sesión / Auth
   - [ ] Fuga de PII / Sensibles
   - [ ] Rate Limit / Headers
   - [ ] Multi-tenant Isolation (Rule #11)
3. **Hallazgos**: Tabla con "Línea", "Categoría" y "Riesgo".
4. **Corrección Sugerida**: Código específico para mitigar el riesgo.

## Instrucciones y Reglas
- **FAIL-CLOSED**: Si no se puede verificar la seguridad de un flujo, se considera vulnerable por defecto.
- **ZOD-FIRST**: La ausencia de validación formal es un fallo de gravedad "MEDIA/ALTA".
- **ENCRYPTION-BY-DEFAULT**: Datos de identidad o financieros deben estar cifrados en DB.
- **AUDIT-SECURITY-EVENTS**: Intentos de acceso no autorizados, bloqueos de MFA o violaciones de integridad detectadas DEBEN registrarse vía `AuditTrailService.record(...)` con source `SECURITY_EVENT`.
