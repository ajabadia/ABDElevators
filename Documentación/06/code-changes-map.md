# LOCALIZACIÓN DE CAMBIOS EN EL CÓDIGO

Este documento mapea los 9 gaps con las líneas/funciones exactas del código que hay que modificar.

---

## 📍 GAP 1: IMMUTABILIDAD (liblogger.ts + schemas)

### Archivos a modificar:
- `src/lib/logger.ts` - función `logEvento`
- `src/lib/schemas.ts` - agregar `LogAuditTrailSchema`, `AuditTrailEntrySchema`
- `src/lib/db.ts` - crear índices en colecciones append-only

### Cambios específicos:

**1. En `src/lib/schemas.ts`, AÑADIR:**
```
- LogAuditTrailSchema (colección "audittrail" - append-only)
  Campos: id, hash, previousHash, timestamp, data, signature, tenantId
  
- AuditTrailEntrySchema (estructura de cada entrada)
  Campos: action, userId, ipAddress, userAgent, details, correlationId
  
- ConfigAuditTrailSchema (cambios de configuración)
  Campos: configType, entityId, changedBy, previousValue, newValue, 
          changeReason, approvedBy, timestamp, hash
  
- SecurityAlertSchema (anomalías detectadas)
  Campos: alertType, severity, tenantId, userId, description, detectedAt, 
          acknowledgedBy, resolvedAt
  
- DeletedDataSchema (snapshot de lo que se borró)
  Campos: deletionId, entityType, entityId, deletedBy, deleteReason, 
          snapshotBefore, correlacionid, timestamp, hash
```

**2. En `src/lib/logger.ts`, REEMPLAZAR `logEvento`:**

Cambiar de:
```typescript
// Hoy guarda en logsaplicacion (actualizable/borrrable)
await db.collection('logsaplicacion').insertOne(logData)
```

A:
```typescript
// Nuevo: guardar en audittrail (append-only)
const previousEntry = await db.collection('audittrail')
  .findOne({}, {sort: {timestamp: -1}})
  
const hash = calculateHash({
  ...logData,
  previousHash: previousEntry?.hash || 'genesis'
})

const auditEntry = {
  ...logData,
  hash,
  previousHash: previousEntry?.hash || 'genesis'
}

await db.collection('audittrail').insertOne(auditEntry)
// Nota: logsaplicacion puede seguir existiendo para búsquedas rápidas,
//       pero la fuente de verdad es audittrail
```

**3. En `src/lib/db.ts`, AGREGAR:**
```typescript
async function createAppendOnlyIndexes() {
  const db = await connectDB()
  
  // Validación de schema para evitar UPDATE/DELETE
  await db.collection('audittrail').createIndex({timestamp: 1})
  await db.collection('audittrail').createIndex({correlacionid: 1})
  await db.collection('audittrail').createIndex({hash: 1})
  
  // Lo mismo para deleteddata, configaudittrail, securityalerts
  
  // Agregar validadores JSON schema que rechacen UPDATE/DELETE
  // Consultar: MongoDB JSON Schema validation
}
```

### Validar:
```bash
# Después de desplegar:
# 1. Intentar actualizar un log → debe fallar
# 2. Intentar borrar un log → debe fallar
# 3. Verificar cadena de hash en lectura
```

---

## 📍 GAP 2: SOFT-DELETE (Todos los schemas + servicios de DELETE)

### Archivos a modificar:
- `src/lib/schemas.ts` - AGREGAR campos `deleted`, `deletedAt`, `deletedBy`, `deleteReason`
- Todas las entidades que se pueden borrar:
  - `DocumentoTecnicoSchema`
  - `PedidoSchema`
  - `GenericCaseSchema`
  - `PromptSchema`
  - Usuarios (UsuarioSchema)
  - Documentos usuario
- Todos los servicios que hacen DELETE:
  - `src/lib/document-service.ts`
  - `src/lib/prompt-service.ts`
  - `src/lib/case-service.ts` (si existe)
  - `src/lib/user-service.ts`
  - Scripts de limpieza (`scripts/cleanup-*.ts`)

### Cambios específicos:

**1. En `src/lib/schemas.ts`, ACTUALIZAR TODOS los schemas:**

