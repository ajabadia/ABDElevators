# ABD RAG - Bank-Grade Auditability: Análisis de Gaps

**Fecha**: 28 Enero 2026  
**Versión**: 1.0 - Revisión Inicial  
**Confidencialidad**: Interno ABD

---

## RESUMEN EJECUTIVO

Tu plataforma tiene **buenas bases** para auditabilidad:
- ✅ Middleware con correlation IDs globales (`X-Correlacion-ID`)
- ✅ Sistema de logs estructurado (`logEvento` en DB)
- ✅ Rate limiting y control de acceso por roles
- ✅ Tracking de uso de IA (tokens, búsquedas)
- ✅ Webhooks de Stripe con signature verification

**Pero faltan elementos críticos de "grado bancario"**:
- ❌ **No hay inmutabilidad de registros de auditoría** (los logs se pueden borrar/editar sin dejar traza)
- ❌ **No hay firma digital en operaciones críticas** (solo en workflows, nunca validadas)
- ❌ **Ciclo de vida de datos sin políticas explícitas**: qué ocurre cuando se borra, cuánto se retiene, dónde se archiva
- ❌ **Segregación de funciones incompleta**: un ADMIN puede crear, editar Y borrar prompts sin intervención de otro rol
- ❌ **No hay cadena de hash para detectar modificaciones post-facto**
- ❌ **Auditoría de borrados insuficiente**: `DELETE` no deja registro inmutable de qué se borró
- ❌ **Cifrado de logs en tránsito/reposo no explícito** (asumiendo que Vercel/MongoDB lo hacen)
- ❌ **No hay pistas de auditoría de cambios en configuración de seguridad** (MFA, roles, permissions)

---

## I. GAPS ARQUITECTÓNICOS CRÍTICOS

### 1. **Immutabilité de Auditoría (CRÍTICO)**

**Estado Actual:**
- Logs se guardan en `logsaplicacion` con `timestamp`, `origen`, `accion`, `correlacionid`
- Cualquier usuario con acceso DB podría eliminar/modificar logs directamente
- No hay cadena de custodia de quién accedió a los logs

**Qué Falta:**
- **Append-only audit log**: Una colección `audittraildogs` que NUNCA acepta UPDATE/DELETE, solo INSERT
  - Cada log debe tener hash SHA-256 del log anterior (chain-of-custody)
  - Campos inmutables: `id`, `hash`, `previousHash`, `timestamp`, `data`, `signature`
  
- **Segregación de acceso a logs**:
  - SPA admin NO puede acceder a `audittrail` directamente
  - Solo una API de lectura "segura" con autenticación fuerte y rate limiting estricto
  - Cada lectura de logs AUDITAR en una colección separada: "quién consultó auditoría en qué momento"

- **Archivado periódico**:
  - Cada 30 días, exportar `audittrail` completa a archivo Cloudinary/S3 firmado (HMAC SHA-256)
  - Borrar logs "operacionales" (INFO/DEBUG) tras 90 días, mantener ERROR/WARN/SECURITY indefinidamente

**Impacto**: Sin esto, no pasarías una auditoría de cumplimiento (GDPR, ISO 27001, estándares bancarios).

---

### 2. **Operaciones de Borrado sin Trazabilidad Inmutable (CRÍTICO)**

**Estado Actual:**
```javascript
// En doc-service.ts, cleanup scripts, etc.
await collection.deleteOne({ id })
// ❌ Simplemente se borra del histórico de auditoría
```

Luego:
- Si un usuario malicioso (o un incidente de seguridad) borró documentos, no hay prueba de qué se borró, quién, cuándo, desde dónde

**Qué Falta:**

- **Soft-delete pattern** para todas las colecciones críticas:
  ```
  - Nunca borrar directamente
  - Agregar campos: deleted: boolean, deletedBy: string, deletedAt: Date, deleteReason: string
  - Crear índices en {deleted: 1, tenantId: 1} para filtros
  ```

- **Colección `deleteddata` immutable** que guarde un snapshot completo:
  ```
  {
    deletionId: UUID,
    entityType: "pedido" | "documento" | "prompt" | "usuario",
    entityId: ObjectId,
    tenantId: string,
    deletedBy: email,
    deleteReason: string (obligatorio),
    deleteMethod: "ui" | "api" | "batchjob" | "admin",
    correlacionid: string,
    snapshotBefore: {...full document},
    ipAddress: string,
    userAgent: string,
    timestamp: Date,
    hash: SHA256(snapshotBefore + deletionId + timestamp),
    approvedBy?: string (si requiere escalación),
    complianceContext?: { gdprRequest: bool, legalHold: bool }
  }
  ```

