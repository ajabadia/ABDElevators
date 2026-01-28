# 🔍 AUDITORÍA MONGO DB - Modelo de Datos ABD RAG Platform

**Fecha:** 28 Enero 2026  
**Versión:** Análisis Completo  
**Alcance:** Arquitectura multi-tenant, índices, riesgos, optimizaciones  

---

## 📊 ESTADO ACTUAL - Diagrama de Colecciones

### Database: ABD-Elevators (MAIN)

```
├── usuarios
│   ├── _id (ObjectId)
│   ├── email (String, unique)
│   ├── password (hash)
│   ├── rol (ADMIN | TECNICO | INGENIERIA)
│   ├── tenantId (String) ← CRITICAL
│   ├── industry (ELEVATORS | LEGAL | IT | GENERIC)
│   ├── activo (Boolean)
│   └── timestamps
│
├── tenants
│   ├── tenantId (String, unique) ← PRIMARY KEY
│   ├── name (String)
│   ├── industry (IndustryType)
│   ├── billing.plan (STARTER | PROFESSIONAL | ENTERPRISE)
│   ├── storage.quotabytes
│   ├── storage.settings.folderprefix (Cloudinary)
│   └── timestamps
│
├── documentostecnicos
│   ├── _id (ObjectId)
│   ├── tenantId (String) ← CRITICAL
│   ├── nombrearchivo (String)
│   ├── archivomd5 (String, indexed)
│   ├── totalchunks (Number)
│   ├── cloudinarypublicid (String)
│   └── timestamps
│
├── documentchunks
│   ├── _id (ObjectId)
│   ├── tenantId (String) ← CRITICAL
│   ├── origendoc (String)
│   ├── versiondoc (String)
│   ├── textochunk (String, text-indexed)
│   ├── embedding (Array<Number>, vector search)
│   ├── isshadow (Boolean) ← Multilingual
│   ├── originallang (String) ← Multilingual
│   ├── refchunkid (ObjectId) ← Foreign key
│   └── timestamps
│
├── pedidos
│   ├── _id (ObjectId)
│   ├── tenantId (String) ← CRITICAL
│   ├── numeropedido (String)
│   ├── estado (ingresado | analizando | revision | completado)
│   ├── modelosdetectados (Array<{tipo, modelo}>)
│   ├── archivomd5 (String)
│   └── timestamps
│
├── casos
│   ├── _id (ObjectId)
│   ├── tenantId (String) ← CRITICAL
│   ├── industry (IndustryType)
│   ├── type (String)
│   ├── priority (HIGH | MEDIUM | LOW)
│   ├── status (INPROGRESS | COMPLETED)
│   ├── metadata (Object, industry-specific)
│   ├── taxonomies (Array<String>)
│   ├── tags (Array<String>)
│   └── timestamps
│
├── prompts
│   ├── _id (ObjectId)
│   ├── tenantId (String) ← CRITICAL
│   ├── key (String, enum: MODELEXTRACTOR, RAGGENERATOR, etc.)
│   ├── content (String, Handlebars template)
│   ├── version (String)
│   ├── active (Boolean)
│   └── timestamps
│
├── ragjudges
│   ├── _id (ObjectId)
│   ├── tenantId (String) ← CRITICAL
│   ├── documentchunkId (ObjectId)
│   ├── evaluadorId (String, userId)
│   ├── valoracion (1-5)
│   ├── comentario (String)
│   └── timestamps
│
├── ragevaluations
│   ├── _id (ObjectId)
│   ├── tenantId (String) ← CRITICAL
│   ├── correlacionid (UUID)
│   ├── query (String)
│   ├── generation (String)
│   ├── metrics (faithfulness, answerrelevance, contextprecision)
│   ├── judgemodel (String, e.g., "gemini-1.5-flash")
│   └── timestamps
│
├── tickets
│   ├── _id (ObjectId)
│   ├── tenantId (String) ← CRITICAL
│   ├── ticketNumber (String, human-readable TKT-2024-00001)
│   ├── subject (String)
│   ├── description (String)
│   ├── priority (LOW | MEDIUM | HIGH | CRITICAL)
│   ├── status (OPEN | INPROGRESS | WAITINGUSER | RESOLVED | CLOSED)
│   ├── assignedTo (String, userId)
│   ├── createdBy (String, userId)
│   ├── userEmail (String)
│   ├── messages (Array<{author, content, timestamp, isInternal}>)
│   ├── internalNotes (Array<{author, content, timestamp}>)
│   ├── resolvedAt (Date, optional)
│   └── timestamps
│
├── taxonomias
│   ├── _id (ObjectId)
│   ├── tenantId (String) ← CRITICAL
│   ├── industry (IndustryType)
│   ├── key (String, unique per tenant+industry)
│   ├── name (String)
│   ├── values (Array<{id, label, description}>)
│   ├── active (Boolean)
│   └── timestamps
│
├── workflowdefinitions
│   ├── _id (ObjectId)
│   ├── tenantId (String) ← CRITICAL
│   ├── industry (IndustryType)
│   ├── entitytype (PEDIDO | EQUIPO | USUARIO)
│   ├── states (Array<{id, label, color, icon, rolesallowed}>)
│   ├── transitions (Array<{from, to, requiredrole, conditions}>)
│   ├── isdefault (Boolean)
│   ├── active (Boolean)
│   └── timestamps
│
├── usagelogs
│   ├── _id (ObjectId)
│   ├── tenantId (String) ← CRITICAL
│   ├── tipo (LLMTOKENS | STORAGEBYTES | VECTORSEARCH | EMBEDDINGOPS)
│   ├── valor (Number)
│   ├── recurso (String, model name or resource)
│   ├── descripcion (String)
│   ├── timestamp (Date)
│
├── mfaconfigs
│   ├── userId (String, key field)
│   ├── enabled (Boolean)
│   ├── secret (String, TOTP secret)
│   ├── recoveryCodes (Array<Hash>)
│   └── timestamps
│
└── validaciones
    ├── _id (ObjectId)
    ├── tenantId (String) ← CRITICAL
    ├── validadoPor (String, userId)
    ├── documento_id (ObjectId)
    ├── resultado (APPROVED | REJECTED)
    └── timestamps
```

