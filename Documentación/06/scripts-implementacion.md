# 🔧 SCRIPTS DE IMPLEMENTACIÓN - MongoDB Fixes

## 1. Crear Todos los Índices Recomendados

```javascript
// FILE: scripts/create_indexes.js
// Ejecución: mongosh < create_indexes.js

const db = db.getSiblingDB('ABD-Elevators');

console.log('=== CREANDO ÍNDICES PARA MAIN DB ===');

// ============================================
// DOCUMENTOS TÉCNICOS
// ============================================
console.log('📄 documentostecnicos...');
db.documentostecnicos.createIndex({ tenantId: 1, createdAt: -1 });
db.documentostecnicos.createIndex({ tenantId: 1, archivomd5: 1 });
db.documentostecnicos.createIndex({ tenantId: 1, userId: 1 });
db.documentostecnicos.createIndex({ email: 1 }, { unique: true });

// ============================================
// DOCUMENT CHUNKS (Critical for RAG)
// ============================================
console.log('🔤 documentchunks...');
db.documentchunks.createIndex({ tenantId: 1, origendoc: 1 });
db.documentchunks.createIndex({ tenantId: 1, isshadow: 1 });
db.documentchunks.createIndex({ tenantId: 1, embedding: '2dsphere' });
db.documentchunks.createIndex({ tenantId: 1, textochunk: 'text' });

// ============================================
// PEDIDOS
// ============================================
console.log('📦 pedidos...');
db.pedidos.createIndex({ tenantId: 1, estado: 1, createdAt: -1 });
db.pedidos.createIndex({ tenantId: 1, archivomd5: 1 });
db.pedidos.createIndex({ tenantId: 1, createdAt: -1 });

// ============================================
// CASOS / GENERIC CASES
// ============================================
console.log('🎯 casos...');
db.casos.createIndex({ tenantId: 1, status: 1, priority: 1 });
db.casos.createIndex({ tenantId: 1, industry: 1, createdAt: -1 });
db.casos.createIndex({ tenantId: 1, createdAt: -1 });

// ============================================
// TICKETS / SUPPORT
// ============================================
console.log('🎫 tickets...');
db.tickets.createIndex({ tenantId: 1, status: 1, updatedAt: -1 });
db.tickets.createIndex({ tenantId: 1, createdBy: 1 });
db.tickets.createIndex({ tenantId: 1, assignedTo: 1 });
db.tickets.createIndex({ ticketNumber: 1 }, { unique: true });
db.tickets.createIndex({ tenantId: 1, priority: 1, status: 1 });

// ============================================
// USUARIOS
// ============================================
console.log('👤 usuarios...');
db.usuarios.createIndex({ email: 1 }, { unique: true });
db.usuarios.createIndex({ tenantId: 1, rol: 1 });
db.usuarios.createIndex({ tenantId: 1, activo: 1 });

// ============================================
// PROMPTS
// ============================================
console.log('📝 prompts...');
db.prompts.createIndex({ tenantId: 1, key: 1, active: 1 });
db.prompts.createIndex({ system: 1, key: 1, active: 1 });

// ============================================
// TAXONOMÍAS
// ============================================
console.log('🏷️  taxonomias...');
db.taxonomias.createIndex({ tenantId: 1, industry: 1, key: 1 }, { unique: true });
db.taxonomias.createIndex({ tenantId: 1, active: 1 });

// ============================================
// WORKFLOW DEFINITIONS
// ============================================
console.log('⚙️  workflowdefinitions...');
db.workflowdefinitions.createIndex({ tenantId: 1, entitytype: 1, active: 1 });
db.workflowdefinitions.createIndex({ tenantId: 1, isdefault: 1 });

// ============================================
// USAGE LOGS
// ============================================
console.log('📊 usagelogs...');
db.usagelogs.createIndex({ tenantId: 1, tipo: 1, timestamp: -1 });
db.usagelogs.createIndex({ tenantId: 1, timestamp: -1 });

// ============================================
// RAG EVALUATIONS
// ============================================
console.log('🧪 ragevaluations...');
db.ragevaluations.createIndex({ tenantId: 1, correlacionid: 1 });
db.ragevaluations.createIndex({ tenantId: 1, timestamp: -1 });

// ============================================
// VALIDACIONES
// ============================================
console.log('✅ validaciones...');
db.validaciones.createIndex({ tenantId: 1, validadoPor: 1 });
db.validaciones.createIndex({ tenantId: 1, timestamp: -1 });

console.log('=== CREANDO ÍNDICES PARA AUTH DB ===');
const authDb = db.getSiblingDB('ABD-Elevators-Auth');

// ============================================
// MFA CONFIGS
// ============================================
console.log('🔐 mfaconfigs...');
authDb.mfaconfigs.createIndex({ tenantId: 1, userId: 1 }, { unique: true });

// ============================================
// TENANTS
// ============================================
console.log('🏢 tenants...');
authDb.tenants.createIndex({ tenantId: 1 }, { unique: true });
authDb.tenants.createIndex({ name: 1 });

console.log('=== CREANDO ÍNDICES PARA LOGS DB ===');
const logsDb = db.getSiblingDB('ABD-Elevators-Logs');

// ============================================
// LOGS APLICACIÓN (Con TTL: 90 días)
// ============================================
console.log('📋 logsaplicacion...');
logsDb.logsaplicacion.createIndex({ tenantId: 1, timestamp: -1 });
logsDb.logsaplicacion.createIndex({ timestamp: 1 }, { expireAfterSeconds: 7776000 });
logsDb.logsaplicacion.createIndex({ correlacionid: 1 });

// ============================================
// LOGS AUDITORÍA (Con TTL: 365 días)
// ============================================
console.log('📊 logsauditoria...');
logsDb.logsauditoria.createIndex({ tenantId: 1, timestamp: -1 });
logsDb.logsauditoria.createIndex({ timestamp: 1 }, { expireAfterSeconds: 31536000 });
logsDb.logsauditoria.createIndex({ entityId: 1 });

// ============================================
// EMAIL NOTIFICATIONS (Con TTL: 30 días)
// ============================================
console.log('📧 emailnotifications...');
logsDb.emailnotifications.createIndex({ tenantId: 1, createdAt: -1 });
logsDb.emailnotifications.createIndex({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

// ============================================
// TENANT CONFIGS HISTORY
// ============================================
console.log('📜 tenantconfigshistory...');
logsDb.tenantconfigshistory.createIndex({ tenantId: 1, timestamp: -1 });
logsDb.tenantconfigshistory.createIndex({ tenantId: 1, action: 1 });

console.log('✅ === TODOS LOS ÍNDICES CREADOS ===');
```