Para cada schema que pueda borrarse:
```typescript
// ANTES:
export const DocumentoTecnicoSchema = z.object({
  id: z.any().optional(),
  nombrearchivo: z.string(),
  // ... resto de campos
  creado: z.date().default(() => new Date()),
})

// DESPUÉS: Agregar campos de soft-delete
export const DocumentoTecnicoSchema = z.object({
  id: z.any().optional(),
  nombrearchivo: z.string(),
  // ... resto de campos
  
  // NUEVOS:
  deleted: z.boolean().default(false),
  deletedAt: z.date().optional(),
  deletedBy: z.string().email().optional(), // email del usuario
  deleteReason: z.string().optional(), // "GDPR request", "obsoleto", etc.
  deleteMethod: z.enum(["ui", "api", "batch", "admin"]).optional(),
  
  creado: z.date().default(() => new Date()),
})
```

**2. En servicios, REEMPLAZAR DELETE con soft-delete:**

Ejemplo en `document-service.ts`:

```typescript
// ANTES:
static async deleteDocument(docId: string, tenantId: string) {
  const collection = await getTenantCollection('documentostecnicos')
  await collection.deleteOne({id: new ObjectId(docId), tenantId})
}

// DESPUÉS:
static async deleteDocument(
  docId: string, 
  tenantId: string, 
  deletedBy: string, 
  deleteReason: string,
  correlacionid: string
) {
  const collection = await getTenantCollection('documentostecnicos')
  
  // 1. Obtener snapshot ANTES de marcar como deleted
  const doc = await collection.findOne({
    id: new ObjectId(docId), 
    tenantId
  })
  
  if (!doc) throw new NotFoundError('Documento no encontrado')
  
  // 2. Guardar snapshot en deleteddata (para auditoría)
  const deletedDataCollection = await getTenantCollection('deleteddata')
  await deletedDataCollection.insertOne({
    deletionId: crypto.randomUUID(),
    entityType: 'documento_tecnico',
    entityId: doc.id,
    tenantId,
    deletedBy,
    deleteReason, // OBLIGATORIO
    deleteMethod: 'api',
    snapshotBefore: doc,
    correlacionid,
    ipAddress: getClientIp(), // Agregar a request context
    timestamp: new Date(),
    hash: calculateHash(doc), // SHA256
    complianceContext: {
      isGDPRRequest: deleteReason === 'GDPR request',
      requiresApproval: true
    }
  })
  
  // 3. Marcar como deleted (soft-delete)
  const updateResult = await collection.updateOne(
    {id: new ObjectId(docId), tenantId},
    {
      $set: {
        deleted: true,
        deletedAt: new Date(),
        deletedBy,
        deleteReason
      }
    }
  )
  
  // 4. Loguear en configaudittrail
  await logEvento({
    nivel: 'INFO',
    origen: 'DOCUMENTSERVICE',
    accion: 'DOCUMENT_SOFT_DELETED',
    mensaje: `Documento ${doc.nombrearchivo} marcado como deleted`,
    correlacionid,
    tenantId,
    detalles: {
      docId,
      deleteReason,
      deletedBy
    }
  })
  
  return updateResult
}
```

**3. En todas las búsquedas, FILTRAR por `{deleted: false}`:**

```typescript
// ANTES:
const docs = await collection.find({tenantId}).toArray()

// DESPUÉS:
const docs = await collection.find({
  tenantId,
  deleted: {$ne: true}  // Excluir borrados
}).toArray()

// O si necesitas ambos:
const activeOnly = await collection.find({
  tenantId,
  deleted: false
}).toArray()

const allIncluding Deleted = await collection.find({
  tenantId
}).toArray()
```

**4. En `src/lib/db.ts`, CREAR ÍNDICES:**

```typescript
async function createSoftDeleteIndexes() {
  const db = await connectDB()
  
  // Índices para búsquedas rápidas de documentos activos
  const collections = [
    'documentostecnicos',
    'pedidos',
    'casos',
    'prompts',
    'usuarios'
  ]
  
  for (const col of collections) {
    await db.collection(col).createIndex({
      deleted: 1,
      tenantId: 1
    })
  }
}
```

**5. SCRIPTS DE LIMPIEZA - ACTUALIZAR:**

En `scripts/cleanup-legacy-data.ts`:

```typescript
// ANTES (línea donde hace deleteOne):
await docsCollection.deleteOne({id: doc.id})

// DESPUÉS:
// Ya no llamamos a deleteOne directamente
// El servicio DocumentService.deleteDocument() se encarga
// Pero si necesitas limpiar en bulk, hacerlo vía servicio
await DocumentService.deleteDocument(
  doc.id,
  doc.tenantId,
  'system@cleanup.local',
  'Legacy cleanup - no MD5',
  'cleanup-job-' + Date.now()
)
```