### Database: ABD-Elevators-Auth (AUTH)

```
├── usuarios (users with auth info)
├── mfaconfigs (MFA per user)
└── tenants (tenant config)
```

### Database: ABD-Elevators-Logs (LOGS)

```
├── logsaplicacion (application logs)
├── logsauditoria (audit trail)
├── emailnotifications (alert tracking)
└── tenantconfigshistory (config change log)
```

---

## 🔴 PROBLEMAS CRÍTICOS IDENTIFICADOS

### 1. **Multi-Tenancy - FALSA SEGURIDAD**

**Riesgo: 🔴 CRÍTICO**

```javascript
// ❌ PROBLEMA: Confianza en tenantId de cliente
const docs = await db.collection('documentostecnicos')
  .find({ tenantId: request.body.tenantId }) // Cliente puede enviar tenantId falsificado
  .toArray();

// ❌ PROBLEMA: Falta validación en algunos servicios
// archivo: rag-service.ts
async performTechnicalSearch(question, tenantId, correlacionid) {
  // No valida que el tenantId pertenezca al usuario actual
  const results = await hybridSearch(question, tenantId);
}
```

**Impacto:**
- ✗ Cross-tenant data leakage (si usuario A puede manipular tenantId)
- ✗ Un admin de tenant A podría leer datos de tenant B
- ✗ No hay validación server-side del tenantId del usuario

**Soluciones:**

```javascript
// ✅ CORRECCIÓN 1: Extraer tenantId de JWT, no del cliente
async function getDocuments(req, res) {
  const userId = req.user.id; // De JWT
  const tenantId = req.user.tenantId; // De JWT
  // Nunca usar: const tenantId = req.body.tenantId
  
  const docs = await db.collection('documentostecnicos')
    .find({ 
      tenantId: tenantId, // Servidor controla
      userId: userId      // Extra validación
    })
    .toArray();
}

// ✅ CORRECCIÓN 2: Middleware de validación tenantId
export async function validateTenantMiddleware(req, res, next) {
  const tokenTenantId = req.user.tenantId;
  const requestTenantId = req.query.tenantId || req.body.tenantId;
  
  if (requestTenantId && requestTenantId !== tokenTenantId) {
    throw new AppError('UNAUTHORIZED', 403, 'Cross-tenant access denied');
  }
  next();
}

// ✅ CORRECCIÓN 3: Validación en nivel DB (regla de oro)
async function getTenantCollection(collectionName) {
  return {
    find: (query, options) => {
      // Siempre agregar tenantId al query automáticamente
      return db.collection(collectionName)
        .find({ ...query, tenantId: currentTenantId }, options);
    }
  }
}
```

**Acción:**
- [ ] Implementar middleware validateTenantMiddleware en TODOS los endpoints
- [ ] Auditar 100% de queries que usan tenantId
- [ ] Agregar tests de cross-tenant security
- [ ] Documentar: "tenantId NUNCA viene del cliente"

---

### 2. **Índices Deficientes - PERFORMANCE DEGRADATION**

**Riesgo: 🟠 ALTO**

**Índices Existentes (según código):**
```javascript
// Probablemente existentes:
archivomd5 (documentostecnicos, documentchunks) - indexed
textochunk (documentchunks) - text indexed
embedding (documentchunks) - vector search

// FALTAN:
- (tenantId, createdAt) - Queries frecuentes por tenant + fecha
- (tenantId, status) - Pedidos/casos por estado
- (tenantId, userId) - Queries por usuario
- (tenantId, archivomd5) - Búsquedas de deduplicación
- (userId) - MFA configs, sessions
- (ticketNumber) - Búsquedas de tickets
- (email) - Búsquedas de usuarios
```