- **Validación de Delete**:
  - Ciertos tipos (documentos de auditoría, firma de contratos, análisis de riesgos) NUNCA se pueden borrar
  - Solo pueden marcarse como "archived" (readonly soft-delete)
  - Otro rol (COMPLIANCE) debe aprobar borrados de datos sensibles

**Impacto**: Cumplimiento GDPR, trazabilidad de incidentes, forensics post-incidente.

---

### 3. **Segregación de Funciones Incompleta (ALTO)**

**Estado Actual:**
- ADMIN puede: crear prompts, editar prompts, borrar prompts, ver historial de versiones
- No hay separación entre "quién propone un cambio" y "quién lo aprueba"

**Qué Falta:**

- **Cuatro Ojos (Four-Eyes) en Prompts**:
  - TECNICO o INGENIERIA propone cambio de prompt
  - ADMIN debe aprobar explícitamente (firma digital, comentario)
  - Si nadie aprueba en 7 días, se revierte automáticamente (compliance fail-safe)

- **Segregación de Workflows**:
  - TECNICO no puede cambiar el estado de "INANALYSIS" a "COMPLETED"
  - Debe ser ADMIN o SUPERVISOR (nuevo rol)
  - Cada transición requiere anotación de "quién + por qué"

- **Segregación de Roles para Datos Sensibles**:
  - Un nuevo rol `COMPLIANCE` o `AUDITOR` solo lectura para:
    - Ver logs de auditoría
    - Ver historial de cambios
    - Exportar reportes
  - NO puede editar datos operacionales

**Impacto**: Prevención de fraude, separación de responsabilidades.

---

### 4. **Falta de Firma Digital en Operaciones Críticas (ALTO)**

**Estado Actual:**
- En `WorkflowLogSchema` hay campo `signature`, pero:
  - Nunca se valida la firma (solo se guarda string)
  - No hay PKI (certificados), solo texto libre
  - No hay timestamp de quién la creó

**Qué Falta:**

- **Firma Digital Real** para:
  1. Aprobación de prompts (antes de activarlos en producción)
  2. Transiciones de workflow críticas (INANALYSIS → COMPLETED)
  3. Cambios en configuración de MFA/roles de usuario
  4. Borrados de datos (si los haces irreversibles)

- **Estructura de Firma**:
  ```
  {
    signatureId: UUID,
    signedBy: { email, userId, rol },
    signatureMethod: "pkcs7" | "jwt" | "hmacsha256",
    signatureValue: "base64-encoded-signature",
    certificateThumbprint?: string,
    timestamp: Date,
    ipAddress: string,
    signatureAlgorithm: "SHA256WithRSA" | "ECDSA",
    validated: boolean,
    validationError?: string
  }
  ```

- **Validación on-read**:
  - Cada vez que se lee un documento firmado, validar la firma
  - Si falla, loguear como SECURITY.SIGNATURE_VERIFICATION_FAILED
  - Mostrar advertencia al usuario

**Implementación**:
- Usar Node.js `crypto` o librería como `node-rsa` para PKCS#7
- Almacenar certificados privados en AWS Secrets Manager o HashiCorp Vault (no en código)
- Para MVP, puedes usar HMAC-SHA256 del documento + secret del admin

---

### 5. **Ciclo de Vida de Datos Sin Políticas Explícitas (ALTO)**

**Estado Actual:**
- Los datos se guardan indefinidamente
- No hay política de qué sucede tras 1, 5, 7 años
- Ni hay diferencia entre "datos activos" y "datos archivados"

**Qué Falta:**

- **Data Retention Policy**:
  ```
  EntityType          | Active Retention | Archive Duration | Permanent Deletion
  ─────────────────────────────────────────────────────────────────────────────
  Pedidos             | 3 años           | 5 años total     | Cumplimiento GDPR
  Documentos Técnicos | Indefinido       | Cloud Archive    | Nunca*
  Prompts (versiones) | 2 años           | 5 años           | Nunca (audit trail)
  Logs (INFO/DEBUG)   | 90 días          | 1 año Archive    | Nunca (compliance)
  Logs (ERROR/WARN)   | Indefinido       | Indefinido       | Nunca
  Usuarios (deletados)| —                | 2 años soft      | GDPR + firma legal
  Usuarios (activos)  | Indefinido       | —                | —
  MFA/Auth logs       | 2 años           | 5 años           | Nunca
  Evaluaciones RAG    | 6 meses          | 2 años           | Nunca
  ```