### Validar:
```bash
# 1. Borrar documento vía UI/API
# 2. Verificar que {deleted: true} en DB (no desaparece)
# 3. Verificar que aparece en colección deleteddata
# 4. Intentar recuperar documento → debe estar en {deleted: true}
# 5. Búsquedas sin especificar deleted → no retorna borrados
```

---

## 📍 GAP 3: SEGREGACIÓN DE FUNCIONES (AuthService + PromptService + WorkflowService)

### Archivos a modificar:
- `src/lib/auth.ts` - agregar middleware para 4-eyes
- `src/lib/prompt-service.ts` - cambios requieren aprobación
- `src/lib/user-service.ts` - cambios de rol requieren aprobación
- `src/lib/mfa-service.ts` - deshabilitar MFA requiere SUPERADMIN
- `src/lib/workflow-service.ts` - transiciones críticas requieren firma
- `src/middleware.ts` - actualizar control de acceso

### Cambios específicos:

**1. En `src/lib/schemas.ts`, AGREGAR schema de approval:**

```typescript
export const ApprovalRequestSchema = z.object({
  id: z.any().optional(),
  approvalId: z.string().uuid(),
  requestType: z.enum([
    'prompt_change',
    'role_assignment',
    'mfa_disable',
    'case_transition',
    'api_key_generation'
  ]),
  tenantId: z.string(),
  
  // Quién solicita y qué datos
  requestedBy: z.object({
    email: z.string().email(),
    userId: z.string(),
    role: z.enum(['ADMIN', 'TECNICO', 'INGENIERIA'])
  }),
  
  // Qué se solicita
  entityId: z.string(),
  changeDetails: z.object({
    previousValue: z.any(),
    newValue: z.any(),
    reason: z.string()
  }),
  
  // Estado de aprobación
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
  approvedBy?: z.object({
    email: z.string().email(),
    timestamp: z.date(),
    signature?: z.string()
  }),
  rejectedReason?: z.string(),
  
  expiresAt: z.date(), // Expira en 7 días
  createdAt: z.date().default(() => new Date()),
  
  correlacionid: z.string().uuid()
})
```

**2. En `src/lib/prompt-service.ts`, REEMPLAZAR `updatePrompt`:**