**Impacto:**
- ✗ Collection scans en queries frecuentes
- ✗ Latencia en búsquedas de documentos por tenant
- ✗ RAG performance sufre en tenants grandes

**Soluciones:**

```javascript
// ✅ ÍNDICES A CREAR INMEDIATAMENTE

// documentostecnicos
db.documentostecnicos.createIndex({ tenantId: 1, createdAt: -1 });
db.documentostecnicos.createIndex({ tenantId: 1, archivomd5: 1 });
db.documentostecnicos.createIndex({ tenantId: 1, userId: 1 });

// documentchunks
db.documentchunks.createIndex({ tenantId: 1, origendoc: 1 });
db.documentchunks.createIndex({ tenantId: 1, embedding: "2dsphere" }); // Vector
db.documentchunks.createIndex({ tenantId: 1, isshadow: 1 }); // Multilingual queries

// pedidos & casos
db.pedidos.createIndex({ tenantId: 1, estado: 1, createdAt: -1 });
db.casos.createIndex({ tenantId: 1, status: 1, priority: 1 });
db.casos.createIndex({ tenantId: 1, industry: 1 });

// tickets
db.tickets.createIndex({ tenantId: 1, status: 1, updatedAt: -1 });
db.tickets.createIndex({ tenantId: 1, createdBy: 1 });
db.tickets.createIndex({ tenantId: 1, assignedTo: 1 });
db.tickets.createIndex({ ticketNumber: 1 }, { unique: true });

// usuarios
db.usuarios.createIndex({ email: 1 }, { unique: true });
db.usuarios.createIndex({ tenantId: 1, rol: 1 });

// usagelogs
db.usagelogs.createIndex({ tenantId: 1, tipo: 1, timestamp: -1 });

// mfaconfigs
db.mfaconfigs.createIndex({ userId: 1 }, { unique: true });
```

**TTL Indexes para datos temporales:**

```javascript
// Logs: mantener 90 días
db.logsaplicacion.createIndex({ timestamp: 1 }, { expireAfterSeconds: 7776000 });

// Notificaciones de email: 30 días
db.emailnotifications.createIndex({ createdAt: 1 }, { expireAfterSeconds: 2592000 });
```

**Acción:**
- [ ] Crear todos los índices listados
- [ ] Ejecutar explain() en queries lentas
- [ ] Establecer baseline de performance
- [ ] Monitorear hit rates mensualmente

---

### 3. **Falta de Transacciones ACID**

**Riesgo: 🟠 ALTO**

**Problema:**
```javascript
// ❌ NO ATÓMICA - Si falla a mitad, queda inconsistente
async createPedido(data) {
  // 1. Insertar pedido
  const result = await db.collection('pedidos').insertOne({...});
  
  // 2. Actualizar documento técnico
  await db.collection('documentostecnicos').updateOne(
    { archivomd5: data.archivomd5 },
    { $set: { referencedByPedido: result.insertedId } }
  );
  // ⚠️ Si falla acá, pedido existe pero doc no se actualizó
}

// ❌ Deduplicación sin transacción
async uploadDocument(file, tenantId) {
  const hash = md5(file);
  
  // 1. Verificar si existe
  const existing = await db.collection('documentostecnicos')
    .findOne({ archivomd5: hash, tenantId });
  
  // 2. Si no existe, insertar
  if (!existing) {
    await db.collection('documentostecnicos').insertOne({...});
    // ⚠️ Race condition: dos uploads simultáneos crean dos entries
  }
}
```

**Impacto:**
- ✗ Datos inconsistentes si fallos de red
- ✗ Race conditions en deduplicación
- ✗ Orphaned records (pedidos sin documentos, etc.)

**Soluciones:**