- **Colección `dataretentionpolicy`**:
  ```
  {
    entityType: string,
    tenantId: string,
    activeRetentionMonths: number,
    archiveRetentionMonths: number,
    allowDeletion: boolean,
    requiresApprovalForDeletion: boolean,
    complianceReason: string,
    lastReviewedAt: Date,
    nextReviewAt: Date
  }
  ```

- **Job programado (Vercel Cron)** cada 1º del mes:
  1. Identificar documentos "aging out" según policy
  2. Mover a colección `archived_ENTITYTYPE` con timestamp de archivado
  3. Crear entrada en `audittrail` documentando el archivado
  4. Si es GDPR deletion request, añadir contexto legal

---

### 6. **Criptografía de Logs No Explícita (MEDIO)**

**Estado Actual:**
- Asumes que Vercel + MongoDB manejan TLS/cifrado
- Pero no hay cifrado a nivel de documento (field-level encryption)
- Un DBA podría leer logs en claro

**Qué Falta:**

- **Field-Level Encryption** para logs sensibles:
  ```javascript
  // Campos a cifrar en audittrail:
  - userAgent
  - ipAddress
  - performedBy (email del usuario)
  - detalles (en algunos casos)
  
  // Campos NO cifrados (necesarios para búsquedas):
  - timestamp
  - correlacionid
  - nivel
  - accion
  - tenantId
  ```

- **Key Management**:
  - Usar AWS KMS o Google Cloud KMS para rotación automática de claves
  - Claves por `tenantId` (multi-tenancy encryption)
  - Auditar cada acceso a claves

- **CMEK (Customer-Managed Encryption Keys)** en MongoDB Atlas:
  - Configurar en Vercel Deployments
  - Certificar cumplimiento SOC 2 Type II

---

### 7. **Auditoría de Cambios de Configuración Ausente (ALTO)**

**Estado Actual:**
- Cuando un ADMIN activa/desactiva MFA de un usuario, solo se loga en `logsaplicacion`
- Si se modifica un prompt, se guarda versión pero sin "quién decidió cambiar qué"
- No hay "change log" de configuraciones de seguridad

**Qué Falta:**

- **Colección `configaudittrial`** para cada cambio de:
  ```
  - Prompts (template, variables, active status)
  - MFA settings (enable/disable, recovery codes regenerated)
  - User roles/permissions (add/remove roles)
  - Tenant settings (billing, industry, custom settings)
  - Workflow definitions (transitions, conditions)
  - Rate limiting rules
  - API keys (generation, rotation, revocation)
  
  Schema:
  {
    configChangeId: UUID,
    configType: "prompt" | "mfa" | "role" | "tenant" | "workflow" | "ratelimit" | "apikey",
    entityId: ObjectId,
    tenantId: string,
    changedBy: { email, userId, rol },
    previousValue: {...},
    newValue: {...},
    changeReason: string (obligatorio),
    approvedBy?: { email, userId, timestamp },
    correlacionid: string,
    ipAddress: string,
    timestamp: Date,
    hash: SHA256(previousValue + newValue + changedBy),
    complianceContext?: { requiresApproval: bool, approved: bool }
  }
  ```

- **Pre-approval** para cambios críticos:
  - Cambiar prompt activo → requiere ADMIN + otro rol aprobando
  - Activar/desactivar MFA → SUPERADMIN solo
  - Cambiar roles de usuario → ADMIN + COMPLIANCE

---

### 8. **Falta de Alertas de Anomalías en Tiempo Real (MEDIO)**

**Estado Actual:**
- Logs se escriben pero no hay alertas automáticas
- Si hay 100 fallos de autenticación en 1 minuto, nadie lo sabe hasta revisar dashboards

**Qué Falta:**

