# 🛡️ Guía de Seguridad — ABD RAG Platform (ERA 9)

> **Versión:** 1.0 | **Última actualización:** 2026-03-02 | **Clasificación:** Interna

## 1. Modelo de Seguridad (3 Capas)

La plataforma implementa un modelo de seguridad **Defense in Depth** con tres capas independientes:

```
[Request] → Capa 1: Middleware → Capa 2: Guardian → Capa 3: Zod → [Lógica]
```

### Capa 1: Middleware (`middleware.ts`)

| Control | Implementación |
|---------|----------------|
| **Autenticación** | NextAuth v5 — Verificación de sesión JWT |
| **Rate Limiting** | Upstash Redis — 100 req/h por usuario |
| **Security Headers** | `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block` |
| **CSP** | Content Security Policy dinámica con nonces |
| **CORS** | Whitelist estricta (no `*`) |
| **Referrer Policy** | `strict-origin-when-cross-origin` |

### Capa 2: Guardian V3 (`enforcePermission`)

Sistema ABAC (Attribute-Based Access Control) que evalúa permisos basado en:
- **Recurso** (e.g., `workflow:task`, `billing:contract`)
- **Acción** (e.g., `read`, `write`, `manage`, `delete`)
- **Atributos del usuario** (rol, tenantId, tenantAccess)

```typescript
// Fail-closed: si no tiene permiso explícito, se deniega
const session = await enforcePermission('billing:contract', 'manage');
// → Si falla: AppError('FORBIDDEN', 403)
// → Si OK: retorna session con user.tenantId
```

### Capa 3: Zod Validation

```typescript
// Todo input validado ANTES de procesamiento
const InputSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'TECHNICAL', 'ENGINEERING']),
});
const validated = InputSchema.parse(body); // Lanza ZodError si falla
```

## 2. Aislamiento Multi-tenant

### SecureCollection
Toda operación de base de datos DEBE usar `getTenantCollection()`, que:

1. **Inyecta `tenantId`** automáticamente en queries
2. **Filtra resultados** para mostrar solo datos del tenant del usuario
3. **Aplica soft delete** (excluye `deletedAt` existentes)
4. **SuperAdmin** puede acceder cross-tenant (con logging)

```typescript
// El filtro de tenant se aplica AUTOMÁTICAMENTE
const collection = await getTenantCollection('cases', session);
const myCases = await collection.find({ status: 'OPEN' });
// → Internamente: { status: 'OPEN', tenantId: 'elevadores_mx', deletedAt: { $exists: false } }
```

### Clusters Segregados

| Cluster | Datos | Razón |
|---------|-------|-------|
| MAIN | Documentos, casos, workflows | Datos operativos |
| AUTH | Usuarios, tenants, permisos, MFA | Aislamiento de identidad |
| LOGS | Logs, auditoría, notificaciones | Cumplimiento normativo |

## 3. Protección de Datos (PII)

| Mecanismo | Implementación |
|-----------|----------------|
| **Cifrado en reposo** | `SecurityService.encrypt()` para campos PII |
| **PII Masking** | Sanitización automática en logs |
| **No logging de secrets** | Prohibido loguear API keys, passwords, tokens |
| **Cifrado de backups** | MongoDB Atlas Encryption at Rest |

### Campos que DEBEN cifrarse
- Emails de usuarios (si se almacenan fuera de Auth DB)
- Números de teléfono
- Documentos de identidad
- Claves API de terceros

## 4. Autenticación

| Característica | Implementación |
|---------------|----------------|
| **Login** | NextAuth v5 (Credentials + OAuth) |
| **2FA** | TOTP con códigos de respaldo (Phase 107) |
| **Sesiones** | JWT con rotación automática |
| **MFA Config** | Almacenado en AUTH DB (`mfa_configs`) |
| **Password Policy** | Mínimo 8 caracteres (configurable por tenant) |

## 5. Edge Runtime

```
⚠️ PROHIBIDO usar módulo `crypto` de Node.js en cualquier archivo
   que pueda ejecutarse en Edge Runtime.

✅ Usar globalThis.crypto.randomUUID()
✅ Usar globalThis.crypto.getRandomValues(new Uint8Array(32))
```

## 6. Variables de Entorno Sensibles

| Variable | Tipo | Nunca Loguear |
|----------|------|---------------|
| `MONGODB_URI` | Connection string | ✅ |
| `NEXTAUTH_SECRET` | JWT signing | ✅ |
| `ENCRYPTION_SECRET` | AES key | ✅ |
| `GEMINI_API_KEY` | LLM access | ✅ |
| `CLOUDINARY_API_SECRET` | Storage | ✅ |
| `UPSTASH_REDIS_REST_TOKEN` | Rate limit | ✅ |

## 7. Auditoría

Toda acción significativa se registra en `audit_trails` (LOGS DB):

```typescript
await logEvento({
  level: 'INFO',
  source: 'API_ADMIN_USERS',
  action: 'USER_ROLE_CHANGED',
  message: `Rol de ${email} cambiado a ${newRole}`,
  tenantId: session.user.tenantId,
  correlationId,
  details: { userId, oldRole, newRole },
});
```

## 8. Checklist de Seguridad para PR

- [ ] ¿Usa `enforcePermission` en el endpoint?
- [ ] ¿Pasa `session` a `getTenantCollection`?
- [ ] ¿Valida inputs con Zod ANTES de procesamiento?
- [ ] ¿Usa `AppError` (no `Error()` genérico)?
- [ ] ¿NO loguea secrets ni PII en texto plano?
- [ ] ¿NO usa `crypto` de Node.js (usa `globalThis.crypto`)?
- [ ] ¿NO usa `Access-Control-Allow-Origin: *`?
- [ ] ¿NO usa `localStorage` / `sessionStorage`?