```javascript
// ✅ TRANSACCIÓN ACID
async createPedidoWithAtomic(data) {
  const session = db.getMongo().startSession();
  session.startTransaction();
  
  try {
    // 1. Insertar pedido
    const result = await db.collection('pedidos').insertOne({...}, { session });
    
    // 2. Actualizar documento
    await db.collection('documentostecnicos').updateOne(
      { archivomd5: data.archivomd5, tenantId: data.tenantId },
      { $set: { referencedByPedido: result.insertedId } },
      { session }
    );
    
    // 3. Log de auditoría
    await db.collection('logsauditoria').insertOne({...}, { session });
    
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
}

// ✅ UPSERT ATÓMICA para deduplicación
async uploadDocumentAtomic(file, tenantId) {
  const hash = md5(file);
  
  const result = await db.collection('documentostecnicos').updateOne(
    { archivomd5: hash, tenantId: tenantId },
    {
      $set: {
        nombrearchivo: file.name,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        creado: new Date(),
        totalchunks: 0,
      }
    },
    { upsert: true }
  );
  
  return {
    isNew: result.upsertedId !== undefined,
    documentId: result.upsertedId || existing._id
  };
}

// ✅ Bulk operations atómicas
async updateMultipleTickets(ticketIds, update) {
  const session = db.getMongo().startSession();
  session.startTransaction();
  
  try {
    const bulk = db.collection('tickets').initializeUnorderedBulkOp({ session });
    
    for (const id of ticketIds) {
      bulk.find({ _id: new ObjectId(id), tenantId: currentTenantId })
        .updateOne({ $set: update });
    }
    
    await bulk.execute();
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
}
```

**Acción:**
- [ ] Envolver todos los multi-step operations en transacciones
- [ ] Crear helper function `withTransaction()`
- [ ] Auditar operaciones de deduplicación
- [ ] Agregar tests de race conditions

---

### 4. **Coherencia de Datos - Entidades Desconectadas**

**Riesgo: 🟠 ALTO**

**Problema:**

```javascript
// ❌ Pedidos y Documentos desconectados
// Una colección tiene: pedidos
// Otra colección tiene: documentostecnicos
// NO hay foreign key explícita

// ¿Qué pasa si:
// 1. Eliminar un documento sin eliminar referencias en pedidos?
// 2. Un pedido referencia un documentomd5 que no existe?
// 3. Un pedido referencia un documento de OTRO tenant?

// ❌ Tickets y Users desconectados
const ticket = await db.collection('tickets').findOne({ _id: ticketId });
// ticket.assignedTo = "user-id-123"
// Pero no hay garantía de que ese usuario exista o pertenezca al mismo tenant

// ❌ Casos y Taxonomías desconectadas
const caso = await db.collection('casos').findOne({ _id: caseId });
// caso.taxonomies = ["tax1", "tax2"]
// No hay validación de que existan esas taxonomías para este tenant+industry
```

**Impacto:**
- ✗ Datos huérfanos (documentos sin pedidos, usuarios sin asignaciones)
- ✗ Integridad referencial comprometida
- ✗ Borrados accidentales dejan inconsistencias

**Soluciones:**

```javascript
// ✅ OPCIÓN 1: Foreign keys con validación

// Helper para validar referencia antes de insertar
async function validateForeignKey(collection, id, tenantId) {
  const doc = await db.collection(collection)
    .findOne({ _id: new ObjectId(id), tenantId });
  
  if (!doc) {
    throw new ValidationError(
      `Referenced ${collection} not found or doesn't belong to tenant`
    );
  }
  return doc;
}

// Uso en createTicket
async createTicket(data) {
  // Validar que el usuario asignado existe
  if (data.assignedTo) {
    await validateForeignKey('usuarios', data.assignedTo, data.tenantId);
  }
  
  // Validar que las taxonomías existen
  if (data.taxonomies?.length > 0) {
    for (const taxId of data.taxonomies) {
      await validateForeignKey('taxonomias', taxId, data.tenantId);
    }
  }
  
  // Ahora sí insertar
  return await db.collection('tickets').insertOne(data);
}

// ✅ OPCIÓN 2: Denormalizar datos críticos (para lecturas rápidas)

// En lugar de solo userId, guardar también datos del usuario
const ticket = {
  _id: new ObjectId(),
  tenantId: tenantId,
  subject: "...",
  assignedTo: {
    userId: "user-123",
    email: "tecnico@abd.es",
    name: "Técnico A",
    role: "TECNICO"
  },
  createdBy: {
    userId: "admin-456",
    email: "admin@abd.es",
    name: "Admin",
    role: "ADMIN"
  }
};

// Beneficio: No necesitas join para mostrar email del técnico
// Riesgo: Si cambias email del usuario, debes actualizar tickets (usar trigger)

// ✅ OPCIÓN 3: Change Streams para actualizaciones en cascada

async function setupChangeStreams() {
  // Si un usuario se elimina, actualizar tickets
  const stream = db.collection('usuarios').watch([
    { $match: { operationType: 'delete' } }
  ]);
  
  stream.on('change', async (changeEvent) => {
    const userId = changeEvent.fullDocument._id;
    
    // Limpiar referencias
    await db.collection('tickets').updateMany(
      { 'assignedTo.userId': userId },
      { $set: { assignedTo: null } }
    );
    
    await db.collection('mfaconfigs').deleteOne({ userId });
  });
}

// ✅ OPCIÓN 4: Crear colección de "Links" para referencias explícitas

db.collection('documentreferences').insertOne({
  _id: new ObjectId(),
  tenantId: tenantId,
  documentId: documentId,
  pedidoId: pedidoId,
  tipo: 'PEDIDO_REFERENCES_DOCUMENT',
  createdAt: new Date()
});