- **Real-time anomaly detection**:
  ```
  - 5+ failed MFA attempts desde misma IP en 5 min → bloquear IP + alertar ADMIN
  - Usuario TECNICO accediendo a /admin/globals → email a ADMIN inmediatamente
  - Prompt modificado 10 veces en 1 hora → posible ataque → freezar ediciones
  - Búsqueda RAG con 1000+ queries en 1 min → DDoS → rate limit más estricto
  - Borrado de 100+ documentos en 5 min → probably malicious → require escalation
  ```

- **Tabla `securityalerts`**:
  ```
  {
    alertId: UUID,
    alertType: "BRUTE_FORCE" | "UNAUTHORIZED_ACCESS" | "ANOMALOUS_ACTIVITY" | "DATA_EXFIL" | "CONFIG_CHANGE",
    severity: "INFO" | "WARN" | "CRITICAL",
    tenantId: string,
    userId?: string,
    correlacionid?: string,
    description: string,
    metadata: {...},
    detectedAt: Date,
    acknowledgedBy?: { email, timestamp },
    resolvedAt?: Date,
    incidentId?: string
  }
  ```

- **Webhook a Slack/PagerDuty** para CRITICAL alerts

---

### 9. **Validación de Integridad de Datos No Periódica (MEDIO)**

**Estado Actual:**
- No hay verificación periódica de que los datos en DB no han sido "tocados"

**Qué Falta:**

- **Data Integrity Checks** (job semanal):
  ```
  1. Recalcular hash de cada documento crítico
     - hash = SHA256(serialize(document))
     - Comparar con hash guardado al crear/modificar
  2. Si no coincide → log SECURITY.DATA_INTEGRITY_VIOLATION
  3. Generar reporte para compliance officer
  4. Si es producción → desactivar lectura de ese documento hasta investigar
  ```

- **Campos de integridad en documentos**:
  ```javascript
  // Para documentos críticos (casos, análisis de riesgo, prompts activos):
  {
    ...data,
    integrityHash: "sha256:...",
    integrityCheckedAt: Date,
    integrityStatus: "VALID" | "TAMPERED" | "UNVERIFIED"
  }
  ```

---

## II. MATRIZ DE TRAZABILIDAD POR OPERACIÓN

Esta matriz muestra qué se debería loguear en cada operación y DÓNDE MEJORAR:

### Leyenda
- 🟢 **COMPLETO**: Ya se loga adecuadamente con detalles suficientes
- 🟡 **PARCIAL**: Se loga pero faltan detalles o inmutabilidad
- 🔴 **FALTA**: No se loga o es insuficiente
- **Colección**: Dónde guardarlo (`logsaplicacion`, `audittrail`, `configaudittrail`, `deleteddata`)

---

### **AUTENTICACIÓN & SESIONES**

| Operación | Estado | Qué Se Loga Hoy | Qué Falta | Colección | Mejora |
|-----------|--------|-----------------|-----------|-----------|--------|
| Login exitoso | 🟡 | Email, timestamp, IP | Failed attempts count (últimas 24h), geoIP, user agent completo | `audittrail` | Agregar geoIP fingerprinting, detectar anomalías |
| Login fallido (3+ intentos) | 🟡 | Intento fallido | Bloqueo automático de IP tras 5 intentos, alert a ADMIN | `audittrail` + `securityalerts` | Crear alerta automática en tiempo real |
| MFA Setup iniciado | 🟡 | User ID | QR generado, secret (no loguear), intent, completado/abandonado | `audittrail` | Registrar si fue abandonado tras 10 min |
| MFA Setup completado | 🟡 | User ID, datetime | Recovery codes count, device fingerprint, IP | `configaudittrail` | Requerir SUPERADMIN approval |
| MFA desactivado | 🔴 | Nada explícito | Por qué?, quién lo pidió, approbación requerida | `configaudittrail` + `securityalerts` | **CRÍTICO: Agregar 2FA para deshabilitar MFA** |
| Logout | 🟢 | Session ID, timestamp | Duración total de sesión, acciones en sesión | `audittrail` | Agregar resumen de acciones |
| Logout (timeout/inactividad) | 🟡 | Timeout | Tiempo inactivo exacto, sesiones abiertas restantes | `audittrail` | Log automático |
| Session hijacking detectado | 🔴 | Nada | Bloquear sesión inmediatamente, invalidar tokens, notificar usuario | `securityalerts` | **CRÍTICO: Implementar detección** |

---

### **USUARIOS & ROLES**

