# Guías de Arquitectura y Mejores Prácticas: Refactorización de Base de Datos (Fase 350)

Este documento sirve como registro vital de las precauciones y estándares de la industria que deben aplicarse durante la ejecución de la Fase 350 (Data Architecture & Relational Integrity) descrita en `2901.txt`.

## 1. Estrategia de Migración: Patrón "Expand and Contract" (Zero Downtime)
Las migraciones masivas que alteran el esquema no deben hacerse "de golpe" (Big Bang), ya que bloquean la aplicación y tienen un alto riesgo de pérdida de datos.

**Flujo obligatorio para cada refactor de esquema:**
1. **Expandir (Fase A):** Actualizar la API para que escriba en *ambos* esquemas (el viejo y el nuevo) simultáneamente. La lectura sigue usando el viejo.
2. **Migrar (Fase B):** Lanzar un script en background (worker) que copie los datos históricos del esquema viejo al nuevo.
3. **Transicionar (Fase C):** Cambiar la API para que *lea* del nuevo esquema.
4. **Contraer (Fase D):** Eliminar el código del esquema viejo y borrar los campos obsoletos de la BDD.

## 2. Gestión de Permisos (RBAC) y Caché
Mover los Roles (ej. `ADMIN`, `VIEWER`) de simples strings en el JWT a referencias cruzadas en MongoDB introduce un problema de rendimiento (N+1 queries en cada request protegida).

**Solución obligatoria:**
- **Inyección en JWT:** Los `effectivePermissions` deben inyectarse en el JWT (token de sesión) al momento del login.
- **Invalidación (Versionado):** Añadir un `permissionsVersion` al usuario. Si el rol se edita centralmente, se incrementa la versión. El middleware verificará si el token tiene una versión antigua y forzará una recarga silenciosa de la sesión contra Redis o la BDD.

## 3. Conflicto Soft Deletes vs GDPR (Right to be Forgotten)
El enfoque de añadir un `deletedAt` universal (Soft Delete) es excelente para integridad referencial y recuperación de errores («papelera de reciclaje»), pero viola normativas como GDPR / SOC2 si se retiene PII indefinidamente.

**Solución obligatoria:**
- Implementar un **Cron Job o TTL Index** que busque registros con `deletedAt` mayor a 30 días y ejecute un *Hard Delete* definitivo de la base de datos, así como la purga de cualquier dato encolado o vectores asociados en Pinecone/Weaviate.

## 4. Consistencia Eventual vs Transaccionalidad
No todas las relaciones requieren transacciones estrictas de MongoDB (`session.withTransaction`). 

**Solución obligatoria:**
- **Transacciones Síncronas:** Usarlas SOLO para operaciones del mismo dominio lógico (ej. Crear un Usuario y asignarle un Tenant).
- **Change Streams / Eventos (Outbox Pattern):** Para operaciones distribuidas (ej. Actualizar métricas `totalAssets`, notificar a otro módulo, indexar en VectorDB), insertar un evento en una colección `outbox_events` dentro de la transacción. Un worker leerá esa colección asíncronamente para actualizar las Vistas Materializadas o enviar a Pinecone. Esto previene cuellos de botella.

## 5. Idempotencia en Workflows y Webhooks
La nueva colección de ejecuciones (`workflow_executions`) manejará retries. Si un worker se cuelga y se reinicia, podría ejecutar un nodo LLM dos veces.

**Solución obligatoria:**
- Todo paso (Edge/Node) que modifique estado o envíe notificaciones debe recibir un `idempotency_key` generado a partir del `workflowExecutionId` + `nodeId`. Guardar el resultado en la BDD para retornar la respuesta cacheada si se intente repetir.