// Índice: { tenantId: 1, tipo: 1, documentId: 1 }
// Índice: { tenantId: 1, tipo: 1, pedidoId: 1 }
```

**Acción:**
- [ ] Mapear todas las relaciones (documento → pedido, usuario → ticket, etc.)
- [ ] Implementar validación de foreign keys
- [ ] Crear indexes para queries de referencia
- [ ] Decidir: denormalizar vs. change streams vs. links collection

---

### 5. **Falta de Soft Deletes**

**Riesgo: 🟡 MEDIO**

**Problema:**

```javascript
// ❌ Hard delete - pérdida permanente de datos
await db.collection('tickets').deleteOne({ _id: ticketId });
// Ticket se pierde, pero puede haber logs/auditoría que lo referencian

// ❌ No se puede recuperar si fue accidental
// ❌ Auditoría queda inconsistente si ticket fue borrado

async deletePedido(pedidoId, tenantId) {
  await db.collection('pedidos').deleteOne({ _id: new ObjectId(pedidoId), tenantId });
  // ¿Y si el usuario lo hizo por error?
  // ¿Y si hay reportes que necesitan este pedido?
}
```

**Impacto:**
- ✗ Pérdida irreversible de datos
- ✗ Auditoría incompleta
- ✗ Imposible recuperar datos accidentalmente borrados

**Soluciones:**

```javascript
// ✅ SOFT DELETE: Agregar campo isDeleted

// Schema
const TicketSchema = {
  // ... otros campos
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
  deletedBy: { type: String, default: null },
  deletionReason: { type: String, default: null }
};

// Índice para soft delete
db.tickets.createIndex({ tenantId: 1, isDeleted: 1, createdAt: -1 });

// Delete operation
async deleteTicket(ticketId, tenantId, userId, reason) {
  return await db.collection('tickets').updateOne(
    { _id: new ObjectId(ticketId), tenantId },
    {
      $set: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId,
        deletionReason: reason
      }
    }
  );
}

// Find operations (excluir soft-deleted por defecto)
async getActiveTickets(tenantId) {
  return await db.collection('tickets')
    .find({ tenantId, isDeleted: false })
    .sort({ createdAt: -1 })
    .toArray();
}

// Restore operation
async restoreTicket(ticketId, tenantId) {
  return await db.collection('tickets').updateOne(
    { _id: new ObjectId(ticketId), tenantId },
    {
      $set: {
        isDeleted: false,
        deletedAt: null,
        deletedBy: null
      }
    }
  );
}

// Auditoría automática
async deleteTicketAtomic(ticketId, tenantId, userId, reason, session) {
  // 1. Soft delete
  await db.collection('tickets').updateOne(
    { _id: new ObjectId(ticketId), tenantId },
    { $set: { isDeleted: true, deletedAt: new Date(), deletedBy: userId } },
    { session }
  );
  
  // 2. Log de auditoría
  await db.collection('logsauditoria').insertOne({
    tenantId,
    action: 'DELETE',
    entityType: 'TICKET',
    entityId: ticketId,
    performedBy: userId,
    reason,
    timestamp: new Date()
  }, { session });
}
```

**Acción:**
- [ ] Agregar isDeleted, deletedAt, deletedBy a: tickets, pedidos, documentos, usuarios
- [ ] Crear índices compuestos con isDeleted
- [ ] Actualizar todos los find() para excluir soft-deleted
- [ ] Crear UI para restaurar elementos

---

### 6. **Ausencia de Versionamiento de Datos**

**Riesgo: 🟡 MEDIO**

**Problema:**

```javascript
// ❌ No hay historial de cambios en documentos importantes
const ticket = await db.collection('tickets').findOne({ _id: ticketId });
// ¿Quién lo creó? ¿Cuándo cambió de estado? ¿Quién lo asignó?
// Solo vemos el estado ACTUAL

// ❌ No hay auditoría de cambios en pedidos
const pedido = await db.collection('pedidos').findOne({ _id: pedidoId });
// ¿Quién cambió el estado? ¿Hubo análisis anterior?
// Imposible rastrear historial
```

**Impacto:**
- ✗ Imposible auditar cambios
- ✗ No se puede recuperar versión anterior
- ✗ Cumplimiento normativo comprometido

**Soluciones:**

```javascript
// ✅ VERSIONING: Guardar historial en campo de la entidad

// Schema con versiones embebidas
const TicketVersioned = {
  _id: ObjectId,
  tenantId: String,
  subject: String,
  // ... campos actuales
  
  // Historial completo
  versions: [
    {
      versionNumber: 1,
      snapshot: { subject: "Original...", status: "OPEN", ... },
      changedBy: "user-123",
      changedAt: Date,
      changeReason: "Ticket created"
    },
    {
      versionNumber: 2,
      snapshot: { status: "INPROGRESS" },
      changedBy: "user-456",
      changedAt: Date,
      changeReason: "Assigned to Tecnico A"
    }
  ]
};