| Operación | Estado | Qué Se Loga Hoy | Qué Falta | Colección | Mejora |
|-----------|--------|-----------------|-----------|-----------|--------|
| Usuario creado | 🟡 | Email, rol, tenant | Invitación enviada?, aceptada?, IP del creador, metadatos | `audittrail` | Registrar si invitación fue aceptada |
| Usuario aceptó invitación | 🟡 | Email, timestamp | IP, user agent, duración "invitación pendiente" | `audittrail` | Loguear automáticamente |
| Rol asignado | 🟡 | User ID, rol nuevo | Rol anterior, cambio de permisos, aprobado por quién | `configaudittrail` | Requerir aprobación de SUPERADMIN/COMPLIANCE |
| Rol removido | 🟡 | User ID, rol antiguo | Acceso perdido a qué recursos, IP de quien lo removió | `configaudittrail` | Registrar recursos accesibles perdidos |
| Usuario desactivado | 🟡 | User ID, datetime | Razón del desactivo, por quién, acciones inmediatas (sesiones cerradas?) | `audittrail` | Registrar si sesiones fueron cerradas |
| Usuario eliminado (GDPR) | 🔴 | Nada estructurado | Snapshot completo guardado antes de borrar, GDPR context, aprobación | `deleteddata` | **CRÍTICO: Soft-delete + GDPR audit trail** |
| Cambio de contraseña | 🟡 | User ID | Hash anterior NO loguear, solo que fue cambiada, IP, user agent, 2FA requerido después | `audittrail` | Requerir MFA para cambiar password |
| Reset contraseña solicitado | 🟡 | Email, timestamp | Token enviado, expiración, intent (usuario vs admin) | `audittrail` | Log automático + email confirmation |
| Reset contraseña completado | 🟡 | User ID | IP de quien completo, IP original de solicitud, diferencia de tiempo | `audittrail` | Detectar reset por terceros |

---

### **PROMPTS & CONFIGURACIÓN**

| Operación | Estado | Qué Se Loga Hoy | Qué Falta | Colección | Mejora |
|-----------|--------|-----------------|-----------|-----------|--------|
| Prompt creado | 🟡 | Key, versión, template | Creado por quién, industria, número de variables, aprobado?, status | `audittrail` + `configaudittrail` | Requerir aprobación antes de activar |
| Prompt editado | 🟡 | Key, versión nueva, cambios | Cambios específicos (diff), razón de edición, aprobado por quién | `configaudittrail` | Requerir 2 firmas (propuesta + aprobación) |
| Prompt versión anterior recuperada | 🟡 | Key, versión target | Razón del rollback, aprobado por quién, fecha de cambio | `configaudittrail` | Loguear como "rollback" explícitamente |
| Prompt activado/desactivado | 🟡 | Key, status | Ambiente (DEV/PROD), razón, aprobado por quién, fallback anterior | `configaudittrail` | Requerir ADMIN approval + firma digital |
| Prompt evaluación automática | 🟡 | Metrics (faithfulness, etc.) | Modelo usado (Gemini version), threshold usado, aprobado o rechazado | `ragevaluations` | Log si rechazó automáticamente cambio |

---

### **DOCUMENTOS & INGESTA**

| Operación | Estado | Qué Se Loga Hoy | Qué Falta | Colección | Mejora |
|-----------|--------|-----------------|-----------|-----------|--------|
| Documento subido | 🟡 | Filename, MD5, bytes, chunks | Usuario, IP, user agent, industria, tipo doc, duración procesamiento, storage (Cloudinary ID) | `auditingest` | Agregar validación de duplicados |
| Documento duplicado detectado | 🟡 | Filename, MD5 coincide con X | Acción tomada (reutilizar vs procesar nuevo), aprobación | `audittrail` | Loguear decisión tomada + usuario |
| OCR procesado | 🟡 | Documento ID, chunks | Errores de OCR%, idioma detectado, modelos encontrados, duración | `audittrail` | Log si OCR tasa de error > 10% |
| Embedding generado | 🟡 | Chunk count, duracion | Modelo embedding (Gemini 004), dimensiones, tokens consumidos | `audittrail` | Loguear fallo si embedding falla |
| Documento archivado | 🟡 | Doc ID, datetime | Razón, aprobado por quién, chunks también archivados? | `audittrail` | Log automático |
| Documento eliminado (borrado) | 🔴 | Nada | Snapshot completo guardado ANTES, razón, aprobación requerida, firma | `deleteddata` | **CRÍTICO: Implementar soft-delete + approval** |
| Documento marcado obsoleto | 🟡 | Doc ID, status | Razón, por quién, usuarios notificados?, referencia RAG actualizada | `audittrail` | Log automático de notificaciones |