```typescript
// ANTES:
static async updatePrompt(promptId: string, updates: any, tenantId: string) {
  // Actualiza directamente
  const collection = await getTenantCollection('prompts')
  await collection.updateOne({id: new ObjectId(promptId), tenantId}, {$set: updates})
}

// DESPUÉS: Requiere aprobación
static async requestPromptChange(
  promptId: string,
  updates: any,
  tenantId: string,
  requestedBy: string, // email
  reason: string,
  correlacionid: string
) {
  const collection = await getTenantCollection('prompts')
  const prompt = await collection.findOne({id: new ObjectId(promptId), tenantId})
  
  if (!prompt) throw new NotFoundError('Prompt no encontrado')
  
  // 1. Crear solicitud de aprobación (NO cambiar aún)
  const approvalsCol = await getTenantCollection('approvals')
  const approval = {
    approvalId: crypto.randomUUID(),
    requestType: 'prompt_change',
    tenantId,
    requestedBy: {
      email: requestedBy,
      userId: getUserIdFromContext(), // Necesitas pasar esto
      role: getUserRoleFromContext()
    },
    entityId: promptId,
    changeDetails: {
      previousValue: {
        template: prompt.template,
        variables: prompt.variables,
        active: prompt.active
      },
      newValue: updates,
      reason
    },
    status: 'PENDING',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
    createdAt: new Date(),
    correlacionid
  }
  
  const {insertedId} = await approvalsCol.insertOne(approval)
  
  // 2. Loguear solicitud en configaudittrail
  await logEvento({
    nivel: 'INFO',
    origen: 'PROMPTSERVICE',
    accion: 'PROMPT_CHANGE_REQUESTED',
    mensaje: `Cambio de prompt ${prompt.key} solicitado, pendiente aprobación`,
    correlacionid,
    tenantId,
    detalles: {
      promptId,
      approvalId: approval.approvalId,
      requestedBy
    }
  })
  
  // 3. Notificar ADMINs
  await notifyAdmins(tenantId, {
    type: 'APPROVAL_PENDING',
    message: `${requestedBy} solicita cambio de prompt ${prompt.key}`,
    approvalId: approval.approvalId,
    expiresAt: approval.expiresAt
  })
  
  return approval
}

// Nueva función para APROBAR cambio
static async approvePromptChange(
  approvalId: string,
  tenantId: string,
  approvedBy: string, // email del ADMIN
  signature?: string, // Firma digital
  correlacionid?: string
) {
  const approvalsCol = await getTenantCollection('approvals')
  const approval = await approvalsCol.findOne({approvalId, tenantId})
  
  if (!approval) throw new NotFoundError('Aprobación no encontrada')
  if (approval.status !== 'PENDING') throw new ValidationError('Aprobación ya fue procesada')
  
  // Verificar que el que aprueba es ADMIN
  const approverRole = getUserRoleFromContext()
  if (approverRole !== 'ADMIN' && approverRole !== 'SUPERADMIN') {
    throw new UnauthorizedError('Solo ADMIN puede aprobar cambios de prompts')
  }
  
  // 1. Aplicar cambios de prompt
  const promptsCol = await getTenantCollection('prompts')
  await promptsCol.updateOne(
    {id: new ObjectId(approval.entityId), tenantId},
    {$set: approval.changeDetails.newValue}
  )
  
  // 2. Marcar aprobación como APPROVED
  await approvalsCol.updateOne(
    {approvalId, tenantId},
    {
      $set: {
        status: 'APPROVED',
        approvedBy: {
          email: approvedBy,
          timestamp: new Date(),
          signature
        }
      }
    }
  )
  
  // 3. Loguear en configaudittrail con firma
  await logEvento({
    nivel: 'INFO',
    origen: 'PROMPTSERVICE',
    accion: 'PROMPT_CHANGE_APPROVED',
    mensaje: `Cambio de prompt ${approval.entityId} aprobado por ${approvedBy}`,
    correlacionid: correlacionid || approvalId,
    tenantId,
    detalles: {
      approvalId,
      approvedBy,
      reason: approval.changeDetails.reason
    }
  })
  
  // 4. Notificar al usuario que la solicitud fue aprobada
  await notifyUser(approval.requestedBy.email, {
    type: 'APPROVAL_GRANTED',
    message: `Tu cambio de prompt fue aprobado`
  })
}

// Nueva función para RECHAZAR
static async rejectPromptChange(
  approvalId: string,
  tenantId: string,
  rejectedBy: string,
  rejectionReason: string,
  correlacionid?: string
) {
  const approvalsCol = await getTenantCollection('approvals')
  
  await approvalsCol.updateOne(
    {approvalId, tenantId},
    {
      $set: {
        status: 'REJECTED',
        rejectedReason
      }
    }
  )
  
  // Loguear y notificar similar al approval
}
```

**3. En `src/lib/user-service.ts`, REEMPLAZAR `updateUserRole`:**

Mismo patrón que prompts: crear ApprovalRequest, requiere SUPERADMIN, loguear en configaudittrail.

**4. En `src/lib/mfa-service.ts`, REEMPLAZAR `disable`:**

```typescript
// ANTES:
static async disable(userId: string) {
  const db = await connectAuthDB()
  await db.collection('mfaconfigs').deleteOne({userId})
  // ...
}

// DESPUÉS: Requerir SUPERADMIN + 2FA confirmation
static async requestDisableMFA(
  userId: string,
  requestedBy: string, // El usuario mismo o admin
  reason: string,
  correlacionid: string
) {
  // 1. Crear approval request (solo SUPERADMIN puede aprobar)
  // 2. Loguear como SECURITY alert
  // 3. Notificar SUPERADMIN
  // 4. Requerir 2FA para confirmar
  
  await logEvento({
    nivel: 'WARN',
    origen: 'MFASERVICE',
    accion: 'MFA_DISABLE_REQUESTED',
    mensaje: `Usuario ${userId} solicita deshabilitar MFA`,
    correlacionid,
    detalles: {userId, requestedBy, reason}
  })
}

static async approveMFADisable(
  approvalId: string,
  approvedBy: string, // SUPERADMIN
  mfaToken: string, // Verificación 2FA del SUPERADMIN
  correlacionid: string
) {
  // 1. Validar token 2FA
  const isValid = await MfaService.verify(approvedBy, mfaToken)
  if (!isValid) throw new UnauthorizedError('2FA verification failed')
  
  // 2. Ahora sí deshabilitar MFA
  const db = await connectAuthDB()
  await db.collection('mfaconfigs').deleteOne({userId})
  
  // 3. Loguear como critical security change
  await logEvento({
    nivel: 'WARN',
    origen: 'MFASERVICE',
    accion: 'MFA_DISABLED',
    mensaje: `MFA deshabilitado para usuario por ${approvedBy}`,
    correlacionid,
    detalles: {userId, approvedBy}
  })
}
```