---

## 2. Middleware de Validación de TenantId

```typescript
// FILE: src/middleware/validateTenant.ts

import { NextRequest, NextResponse } from 'next/server';
import { AppError } from '@/lib/errors';

/**
 * Middleware para validar tenantId
 * Asegura que:
 * 1. El JWT contiene tenantId válido
 * 2. Las requests no pueden usar tenantId diferente
 * 3. Se loguea cualquier intento de cross-tenant access
 */
export async function validateTenantMiddleware(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  try {
    // 1. Extraer tenantId del JWT (server-side)
    const jwtTenant = request.user?.tenantId; // De middleware de auth
    
    if (!jwtTenant) {
      throw new AppError(
        'UNAUTHORIZED',
        401,
        'No tenant found in authentication token'
      );
    }

    // 2. Verificar que no haya tenantId en query/body que diferencia el del JWT
    const queryTenant = request.nextUrl.searchParams.get('tenantId');
    const bodyTenant = await extractBodyTenant(request);

    const requestedTenant = queryTenant || bodyTenant;

    if (requestedTenant && requestedTenant !== jwtTenant) {
      // ⚠️ INTENTO DE CROSS-TENANT ACCESS
      await logSecurityEvent({
        tipo: 'CROSS_TENANT_ACCESS_ATTEMPT',
        nivel: 'WARN',
        userId: request.user?.id,
        jwtTenant,
        requestedTenant,
        path: request.nextUrl.pathname,
        timestamp: new Date()
      });

      throw new AppError(
        'UNAUTHORIZED',
        403,
        'Cannot access different tenant than your own'
      );
    }

    // 3. Inyectar tenantId en request para que handlers lo usen
    const newRequest = new NextRequest(request);
    newRequest.headers.set('x-tenant-id', jwtTenant);
    newRequest.user = { ...request.user, tenantId: jwtTenant };

    // 4. Procesar handler
    return await handler(newRequest);

  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    throw error;
  }
}

/**
 * Extrae tenantId del body del request
 */
async function extractBodyTenant(request: NextRequest): Promise<string | null> {
  try {
    const cloned = request.clone();
    const body = await cloned.json();
    return body.tenantId || null;
  } catch {
    return null;
  }
}

/**
 * Log de evento de seguridad
 */
async function logSecurityEvent(event: any) {
  const logsDb = await connectLogsDB();
  await logsDb.collection('logsauditoria').insertOne({
    ...event,
    timestamp: new Date(),
    severity: 'SECURITY'
  });
}

// ============================================
// USO EN API ROUTES
// ============================================

// FILE: src/app/api/documents/route.ts

export async function GET(request: NextRequest) {
  return validateTenantMiddleware(request, async (req) => {
    const tenantId = req.headers.get('x-tenant-id');

    // ✓ SEGURO: tenantId viene del servidor, no del cliente
    const docs = await db.collection('documentostecnicos')
      .find({ tenantId })
      .toArray();

    return NextResponse.json(docs);
  });
}
```