// Update con versioning
async updateTicket(ticketId, tenantId, updates, userId, reason) {
  const session = db.getMongo().startSession();
  session.startTransaction();
  
  try {
    // Obtener ticket actual
    const ticket = await db.collection('tickets')
      .findOne({ _id: new ObjectId(ticketId), tenantId });
    
    // Crear nueva versión
    const newVersion = {
      versionNumber: (ticket.versions?.length || 0) + 1,
      snapshot: updates,
      changedBy: userId,
      changedAt: new Date(),
      changeReason: reason
    };
    
    // Actualizar con nueva versión
    await db.collection('tickets').updateOne(
      { _id: new ObjectId(ticketId), tenantId },
      {
        $set: updates,
        $push: { versions: newVersion }
      },
      { session }
    );
    
    await session.commitTransaction();
  } finally {
    await session.endSession();
  }
}

// Auditoría con versiones
async getTicketHistory(ticketId, tenantId) {
  const ticket = await db.collection('tickets')
    .findOne({ _id: new ObjectId(ticketId), tenantId });
  
  return ticket.versions?.map((v, i) => ({
    version: v.versionNumber,
    changes: v.snapshot,
    changedBy: v.changedBy,
    changedAt: v.changedAt,
    reason: v.changeReason,
    diffFromPrevious: diff(
      ticket.versions[i-1]?.snapshot,
      v.snapshot
    )
  })) || [];
}
```

**Acción:**
- [ ] Agregar field `versions: []` a tickets, pedidos, documentos
- [ ] Crear función `trackVersion()` reutilizable
- [ ] Crear API GET /api/entities/{id}/history
- [ ] Crear UI para ver timeline de cambios

---

### 7. **Multitenancy - Separación de Datos Incompleta**

**Riesgo: 🟠 ALTO**

**Problema:**

```javascript
// ❌ Algunos datos GLOBALES, otros AISLADOS
// Prompts es global (puede ser conforme al diseño)
const prompts = await db.collection('prompts')
  .find({ tenantId, key: 'RAGGENERATOR' });
// OK - aislado por tenant

// ❌ Pero usuarios está separado en DB diferente
const user = await connectAuthDB()
  .collection('usuarios')
  .findOne({ email: 'user@abd.es' });
// Riesgo: usuarios en auth DB, pero datos de usuario en main DB
// ¿Coherencia de quién pertenece a qué tenant?

// ❌ Logs en DB separada - ¿Se limpian con tenants?
const logs = await connectLogsDB()
  .collection('logsaplicacion')
  .find({ tenantId });
// ¿Qué pasa si eliminas un tenant? ¿Se eliminan logs?

// ❌ MFAConfigs usa userId como clave principal
const mfaConfig = await db.collection('mfaconfigs')
  .findOne({ userId: 'user-123' });
// Pero userId no es único a nivel global si hay multi-tenant
// Usuario A en tenant X vs Usuario A en tenant Y podrían tener mismo email
```

**Impacto:**
- ✗ Datos de usuario distribuidos en 2 DBs
- ✗ Sin coherencia en eliminar tenant (orphaned logs, configs)
- ✗ Posible colisión de IDs si tenants comparten DB

**Soluciones:**

```javascript
// ✅ OPCIÓN 1: Consolidar schemas con tenantId consistente

// MFAConfig con tenantId
const MFAConfigConsolidated = {
  _id: ObjectId,
  userId: String,
  tenantId: String, // ← AGREGAR
  enabled: Boolean,
  secret: String,
  recoveryCodes: [String],
  createdAt: Date
};

// Índice único compuesto
db.mfaconfigs.createIndex({ tenantId: 1, userId: 1 }, { unique: true });

// ✅ OPCIÓN 2: DB strategy clara

// Arquitectura recomendada:
const DATABASES = {
  ABD_ELEVATORS_MAIN: {
    documentostecnicos, documentchunks, pedidos, casos,
    prompts, ragjudges, ragevaluations,
    tickets, taxonomias, workflowdefinitions,
    usagelogs, validaciones
    // Todos MULTI-TENANT
  },
  ABD_ELEVATORS_AUTH: {
    usuarios, // MULTI-TENANT
    tenants, // MULTI-TENANT
    mfaconfigs // MULTI-TENANT
  },
  ABD_ELEVATORS_LOGS: {
    logsaplicacion, // MULTI-TENANT
    logsauditoria, // MULTI-TENANT
    emailnotifications, // MULTI-TENANT
    tenantconfigshistory // MULTI-TENANT
  }
};