**5. En `src/middleware.ts`, ACTUALIZAR control de acceso:**

```typescript
// Agregar validación de 4-eyes antes de permitir cambios críticos

if (pathname.includes('/api/prompts/') && request.method === 'PATCH') {
  // En lugar de permitir directamente, redirigir a create approval
  // El endpoint debe cambiar a:
  // POST /api/prompts/{id}/request-change → crea ApprovalRequest
  // POST /api/approvals/{id}/approve → requiere ADMIN + firma
}

if (pathname.includes('/api/users/') && request.method === 'PATCH') {
  // Similar: crear ApprovalRequest
}

if (pathname.includes('/api/auth/mfa/disable') && request.method === 'POST') {
  // Crear ApprovalRequest, requerir SUPERADMIN approval
}
```

### Validar:
```bash
# 1. TECNICO intenta cambiar prompt → recibe 403 o redirección
# 2. TECNICO solicita cambio → crea ApprovalRequest PENDING
# 3. ADMIN ve approval pendiente en dashboard
# 4. ADMIN aprueba → cambio aplicado
# 5. Logs muestran solicitud + aprobación
# 6. MFA disable requiere SUPERADMIN approval + 2FA
```

---

## 📍 GAP 4: FIRMA DIGITAL (crypto utilities + signature validation)

### Archivos a modificar:
- `src/lib/crypto.ts` (crear o extender) - funciones de firma
- `src/lib/prompt-service.ts` - agregar firma en aprobación
- `src/lib/workflow-service.ts` - firma en transiciones críticas
- `src/lib/user-service.ts` - firma en cambios de rol
- Schemas - agregar SignatureSchema

### Cambios específicos:

**1. En `src/lib/crypto.ts`, CREAR utilidades:**

```typescript
import crypto from 'crypto'
import { getSecretFromVault } from './vault' // AWS Secrets Manager

interface Signature {
  signatureValue: string // hex-encoded HMAC
  signatureMethod: 'hmacsha256'
  signedAt: Date
  signedBy: string // email
  ipAddress: string
  validated: boolean
  validationError?: string
}

// Generar firma HMAC-SHA256
export async function signData(
  data: any,
  signingKey: string, // De AWS Secrets Manager
  signedBy: string,
  ipAddress: string
): Promise<Signature> {
  const dataString = JSON.stringify(data)
  const hmac = crypto.createHmac('sha256', signingKey)
  hmac.update(dataString)
  const signatureValue = hmac.digest('hex')
  
  return {
    signatureValue,
    signatureMethod: 'hmacsha256',
    signedAt: new Date(),
    signedBy,
    ipAddress,
    validated: true
  }
}

// Validar firma en lectura
export async function validateSignature(
  data: any,
  signature: Signature,
  signingKey: string
): Promise<{valid: boolean; error?: string}> {
  const dataString = JSON.stringify(data)
  const hmac = crypto.createHmac('sha256', signingKey)
  hmac.update(dataString)
  const expectedSignature = hmac.digest('hex')
  
  const valid = crypto.timingSafeEqual(
    Buffer.from(signature.signatureValue),
    Buffer.from(expectedSignature)
  )
  
  return {
    valid,
    error: valid ? undefined : 'Signature mismatch - data may have been tampered'
  }
}

// Obtener clave de firma desde AWS Secrets Manager (no hardcodear)
export async function getSigningKey(tenantId: string, adminEmail: string): Promise<string> {
  // AWS Secrets Manager: ABD-RAG/{tenantId}/signing-key
  const secret = await getSecretFromVault(`ABD-RAG/${tenantId}/signing-key`)
  return secret.signingKey
}
```

**2. En `src/lib/prompt-service.ts`, AGREGAR firma en aprobación:**