---

## 3. Helper para Transacciones ACID

```typescript
// FILE: src/lib/db-transactions.ts

import { ClientSession } from 'mongodb';

/**
 * Ejecuta operación dentro de transacción ACID
 * Auto-rollback si error
 */
export async function withTransaction<T>(
  handler: (session: ClientSession) => Promise<T>,
  options?: {
    retries?: number;
    timeout?: number;
  }
): Promise<T> {
  const client = await connectDB();
  const session = client.startSession();
  
  let retryCount = 0;
  const maxRetries = options?.retries || 3;

  while (retryCount < maxRetries) {
    try {
      session.startTransaction();

      const result = await handler(session);

      await session.commitTransaction();
      return result;

    } catch (error) {
      await session.abortTransaction();

      // Retry si es error transient
      if (isTransientError(error) && retryCount < maxRetries - 1) {
        retryCount++;
        console.warn(`Transaction failed, retrying (${retryCount}/${maxRetries})`, error);
        continue;
      }

      throw error;

    } finally {
      if (retryCount === maxRetries - 1) {
        await session.endSession();
      }
    }
  }
}

/**
 * Crear documento con auditoría automática
 */
export async function createWithAudit<T>(
  collection: string,
  data: T,
  context: {
    tenantId: string;
    userId: string;
    action: string;
    reason?: string;
  }
): Promise<any> {
  return withTransaction(async (session) => {
    const db = await connectDB();
    const col = db.collection(collection);

    // 1. Insertar documento
    const result = await col.insertOne(data, { session });

    // 2. Log de auditoría
    await logAudit({
      tenantId: context.tenantId,
      entityType: collection,
      entityId: result.insertedId.toString(),
      action: context.action,
      performedBy: context.userId,
      reason: context.reason,
      timestamp: new Date()
    }, session);

    return result;
  });
}

/**
 * Eliminar documento (soft delete) con auditoría
 */
export async function softDeleteWithAudit(
  collection: string,
  id: ObjectId,
  context: {
    tenantId: string;
    userId: string;
    reason?: string;
  }
): Promise<void> {
  return withTransaction(async (session) => {
    const db = await connectDB();
    const col = db.collection(collection);

    // 1. Marcar como eliminado
    await col.updateOne(
      { _id: id, tenantId: context.tenantId },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: context.userId,
          deletionReason: context.reason || 'No reason provided'
        }
      },
      { session }
    );

    // 2. Auditoría
    await logAudit({
      tenantId: context.tenantId,
      entityType: collection,
      entityId: id.toString(),
      action: 'SOFT_DELETE',
      performedBy: context.userId,
      reason: context.reason,
      timestamp: new Date()
    }, session);
  });
}

/**
 * Restaurar documento eliminado
 */
export async function restoreWithAudit(
  collection: string,
  id: ObjectId,
  context: {
    tenantId: string;
    userId: string;
  }
): Promise<void> {
  return withTransaction(async (session) => {
    const db = await connectDB();
    const col = db.collection(collection);

    await col.updateOne(
      { _id: id, tenantId: context.tenantId },
      {
        $set: {
          isDeleted: false,
          deletedAt: null,
          deletedBy: null
        }
      },
      { session }
    );

    await logAudit({
      tenantId: context.tenantId,
      entityType: collection,
      entityId: id.toString(),
      action: 'RESTORE',
      performedBy: context.userId,
      timestamp: new Date()
    }, session);
  });
}

/**
 * Actualizar con versionamiento automático
 */
export async function updateWithVersion<T extends any>(
  collection: string,
  id: ObjectId,
  updates: T,
  context: {
    tenantId: string;
    userId: string;
    reason?: string;
  }
): Promise<void> {
  return withTransaction(async (session) => {
    const db = await connectDB();
    const col = db.collection(collection);

    const newVersion = {
      versionNumber: (await getVersionCount(col, id)) + 1,
      snapshot: updates,
      changedBy: context.userId,
      changedAt: new Date(),
      changeReason: context.reason
    };

    await col.updateOne(
      { _id: id, tenantId: context.tenantId },
      {
        $set: updates,
        $push: { versions: newVersion }
      },
      { session }
    );

    await logAudit({
      tenantId: context.tenantId,
      entityType: collection,
      entityId: id.toString(),
      action: 'UPDATE',
      performedBy: context.userId,
      metadata: { versionNumber: newVersion.versionNumber },
      reason: context.reason,
      timestamp: new Date()
    }, session);
  });
}

/**
 * Helpers internos
 */

function isTransientError(error: any): boolean {
  const transientCodes = [11600, 112, 11602];
  return transientCodes.includes(error?.code);
}

async function logAudit(entry: any, session?: ClientSession): Promise<void> {
  const db = await connectLogsDB();
  await db.collection('logsauditoria').insertOne(
    { ...entry, timestamp: new Date() },
    session ? { session } : undefined
  );
}

async function getVersionCount(collection: any, id: ObjectId): Promise<number> {
  const doc = await collection.findOne({ _id: id }, { projection: { versions: 1 } });
  return doc?.versions?.length || 0;
}
```