---

### **RAG & BÚSQUEDAS**

| Operación | Estado | Qué Se Loga Hoy | Qué Falta | Colección | Mejora |
|-----------|--------|-----------------|-----------|-----------|--------|
| Búsqueda RAG ejecutada | 🟢 | Query, resultados count, duracion, modelo | Usuario, IP, estrategia (hybrid vs pure), índice usado, recall%, precision% | `audittrail` | Agregar SLA violation tracking |
| Búsqueda fallida | 🟡 | Error mensaje | Error tipo (no docs encontrados?, timeout?, modelo indisponible?), reintentado?, fallback usado | `audittrail` | Log automático de fallbacks |
| Embedding generado (búsqueda) | 🟢 | Query, embedding success | Tokens consumidos, duración, modelo version | `audittrail` | Loguear tokens para billing |
| Hallucination detectado | 🟡 | Score hallucination | Prompt usado para detectar, modelo juez, respuesta regenerada?, usuario notificado | `audittrail` | Notificar usuario automáticamente |
| Evaluación RAG (RAGAs) | 🟢 | Metrics (faithfulness, etc.) | Modelo evaluador, threshold usado, feedback humano recibido | `ragevaluations` | Agregar feedback loop |
| Resultado RAG cacheado | 🔴 | No se loga explícitamente | TTL cache, hit/miss, comparación con versión actual, documento obsoleto?, razón | `audittrail` | **Implementar cache audit trail** |
| Citación de documento fallida | 🔴 | No se loga | Documento no encontrado?, hash no coincide?, razón, usuario impactado | `securityalerts` | **CRÍTICO: Log si cita no validable** |

---

### **ANÁLISIS DE RIESGOS & CASOS**

| Operación | Estado | Qué Se Loga Hoy | Qué Falta | Colección | Mejora |
|-----------|--------|-----------------|-----------|-----------|--------|
| Análisis de riesgos iniciado | 🟡 | Pedido ID, duración | Contexto RAG utilizado, prompt usado, usuario, IP, correlacion ID | `audittrail` | Log automático |
| Riesgo detectado | 🟡 | Hallazgo, severidad, mensaje | Referencia RAG comprobada?, sugerencia?, aprobado por TECNICO?, impacto | `audittrail` + `configaudittrail` | Requerir validación humana de CRITICAL |
| Riesgo desestimado | 🔴 | No se loga | Por quién, razón, email de justificación, firma | `configaudittrail` | **Implementar "dismiss with reason"** |
| Caso transitado a nuevo estado | 🟡 | From/to estado, rol | Comentario, firma, aprobación requerida?, checklist status | `audittrail` + `configaudittrail` | Requerir firma digital validada |
| Caso completado/resuelto | 🟡 | Case ID, status COMPLETED | Duración total, usuario quien completó, documentación, archivado automáticamente? | `audittrail` | Log si completado sin análisis |
| Caso reabierto | 🔴 | No se loga explícitamente | Razón de reapertura, por quién, estado anterior restaurado?, nueva investigación | `configaudittrail` | **Implementar reopen audit trail** |
| Caso eliminado | 🔴 | Nada | Snapshot guardado ANTES, razón legal, aprobación requerida, GDPR context | `deleteddata` | **CRÍTICO: Soft-delete + approval** |

---

### **FACTURACIÓN & BILLING**