```typescript
static async approvePromptChange(
  approvalId: string,
  tenantId: string,
  approvedBy: string,
  mfaToken: string, // Verificación 2FA
  ipAddress: string,
  correlacionid: string
) {
  // 1. Validar 2FA
  const isValid = await MfaService.verify(approvedBy, mfaToken)
  if (!isValid) throw new UnauthorizedError('2FA invalid')
  
  const approvalsCol = await getTenantCollection('approvals')
  const approval = await approvalsCol.findOne({approvalId, tenantId})
  
  // 2. Generar firma digital
  const signingKey = await getSigningKey(tenantId, approvedBy)
  const signatureData = {
    approvalId,
    entityId: approval.entityId,
    changeDetails: approval.changeDetails,
    approvedBy,
    timestamp: new Date().toISOString()
  }
  
  const signature = await signData(
    signatureData,
    signingKey,
    approvedBy,
    ipAddress
  )
  
  // 3. Aplicar cambios + guardar firma
  const promptsCol = await getTenantCollection('prompts')
  await promptsCol.updateOne(
    {id: new ObjectId(approval.entityId), tenantId},
    {
      $set: {
        ...approval.changeDetails.newValue,
        signature // 🔐 Guardar firma
      }
    }
  )
  
  // 4. Marcar aprobación como APPROVED con firma
  await approvalsCol.updateOne(
    {approvalId, tenantId},
    {
      $set: {
        status: 'APPROVED',
        approvedBy: {
          email: approvedBy,
          timestamp: new Date(),
          signature: signature.signatureValue
        }
      }
    }
  )
  
  // 5. Loguear en configaudittrail
  await logEvento({
    nivel: 'INFO',
    origen: 'PROMPTSERVICE',
    accion: 'PROMPT_CHANGE_SIGNED',
    mensaje: `Cambio de prompt firmado digitalmente por ${approvedBy}`,
    correlacionid,
    tenantId,
    detalles: {
      approvalId,
      signatureId: signature.signatureValue.substring(0, 16),
      signedAt: signature.signedAt
    }
  })
}
```

**3. Al LEER prompts, VALIDAR firma:**

```typescript
static async getPrompt(promptId: string, tenantId: string) {
  const collection = await getTenantCollection('prompts')
  const prompt = await collection.findOne({id: new ObjectId(promptId), tenantId})
  
  if (!prompt) throw new NotFoundError('Prompt no encontrado')
  
  // Si tiene firma, validarla
  if (prompt.signature) {
    const signingKey = await getSigningKey(tenantId, prompt.signature.signedBy)
    
    const {valid, error} = await validateSignature(
      {
        template: prompt.template,
        variables: prompt.variables,
        // ... datos que se firmaron
      },
      prompt.signature,
      signingKey
    )
    
    if (!valid) {
      // Log como SECURITY alert
      await logEvento({
        nivel: 'ERROR',
        origen: 'PROMPTSERVICE',
        accion: 'SIGNATURE_VALIDATION_FAILED',
        mensaje: `Firma digital inválida en prompt ${promptId}`,
        detalles: {
          promptId,
          error,
          signedBy: prompt.signature.signedBy
        }
      })
      
      // Marcar como tampered
      prompt.integrityStatus = 'TAMPERED'
    } else {
      prompt.integrityStatus = 'VALID'
    }
  }
  
  return prompt
}
```

### Validar:
```bash
# 1. Aprobar cambio de prompt → debe generar firma
# 2. Leer prompt → valida firma
# 3. Modificar documento en DB → firma se invalida
# 4. Intento de leer con firma inválida → log SECURITY alert
```

---

## 📍 GAP 5: AUDITORÍA DE CONFIGURACIÓN

### Archivos a modificar:
- Todos los servicios que modifican config:
  - `src/lib/mfa-service.ts`
  - `src/lib/user-service.ts`
  - `src/lib/prompt-service.ts`
  - `src/lib/tenant-service.ts`
  - `src/lib/workflow-service.ts`

### Cambios específicos:

En cada servicio, cuando hagas cambio de configuración:

```typescript
// Ejemplo en MfaService.enable()

static async enable(userId: string, secret: string, token: string) {
  // ... validación existente ...
  
  // AGREGAR: Log en configaudittrail
  const configAuditCol = await getTenantCollection('configaudittrail')
  const previousConfig = await db.collection('mfaconfigs').findOne({userId})
  
  await configAuditCol.insertOne({
    changeId: crypto.randomUUID(),
    changeType: 'mfa',
    entityId: new ObjectId(userId),
    changedBy: {
      email: getUserEmailFromContext(),
      userId,
      role: getUserRoleFromContext()
    },
    previousValue: previousConfig || {enabled: false},
    newValue: {enabled: true, secret: '***REDACTED***'}, // No loguear secret!
    changeReason: 'User enabled MFA',
    timestamp: new Date(),
    correlacionid: getCorrelationIdFromContext(),
    hash: calculateHash({userId, action: 'mfa_enable', timestamp: new Date()})
  })
}
```