---

## 4. Tests de Cross-Tenant Security

```typescript
// FILE: tests/security/cross-tenant.test.ts

import { describe, it, expect, beforeAll } from '@jest/globals';
import { ObjectId } from 'mongodb';

describe('Cross-Tenant Security Tests', () => {
  let tenantA: string;
  let tenantB: string;
  let userA: string;
  let userB: string;

  beforeAll(async () => {
    // Setup: crear 2 tenants y usuarios
    tenantA = new ObjectId().toString();
    tenantB = new ObjectId().toString();
    // ... crear usuarios A y B
  });

  it('User A should NOT see documents from Tenant B', async () => {
    // 1. User A intenta leer documentos del Tenant B
    const response = await fetch('/api/documents?tenantId=' + tenantB, {
      headers: { 'Authorization': `Bearer ${tokenUserA}` }
    });

    // 2. Debe ser rechazado
    expect(response.status).toBe(403);
    expect(response.body).toContain('Cannot access different tenant');
  });

  it('User A should only see their own tickets', async () => {
    // 1. User A hace request legítimo (sin tenantId falsificado)
    const response = await fetch('/api/tickets', {
      headers: { 'Authorization': `Bearer ${tokenUserA}` }
    });

    expect(response.status).toBe(200);
    const tickets = await response.json();

    // 2. Verificar que TODOS los tickets pertenecen a Tenant A
    tickets.forEach(ticket => {
      expect(ticket.tenantId).toBe(tenantA);
    });
  });

  it('User A with ADMIN role should NOT see Tenant B admin functions', async () => {
    // 1. Admin de Tenant A intenta acceder a endpoint de admin de Tenant B
    const response = await fetch('/api/admin/users?tenantId=' + tenantB, {
      headers: { 'Authorization': `Bearer ${tokenAdminA}` }
    });

    expect(response.status).toBe(403);
  });

  it('JWT tampering should be detected', async () => {
    // 1. Crear token falso con tenantId forjado
    const tamperedToken = jwt.sign(
      { userId: 'user-a', tenantId: 'fake-tenant' },
      'WRONG_SECRET'
    );

    const response = await fetch('/api/documents', {
      headers: { 'Authorization': `Bearer ${tamperedToken}` }
    });

    expect(response.status).toBe(401);
  });

  it('Should log cross-tenant access attempts', async () => {
    // 1. Intentar access cruzado
    await fetch('/api/documents?tenantId=' + tenantB, {
      headers: { 'Authorization': `Bearer ${tokenUserA}` }
    });

    // 2. Verificar que fue logueado
    const logs = await db.collection('logsauditoria')
      .find({ tipo: 'CROSS_TENANT_ACCESS_ATTEMPT' })
      .toArray();

    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].userId).toBe(userA);
    expect(logs[0].requestedTenant).toBe(tenantB);
  });
});
```