| Operación | Estado | Qué Se Loga Hoy | Qué Falta | Colección | Mejora |
|-----------|--------|-----------------|-----------|-----------|--------|
| Webhook Stripe recibido | 🟡 | Event type, timestamp, customer ID | Signature verificada?, IP de Stripe validada?, evento duplicado? | `audittrail` | Log automático de validación |
| Suscripción creada | 🟡 | Customer ID, price ID, tier | Promoción aplicada?, período de billing, status inicial | `audittrail` | Log automático |
| Suscripción actualizada | 🟡 | Customer ID, tier anterior/nuevo | Razón cambio (upgrade/downgrade/renewal?), duración, precio anterior | `configaudittrail` | Log automático |
| Suscripción cancelada | 🟡 | Customer ID, reason | Razón (user-initiated, chargeback, suspension?), período de notificación, email enviado | `configaudittrail` | Log automático de emails |
| Pago exitoso | 🟢 | Customer ID, amount, currency | Invoice ID, período de facturación, método pago | `audittrail` | Log automático |
| Pago fallido | 🟡 | Customer ID, amount, error | Intento #, reintentos pendientes, email notificación enviado, cuenta suspendida?, firma | `audittrail` + `configaudittrail` | Loguear automáticamente intentos de retry |
| Overage charge aplicado | 🟡 | Tenant ID, tokens/storage adicional | Límite excedido, tarifa overage, confirmación usuario, fecha factura | `audittrail` | Log automático de confirmación |
| Factura exportada/descargada | 🔴 | No se loga explícitamente | Usuario, IP, fecha descarga, formato (PDF/JSON), hash de archivo | `audittrail` | **Implementar download audit trail** |
| Información fiscal modificada | 🔴 | No se loga | Cambios específicos, aprobado por quién, validación legal, firma | `configaudittrail` | **CRÍTICO: Agregar audit trail fiscal** |

---

### **ACCESO & PERMISOS**

| Operación | Estado | Qué Se Loga Hoy | Qué Falta | Colección | Mejora |
|-----------|--------|-----------------|-----------|-----------|--------|
| Página/recurso accedido | 🟡 | Middleware rate limit check | Usuario, rol, IP, user agent, duración en página, acciones ejecutadas | `audittrail` | Log automático de acceso por rol |
| Acceso denegado (403) | 🟡 | User role, pathname | Usuario, IP, recurso solicitado, rol requerido vs actual, email notificación? | `securityalerts` | Log automático como alert WARN |
| Permission check fallido | 🟡 | Middleware validation | Usuario, rol, permisos requeridos, recomendación al admin | `securityalerts` | Log automático |
| API key generada | 🔴 | No se loga | Usuario, IP, intent (purpose), scopes, expiración, email confirmación | `configaudittrail` | **CRÍTICO: Agregar API key audit trail** |
| API key rotada | 🔴 | No se loga | API key antigua invalidada?, razón, nuevas scopes?, período gracia | `configaudittrail` | **CRÍTICO: Implementar rotación audit trail** |
| API key revocada | 🔴 | No se loga | Razón, por quién, aplicaciones impactadas, notificación enviada | `configaudittrail` | **CRÍTICO: Implementar revocation audit trail** |

---

### **SISTEMA & INFRAESTRUCTURA**

| Operación | Estado | Qué Se Loga Hoy | Qué Falta | Colección | Mejora |
|-----------|--------|-----------------|-----------|-----------|--------|
| Error de aplicación (500) | 🟡 | Error message, stack | Correlación ID, usuario (si identificado), recurso, duración antes de error | `audittrail` | Loguear automáticamente todos 5XX |
| Timeout/SLA violation | 🟡 | Duración > X ms | Usuario, operación, endpoint, modelo usado, causa probable | `securityalerts` | Loguear como WARN con alerta |
| Conexión DB fallida | 🟡 | Connection error | Duración reconexión, intentos, impacto (cuántas requests afectadas), incident ID | `securityalerts` | Log automático + alert CRITICAL |
| Rate limit excedido | 🟢 | IP, requests count | Usuario (si identificado), razón probable, action (block/delay) | `audittrail` | Log automático |
| Backup ejecutado | 🔴 | No se loga | Duración, tamaño, destino, hash/signature, usuario que lo triggeró, éxito/fallo | `audittrail` | **Implementar backup audit trail** |
| Backup restaurado | 🔴 | No se loga | Desde cuándo, duración, verificación integridad, aprobación requerida, incidente asociado | `configaudittrail` + `securityalerts` | **CRÍTICO: Implementar restore audit trail** |
| Despliegue a producción | 🔴 | No se loga | Versión anterior, nueva versión, cambios (git diff?), aprobado por quién, duración | `configaudittrail` | **Implementar deployment audit trail** |
| Feature flag activado/desactivado | 🔴 | No se loga | Flag name, estado anterior/nuevo, razón, experimento asociado, aprobado por quién | `configaudittrail` | **Implementar feature flag audit trail** |

---

## III. PLAN DE IMPLEMENTACIÓN (ROADMAP)