Repetir este patrón en todos los servicios de config.

---

## 📍 GAP 6: CICLO DE VIDA & RETENCIÓN

### Archivos a modificar:
- `src/lib/db.ts` - crear Vercel Cron job
- `vercel.json` - configurar cron
- Nueva función: `src/lib/data-lifecycle-service.ts`

### Cambios específicos:

**1. Crear `src/lib/data-lifecycle-service.ts`:**

```typescript
export class DataLifecycleService {
  static async archiveExpiredData() {
    const db = await connectDB()
    const policies = await db.collection('dataretentionpolicy').find().toArray()
    
    for (const policy of policies) {
      // Documentos que han excedido activeRetention
      const cutoffDate = new Date(Date.now() - policy.activeRetentionMonths * 30 * 24 * 60 * 60 * 1000)
      
      const expiredDocs = await db
        .collection(`${policy.entityType}s`)
        .find({
          creado: {$lt: cutoffDate},
          deleted: {$ne: true},
          archived: {$ne: true}
        })
        .toArray()
      
      if (expiredDocs.length > 0) {
        // Move a colección archived_ENTITYTYPE
        const archivedCol = db.collection(`archived_${policy.entityType}`)
        await archivedCol.insertMany(
          expiredDocs.map(doc => ({
            ...doc,
            archivedAt: new Date(),
            archiveReason: 'Automatic aging - active retention exceeded'
          }))
        )
        
        // Loguear archivado
        await logEvento({
          nivel: 'INFO',
          origen: 'DATALIFECYCLESERVICE',
          accion: 'AUTOMATIC_ARCHIVING',
          mensaje: `${expiredDocs.length} ${policy.entityType}s archivados`,
          detalles: {
            entityType: policy.entityType,
            count: expiredDocs.length,
            archivedBefore: cutoffDate
          }
        })
      }
    }
  }
}
```

**2. En `vercel.json`, AGREGAR cron:**

```json
{
  "crons": [
    {
      "path": "/api/cron/archive-expired-data",
      "schedule": "0 0 1 * *" // Primer día del mes a las 00:00 UTC
    }
  ]
}
```

**3. Crear endpoint `src/app/api/cron/archive-expired-data/route.ts`:**

```typescript
import {NextRequest, NextResponse} from 'next/server'
import {DataLifecycleService} from '@/lib/data-lifecycle-service'

export async function GET(req: NextRequest) {
  // Verificar que es llamada desde Vercel (signature check)
  const authorization = req.headers.get('authorization')
  if (authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({error: 'Unauthorized'}, {status: 401})
  }
  
  try {
    await DataLifecycleService.archiveExpiredData()
    return NextResponse.json({success: true})
  } catch (error) {
    return NextResponse.json({error: error.message}, {status: 500})
  }
}
```

---

## 📍 GAP 7: ALERTAS DE ANOMALÍAS

### Archivos a modificar:
- `src/middleware.ts` - detección de brute force
- `src/lib/security-service.ts` (crear) - detectores
- `src/lib/notifications.ts` - webhook a Slack/PagerDuty

### Cambios específicos:

En `src/middleware.ts`, AGREGAR detectores:

```typescript
// Detectar brute force MFA
const mfaFailures = await db.collection('logsaplicacion').countDocuments({
  origen: 'MFASERVICE',
  accion: 'MFAVERIFICATIONFAILED',
  'detalles.userId': userId,
  timestamp: {$gte: new Date(Date.now() - 5 * 60 * 1000)} // últimos 5 min
})

if (mfaFailures >= 5) {
  // Bloquear IP
  await blockIp(ip)
  
  // Log como SECURITY alert
  await logEvento({
    nivel: 'ERROR',
    origen: 'MIDDLEWARE',
    accion: 'BRUTE_FORCE_DETECTED',
    mensaje: 'Brute force MFA detected',
    detalles: {userId, ip, failureCount: mfaFailures}
  })
  
  // Crear SecurityAlert
  await createSecurityAlert({
    alertType: 'BRUTE_FORCE',
    severity: 'CRITICAL',
    tenantId,
    userId,
    description: `${mfaFailures} failed MFA attempts from IP ${ip}`,
    metadata: {ip, failureCount: mfaFailures}
  })
  
  // Notificar
  await notifySecurityTeam({
    type: 'BRUTE_FORCE_ALERT',
    userId,
    ip,
    failureCount: mfaFailures
  })
}
```