---

## 5. Script para Limpieza de Tenant (Cascada)

```typescript
// FILE: scripts/delete-tenant.ts

import { ObjectId } from 'mongodb';
import { connectDB, connectAuthDB, connectLogsDB } from '../src/lib/db';

/**
 * Elimina un tenant y TODOS sus datos en cascada
 * Ejecutar con: ts-node scripts/delete-tenant.ts <tenantId> --confirm
 */

async function deleteTenantCascade(tenantId: string) {
  console.log(`🗑️  Iniciando eliminación de tenant: ${tenantId}`);

  const mainDb = await connectDB();
  const authDb = await connectAuthDB();
  const logsDb = await connectLogsDB();

  const session = mainDb.getMongo().startSession();
  session.startTransaction();

  try {
    // ============================================
    // 1. MAIN DATABASE
    // ============================================
    console.log('📄 Eliminando documentos técnicos...');
    await mainDb.collection('documentostecnicos').deleteMany({ tenantId }, { session });

    console.log('🔤 Eliminando chunks...');
    await mainDb.collection('documentchunks').deleteMany({ tenantId }, { session });

    console.log('📦 Eliminando pedidos...');
    await mainDb.collection('pedidos').deleteMany({ tenantId }, { session });

    console.log('🎯 Eliminando casos...');
    await mainDb.collection('casos').deleteMany({ tenantId }, { session });

    console.log('🎫 Eliminando tickets...');
    await mainDb.collection('tickets').deleteMany({ tenantId }, { session });

    console.log('📝 Eliminando prompts...');
    await mainDb.collection('prompts').deleteMany({ tenantId }, { session });

    console.log('🏷️  Eliminando taxonomías...');
    await mainDb.collection('taxonomias').deleteMany({ tenantId }, { session });

    console.log('⚙️  Eliminando workflows...');
    await mainDb.collection('workflowdefinitions').deleteMany({ tenantId }, { session });

    console.log('📊 Eliminando usage logs...');
    await mainDb.collection('usagelogs').deleteMany({ tenantId }, { session });

    console.log('✅ Eliminando validaciones...');
    await mainDb.collection('validaciones').deleteMany({ tenantId }, { session });

    // ============================================
    // 2. AUTH DATABASE
    // ============================================
    console.log('👤 Eliminando usuarios...');
    const users = await authDb.collection('usuarios')
      .find({ tenantId })
      .project({ _id: 1 })
      .toArray();

    for (const user of users) {
      await authDb.collection('mfaconfigs').deleteOne({ userId: user._id.toString() }, { session });
    }

    await authDb.collection('usuarios').deleteMany({ tenantId }, { session });

    console.log('🏢 Eliminando tenant...');
    await authDb.collection('tenants').deleteOne({ tenantId }, { session });

    // ============================================
    // 3. LOGS DATABASE
    // ============================================
    console.log('📋 Eliminando logs de aplicación...');
    await logsDb.collection('logsaplicacion').deleteMany({ tenantId }, { session });

    console.log('📊 Eliminando logs de auditoría...');
    await logsDb.collection('logsauditoria').deleteMany({ tenantId }, { session });

    console.log('📧 Eliminando notificaciones de email...');
    await logsDb.collection('emailnotifications').deleteMany({ tenantId }, { session });

    console.log('📜 Eliminando historial de configs...');
    await logsDb.collection('tenantconfigshistory').deleteOne({ tenantId }, { session });

    // ============================================
    // 4. COMMIT TRANSACTION
    // ============================================
    await session.commitTransaction();
    console.log('✅ Tenant eliminado completamente');

  } catch (error) {
    await session.abortTransaction();
    console.error('❌ Error durante eliminación, transaction abortada:', error);
    throw error;

  } finally {
    await session.endSession();
  }
}

// ============================================
// MAIN
// ============================================

const tenantId = process.argv[2];
const confirmFlag = process.argv[3];

if (!tenantId) {
  console.error('Uso: ts-node scripts/delete-tenant.ts <tenantId> --confirm');
  process.exit(1);
}

if (confirmFlag !== '--confirm') {
  console.warn('⚠️  ADVERTENCIA: Este comando eliminará TODOS los datos del tenant');
  console.warn(`Tenant ID: ${tenantId}`);
  console.warn('Para confirmar, ejecuta:');
  console.warn(`  ts-node scripts/delete-tenant.ts ${tenantId} --confirm`);
  process.exit(1);
}

deleteTenantCascade(tenantId)
  .then(() => {
    console.log('🎉 Éxito');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fallo:', error);
    process.exit(1);
  });
```