### **Fase 1: Foundation (Semanas 1-2)** — CRÍTICO
- [ ] Crear colección `audittrail` con constraints (no delete/update)
- [ ] Crear colección `deleteddata` con snapshot schema
- [ ] Crear colección `configaudittrail` para cambios de configuración
- [ ] Crear colección `securityalerts` para anomalías
- [ ] Implementar append-only pattern con verificación de integridad (hash cadena)
- [ ] Agregar campos immutable a todas las colecciones críticas

### **Fase 2: Segregación (Semanas 3-4)** — ALTO
- [ ] Implementar 4-eyes approval para cambios de prompts
- [ ] Crear rol `COMPLIANCE` o `AUDITOR` (solo lectura)
- [ ] Implementar soft-delete en lugar de DELETE directo
- [ ] Audit trail para cambios de configuración de seguridad
- [ ] Requerir aprobación para desactivar MFA

### **Fase 3: Firma Digital (Semanas 5-6)** — ALTO
- [ ] Implementar HMAC-SHA256 o PKCS#7 para firmas críticas
- [ ] Validación de firma on-read
- [ ] PKI management (AWS Secrets Manager para claves privadas)
- [ ] Requerir firma en: aprobación de prompts, transiciones críticas, cambios de roles

### **Fase 4: Retención & Ciclo de Vida (Semanas 7-8)** — MEDIO
- [ ] Definir políticas de retención por entidad
- [ ] Implementar job de archivado mensual (move a `archived_*`)
- [ ] Exportar logs trimestrales a S3/Cloudinary con HMAC-SHA256
- [ ] GDPR request workflow (soft-delete con contexto legal)

### **Fase 5: Alertas & Monitoreo (Semanas 9-10)** — MEDIO
- [ ] Real-time anomaly detection (5+ failed logins, etc.)
- [ ] Webhook a Slack/PagerDuty para CRITICAL alerts
- [ ] Data integrity checks (hash verificación semanal)
- [ ] Dashboard de compliance (logs, alerts, incidents)

### **Fase 6: Cifrado & Seguridad (Semanas 11-12)** — MEDIO
- [ ] Field-level encryption para logs sensibles
- [ ] AWS KMS o Google Cloud KMS key rotation
- [ ] CMEK en MongoDB Atlas
- [ ] Certificación SOC 2 Type II

---

## IV. CHECKLIST DE "BANK-GRADE AUDITABILITY"

- [ ] Todos los logs en colección append-only (`audittrail`)
- [ ] Cadena de hash SHA-256 para integridad temporal
- [ ] Soft-delete en todas las entidades sensibles
- [ ] Snapshot completo en `deleteddata` antes de borrado
- [ ] Firma digital validada en cambios críticos (prompts, roles, MFA, transiciones)
- [ ] Segregación de funciones (4-eyes approval)
- [ ] Rol COMPLIANCE/AUDITOR solo-lectura
- [ ] Políticas explícitas de retención de datos
- [ ] Archivado automático de datos aging
- [ ] Cifrado field-level de logs sensibles
- [ ] Alertas en tiempo real de anomalías
- [ ] Data integrity checks periódicos
- [ ] Auditoría de cambios de configuración (MFA, roles, API keys)
- [ ] Rate limiting + detección de abuso
- [ ] Notificaciones por email de cambios de seguridad
- [ ] Documentación completa de políticas de auditoría
- [ ] Cumplimiento GDPR (derecho al olvido, DPIA)
- [ ] Trazabilidad de backups/restauros
- [ ] Trazabilidad de despliegues a producción
- [ ] Reporte de compliance mensual automatizado

---

## CONCLUSIÓN

Tu base es **sólida pero incompleta** para "grado bancario". Los gaps críticos (inmutabilidad, soft-delete, segregación) son implementables en 8-12 semanas con disciplina. La buena noticia: ya tienes correlation IDs, logging y tracking de uso. La mala: sin los 9 gaps arquitectónicos, no pasarías una auditoría de ISO 27001 o cumplimiento financiero.

**Recomendación**: Prioriza **Fase 1 + Fase 2** (inmutabilidad + soft-delete + segregación) antes de llevar a clientes financieros o empresariales.

---

**Documento preparado por**: AI Expert - Jan 28, 2026
**Siguiente revisión**: Post-implementación Fase 2 (estimada Semana 4)