---

## 📍 GAP 8: CIFRADO FIELD-LEVEL

### Archivos a modificar:
- `src/lib/encryption.ts` (crear) - utilidades de cifrado
- `src/lib/logger.ts` - encriptar campos sensibles antes de guardar

### Cambios específicos:

Usar `mongodb-client-encryption`:

```typescript
// En src/lib/encryption.ts
import {ClientEncryption} from 'mongodb-client-encryption'

export async function encryptField(
  field: string,
  value: any,
  tenantId: string
): Promise<any> {
  // Usar AWS KMS para key
  const encryption = new ClientEncryption({
    keyVaultNamespace: 'encryption.keys',
    kmsProviders: {
      aws: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY
      }
    },
    masterKey: {
      region: 'eu-west-1',
      key: `arn:aws:kms:eu-west-1:...`
    }
  })
  
  return encryption.encrypt(value, {
    algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic',
    keyAltName: `audit-log-${tenantId}`
  })
}
```

---

## 📍 GAP 9: INTEGRIDAD PERIÓDICA

### Archivos a modificar:
- `src/lib/integrity-service.ts` (crear)
- `vercel.json` - cron job

### Cambios específicos:

```typescript
export class IntegrityService {
  static async verifyDocuments() {
    const db = await connectDB()
    
    // Documentos críticos
    const docs = await db.collection('casos')
      .find({status: 'COMPLETED'})
      .toArray()
    
    for (const doc of docs) {
      if (!doc.integrityHash) continue
      
      const recalculatedHash = calculateHash(doc)
      
      if (recalculatedHash !== doc.integrityHash) {
        // TAMPERED
        await db.collection('casos').updateOne(
          {id: doc.id},
          {$set: {integrityStatus: 'TAMPERED'}}
        )
        
        await logEvento({
          nivel: 'ERROR',
          origen: 'INTEGRITYSERVICE',
          accion: 'DATA_INTEGRITY_VIOLATION',
          mensaje: `Documento tampered: ${doc.id}`,
          detalles: {
            docId: doc.id,
            expectedHash: doc.integrityHash,
            calculatedHash: recalculatedHash
          }
        })
        
        // Alert CRITICAL
        await createSecurityAlert({
          alertType: 'DATA_INTEGRITY_VIOLATION',
          severity: 'CRITICAL'
        })
      }
    }
  }
}
```

---

## 📝 RESUMEN DE CAMBIOS POR ARCHIVO

```
src/lib/
├── logger.ts              [MODIFICAR] Guardar en audittrail en lugar de logsaplicacion
├── schemas.ts             [MODIFICAR] Agregar soft-delete, approval, signature, integrity fields
├── db.ts                  [MODIFICAR] Crear índices append-only, validadores de schema
├── prompt-service.ts      [MODIFICAR] Soft-delete, aprobaciones, firma digital
├── user-service.ts        [MODIFICAR] Soft-delete, aprobaciones de roles
├── mfa-service.ts         [MODIFICAR] Requerir SUPERADMIN approval para disable
├── workflow-service.ts    [MODIFICAR] Transiciones requieren firma
├── tenant-service.ts      [MODIFICAR] Log cambios de config
│
├── crypto.ts              [CREAR]    Sign/validate functions
├── encryption.ts          [CREAR]    Field-level encryption
├── data-lifecycle-service.ts [CREAR] Archivado automático
├── integrity-service.ts   [CREAR]    Verificación semanal
├── security-service.ts    [CREAR]    Detectores de anomalías
└── notifications.ts       [CREAR]    Webhooks Slack/PagerDuty

src/middleware.ts          [MODIFICAR] Agregar detectores de anomalías
src/app/api/cron/         [CREAR]    Endpoints de cron jobs
vercel.json               [MODIFICAR] Configurar cron schedule
```

---

**Fin de la localización detallada de cambios**

Próximo paso: Empezar por GAP 1 (Immutabilidad) en `src/lib/logger.ts` y `src/lib/schemas.ts`.