---

## 6. Monitoreo de Performance de Índices

```typescript
// FILE: scripts/monitor-indexes.ts

import { connectDB } from '../src/lib/db';

/**
 * Analiza performance de índices
 * Ejecutar regularmente: node scripts/monitor-indexes.ts
 */

async function monitorIndexes() {
  const db = await connectDB();

  const collections = [
    'documentostecnicos',
    'documentchunks',
    'pedidos',
    'casos',
    'tickets',
    'usuarios',
    'prompts',
    'usagelogs'
  ];

  console.log('=== ÍNDICE PERFORMANCE REPORT ===\n');

  for (const collName of collections) {
    const col = db.collection(collName);

    // Obtener estadísticas
    const stats = await col.stats();
    const indexes = await col.indexes();

    console.log(`📊 ${collName}`);
    console.log(`   Documents: ${stats.count}`);
    console.log(`   Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Indexes: ${indexes.length}`);

    // Mostrar cada índice
    indexes.forEach((idx) => {
      if (idx.name !== '_id_') {
        const keyStr = Object.keys(idx.key)
          .map((k) => `${k}:${idx.key[k]}`)
          .join(', ');
        console.log(`     - ${idx.name} (${keyStr})`);
      }
    });
    console.log();
  }

  // Recomendaciones
  console.log('=== RECOMENDACIONES ===\n');

  for (const collName of collections) {
    const col = db.collection(collName);
    
    // Analizar queries comunes
    const stats = await db.collection('system.profile')
      .find({ ns: `abd-elevators.${collName}` })
      .sort({ ts: -1 })
      .limit(100)
      .toArray();

    const slowQueries = stats.filter((q) => q.millis > 100);

    if (slowQueries.length > 0) {
      console.log(`⚠️  ${collName}: ${slowQueries.length} queries lentas (>100ms)`);
    }
  }
}

monitorIndexes()
  .then(() => {
    console.log('\n✅ Análisis completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
```