// ✅ OPCIÓN 3: Procedure para limpiar tenant

async function deleteTenantCascade(tenantId, session) {
  const collections = [
    // MAIN DB
    'documentostecnicos', 'documentchunks', 'pedidos', 'casos',
    'prompts', 'ragjudges', 'ragevaluations',
    'tickets', 'taxonomias', 'workflowdefinitions',
    'usagelogs', 'validaciones',
    // AUTH DB
    'usuarios', 'mfaconfigs',
    // LOGS DB
    'logsaplicacion', 'logsauditoria', 'emailnotifications'
  ];
  
  for (const collName of collections) {
    const db = getDatabaseForCollection(collName);
    await db.collection(collName).deleteMany({ tenantId }, { session });
  }
  
  // Finalmente eliminar tenant
  await connectAuthDB().collection('tenants')
    .deleteOne({ tenantId }, { session });
}

// ✅ OPCIÓN 4: Separación física de DBs por tenant (Enterprise)

// Para tenants enterprise:
const ENTERPRISE_TOPOLOGY = {
  tenant1: {
    primary: 'tenant1.abd-elevators-data',
    auth: 'tenant1.abd-elevators-auth',
    logs: 'tenant1.abd-elevators-logs'
  },
  tenant2: {
    primary: 'tenant2.abd-elevators-data',
    auth: 'tenant2.abd-elevators-auth',
    logs: 'tenant2.abd-elevators-logs'
  }
};
```

**Acción:**
- [ ] Auditar quién está en qué DB
- [ ] Crear función de limpieza tenantId completa
- [ ] Documentar arquitectura multi-DB
- [ ] Tests de aislamiento de tenant

---

## 🟢 COSAS QUE FUNCIONAN BIEN

### ✅ 1. **Schema Clara y Tipada (Zod)**

```typescript
// ✓ Validación de tipos en inserción
const TicketSchema = z.object({
  tenantId: z.string(),
  subject: z.string().min(5),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
});

// ✓ Previene datos malformados
const validated = TicketSchema.parse(data);
```

### ✅ 2. **Logging Estructurado Centralizado**

```javascript
// ✓ Todos los eventos van a colección logsaplicacion
await logEvento({
  nivel: 'INFO',
  origen: 'TICKETSERVICE',
  accion: 'CREATETICKET',
  mensaje: '...',
  correlacionid: uuid,
  tenantId: tenant
});

// ✓ Rastreable por correlationId (distributed tracing)
```

### ✅ 3. **Multitenancy en Query Patterns**

```javascript
// ✓ Patrón consistente: buscar por (tenantId, field)
db.collection(name)
  .find({ tenantId, status: 'COMPLETED' })
  .toArray();
```

### ✅ 4. **TTL para datos temporales**

```javascript
// ✓ Logs se auto-limpian después de 90 días
db.logsaplicacion.createIndex({ timestamp: 1 }, { expireAfterSeconds: 7776000 });
```

### ✅ 5. **Deduplicación con MD5**

```javascript
// ✓ Evita subidas duplicadas
const hash = md5(file);
const existing = await db.collection('documentostecnicos')
  .findOne({ archivomd5: hash, tenantId });
```

---

## 📋 MATRIZ DE RIESGOS Y PRIORIDADES

| # | Riesgo | Severidad | Impacto | Esfuerzo | Prioridad | Timeline |
|---|--------|-----------|---------|----------|-----------|----------|
| 1 | Cross-tenant data leak | 🔴 CRÍTICO | Compliance fail | 🔴 ALTO | ASAP | Week 1 |
| 2 | Index performance | 🟠 ALTO | Latency +500% | 🟢 BAJO | High | Week 1 |
| 3 | No ACID transactions | 🟠 ALTO | Data corruption | 🟠 MEDIO | High | Week 2 |
| 4 | Data integrity (FK) | 🟠 ALTO | Orphaned records | 🟠 MEDIO | High | Week 2 |
| 5 | Hard delete | 🟡 MEDIO | Data loss | 🟢 BAJO | Medium | Week 3 |
| 6 | No versioning | 🟡 MEDIO | Audit gaps | 🟠 MEDIO | Medium | Week 3 |
| 7 | DB fragmentation | 🟡 MEDIO | Scaling issues | 🟠 MEDIO | Medium | Week 4 |

---

## 🚀 ROADMAP DE CORRECCIONES

### FASE 1: SEGURIDAD (Week 1-2) - CRÍTICO

```
✓ Implementar validateTenantMiddleware
✓ Auditar 100% queries con tenantId
✓ Tests de cross-tenant security
✓ Documentar: tenantId NUNCA del cliente
```

### FASE 2: PERFORMANCE (Week 1) - HIGH

```
✓ Crear índices compuestos (tenantId, field)
✓ Ejecutar explain() en top 10 queries
✓ Benchmarks antes/después
✓ Monitoreo de query latency
```

### FASE 3: INTEGRIDAD (Week 2-3) - HIGH

```
✓ Transacciones en multi-step operations
✓ Foreign key validation
✓ Soft deletes en entidades principales
✓ Change streams para cascadas
```

### FASE 4: AUDITORÍA (Week 3-4) - MEDIUM

```
✓ Versionamiento en tickets/pedidos
✓ Timeline visual en UI
✓ Historial completo de cambios
✓ Restored items recovery UI
```

### FASE 5: ESCALABILIDAD (Week 4+) - MEDIUM

```
✓ Archiving de datos old (>2 años)
✓ Sharding strategy (por tenant)
✓ Read replicas para reporting
✓ Federation de DBs (BYODB)
```

---

## 📊 COHERENCIA ENTRE PARTES

### Problema: Datos Dispersos

```
❌ ACTUAL:
  usuarios         → Auth DB
  tenants         → Auth DB
  documentos      → Main DB
  pedidos         → Main DB
  logs            → Logs DB (separada)
  mfaconfigs      → Auth DB