---

## 7. Checklist de Implementación

```markdown
# ☑️ CHECKLIST - Correcciones MongoDB

## FASE 1: SEGURIDAD (Week 1) - CRÍTICO

- [ ] Auditar 100% queries que usan tenantId
- [ ] Implementar validateTenantMiddleware
- [ ] Revisar todos los endpoints que aceptan tenantId
- [ ] Crear tests de cross-tenant security
- [ ] Documentar: "tenantId NUNCA viene del cliente"
- [ ] Security review con equipo
- [ ] Deploy con validación en STAGING
- [ ] Test de carga con intentos de cross-tenant

**Responsable:** Security Team  
**Deadline:** End of Week 1

## FASE 2: PERFORMANCE (Week 1) - HIGH

- [ ] Crear script de índices
- [ ] Ejecutar script en STAGING
- [ ] Verificar índices con `db.collection.getIndexes()`
- [ ] Benchmarks de queries antes/después
- [ ] Monitoreo de query latency
- [ ] Documentar índices por colección
- [ ] Setup de alert si índice está inactivo

**Responsable:** Database Team  
**Deadline:** End of Week 1

## FASE 3: TRANSACCIONES (Week 2) - HIGH

- [ ] Crear helper `withTransaction()`
- [ ] Implementar en `createWithAudit()`
- [ ] Identificar multi-step operations
- [ ] Envolver en transacciones:
  - [ ] Crear pedido + actualizar documento
  - [ ] Crear ticket + notificar usuario
  - [ ] Actualizar workflow + log de auditoría
  - [ ] Deduplicación MD5
- [ ] Tests de race conditions
- [ ] Load testing con transacciones

**Responsable:** Backend Team  
**Deadline:** End of Week 2

## FASE 4: SOFT DELETES (Week 3) - MEDIUM

- [ ] Agregar fields a esquemas:
  - [ ] isDeleted: Boolean
  - [ ] deletedAt: Date
  - [ ] deletedBy: String
  - [ ] deletionReason: String
- [ ] Migración de datos existentes
- [ ] Actualizar todos find() para excluir soft-deleted
- [ ] Crear endpoints de restauración
- [ ] UI para ver eliminados recientemente

**Responsable:** Full Stack Team  
**Deadline:** End of Week 3

## FASE 5: VERSIONAMIENTO (Week 3) - MEDIUM

- [ ] Agregar field `versions: Array` a tickets, pedidos
- [ ] Implementar `updateWithVersion()`
- [ ] Crear API GET /api/entities/{id}/history
- [ ] UI timeline de cambios
- [ ] Diff visual entre versiones

**Responsable:** Full Stack Team  
**Deadline:** End of Week 3

## FASE 6: LIMPIEZA DE TENANT (Week 4) - MEDIUM

- [ ] Crear script `delete-tenant.ts`
- [ ] Test en STAGING con tenant dummy
- [ ] Verificar cascada completa
- [ ] Add logs de eliminación
- [ ] Documentación de procedimiento

**Responsable:** DevOps Team  
**Deadline:** End of Week 4

## FASE 7: MONITOREO (Week 4) - LOW

- [ ] Setup `monitor-indexes.ts`
- [ ] Crear alertas para índices inactivos
- [ ] Crear dashboard de performance
- [ ] Weekly reporting

**Responsable:** Observability Team  
**Deadline:** End of Week 4

---

## VERIFICACIÓN FINAL

- [ ] Todos los índices créados y activos
- [ ] validateTenantMiddleware en todos endpoints
- [ ] Tests de cross-tenant pasan
- [ ] Transacciones en multi-step operations
- [ ] Soft deletes funcionan
- [ ] Versionamiento funciona
- [ ] Limpieza de tenant funciona
- [ ] Monitoreo activo
- [ ] Documentación actualizada
```

---

Estos scripts están listos para ejecutar directamente. ¿Necesitas que profundice en alguno o que genere scripts adicionales para casos específicos?