¿Coherencia?
- ¿Qué pasa al eliminar tenant?
- ¿Logs se limpian?
- ¿MFA configs se eliminan?
- ¿Usuarios se eliminan?
- Sin transacción cross-DB
```

### Solución: Arquitectura Consolidada

```
✅ PROPUESTO:
  
  DATABASE: abd-elevators
    - documentostecnicos (tenantId indexed)
    - documentchunks (tenantId indexed)
    - pedidos (tenantId indexed)
    - casos (tenantId indexed)
    - prompts (tenantId indexed)
    - ragjudges (tenantId indexed)
    - ragevaluations (tenantId indexed)
    - tickets (tenantId indexed)
    - taxonomias (tenantId indexed)
    - workflowdefinitions (tenantId indexed)
    - usagelogs (tenantId indexed)
    - validaciones (tenantId indexed)
    - usuarios (tenantId indexed)
    - tenants (tenantId unique key)
    - mfaconfigs (tenantId + userId unique)
    
  DATABASE: abd-elevators-logs
    - logsaplicacion (tenantId indexed, TTL 90 days)
    - logsauditoria (tenantId indexed, TTL 365 days)
    - emailnotifications (tenantId indexed, TTL 30 days)
    - tenantconfigshistory (tenantId indexed)

✅ BENEFICIO:
  - Una sola transacción para limpiar tenant
  - Coherencia garantizada
  - Fácil hacer backup/restore por tenant
  - Fácil migrar a BYODB
```

### Problema: Prompts

```
❌ ¿Global o Multi-tenant?
  Código actual sugiere multi-tenant (tenantId field)
  Pero ¿cada tenant tiene sus propios prompts?
  ¿O hay prompts "default" globales?
```

### Solución:

```
✅ Modelo de prompts:
  
  Prompts tabla:
    _id: ObjectId
    tenantId: String (para custom overrides)
    system: Boolean (true = global default)
    key: String (RAGGENERATOR, MODELEXTRACTOR, etc.)
    content: String
    version: String
    active: Boolean
    
  Índices:
    - { system: 1, key: 1, active: 1 }
    - { tenantId: 1, key: 1, active: 1 }
    
  Lógica:
    1. Buscar prompt personalizado: { tenantId, key, active: true }
    2. Si no existe, buscar default: { system: true, key, active: true }
    3. Si tampoco existe, error
```

---

## 🎯 CONCLUSIONES Y RECOMENDACIONES

### Top 5 Acciones Inmediatas

1. **🔴 Implementar validateTenantMiddleware** (Week 1)
   - Security issue crítico
   - Tomar 2-3 horas
   - Previene data breaches

2. **🟠 Crear índices compuestos** (Week 1)
   - Performance issue evidente
   - Tomar 1 hora
   - ROI 10x en latency

3. **🟠 Transacciones ACID** (Week 2)
   - Data consistency issue
   - Tomar 1-2 días
   - Previene corrupción

4. **🟡 Soft deletes + versionamiento** (Week 3)
   - Auditoría y compliance
   - Tomar 3-5 días
   - Mejora traceabilidad

5. **🟡 Consolidar arquitectura DB** (Week 4)
   - Coherencia y escalabilidad
   - Tomar 2-3 días
   - Simplifica operations

---

## 📄 Archivos de Implementación

### Scripts SQL para crear índices:
```
// Create all recommended indexes script
mongo --file create_indexes.js
```

### Middleware validación:
```typescript
// /src/middleware/validateTenant.ts
// Implementación completa lista
```

### Transacciones helper:
```typescript
// /src/lib/db-transactions.ts
// withTransaction(), createWithAudit(), etc.
```

---

¿Necesitas que profundice en alguna sección o que genere los archivos de implementación específicos?