---
name: db-consistency-auditor
description: Audita la consistencia de las conexiones a base de datos, asegurando que cada colección se dirija a su clúster correspondiente (AUTH, LOGS, MAIN).
---

# DB Consistency Auditor Skill

Este skill garantiza que las operaciones de base de datos se realicen en el clúster correcto, evitando mezclar datos de identidad, logs y negocio.

## 📋 Reglas de Auditoría

Cada colección debe usar su conexión específica o `getTenantCollection` (que maneja el ruteo internamente).

### 1. Cluster: AUTH (MONGODB_AUTH_URI)
Contiene datos de identidad, tenants y seguridad.
- **Colecciones:** `users`, `tenants`, `sessions`, `accounts`, `logins`, `invitations`, `mfa_configs`
- **Conexión válida:** `connectAuthDB()` o `getTenantCollection(nombre, session, 'AUTH')`

- **Conexión válida**: `connectLogsDB()` o `getTenantCollection(nombre, session, 'LOGS')`

### 2.5 Cluster: CONFIG (MONGODB_CONFIG_URI) - Era 12+
Contiene la inteligencia y metadatos de configuración de la plataforma.
- **Colecciones:** `translations`, `prompts`, `prompt_versions`, `ai_configs`, `tenant_configs`, `workflow_configs`, `document_types`, `pricing_plans`, `feature_flags`, `spaces`, `policies`, `taxonomies`, `agent_checkpoints`
- **Conexión válida**: `connectConfigDB()` o `getTenantCollection(nombre, session, 'CONFIG')`

### 3. Cluster: MAIN (MONGODB_URI)
Contiene los activos de conocimiento y datos operacionales de negocio.
- **Colecciones:** `entities`, `knowledge_assets`, `user_documents`, `tickets`, `cases`, `pedidos`, `workflow_tasks`, `document_chunks`, `ingestion_blobs`, `rag_evaluations`, `rag_eval_dataset`, `rag_feedback`
- **Conexión válida**: `connectDB()` o `getTenantCollection(nombre, session, 'MAIN')`
- **Nota Era 12**: La mayoría de configuraciones (antes en MAIN) ahora residen en el clúster `CONFIG`.

### 4. Cluster: MAIN (MONGODB_URI)
Contiene los activos de conocimiento y datos operacionales de negocio.
- **Colecciones:** `entities`, `knowledge_assets`, `user_documents`, `tickets`, `cases`, `pedidos`, `workflow_tasks`, `document_chunks`, `ingestion_blobs`, `rag_evaluations`, `rag_eval_dataset`, `rag_feedback`
- **Conexión válida:** `connectDB()` o `getTenantCollection(nombre, session, 'MAIN')`


## 🚫 Red Flags (Errores Críticos)

- ❌ `connectDB().collection('users')` -> Los usuarios NO están en el clúster MAIN.
- ❌ `connectAuthDB().collection('reports')` -> Los informes NO son datos de identidad.
- ❌ **CRÍTICO**: Uso de `db.collection(...)` directo en APIs -> Salta el aislamiento multi-tenant (Regla de Oro #11).
- ❌ **NEW ERA 12**: Uso de `string` para Foreign Keys. OBLIGATORIO usar `EntityIdSchema` (Branded types) para `userId`, `tenantId`, etc.
- ❌ **UNSAFE OPS**: Múltiples escrituras DB relacionadas sin usar `session.withTransaction`.

## ✅ Mejores Prácticas

- Usar **`getTenantCollection`** siempre que sea posible, ya que aplica automáticamente las reglas de ruteo definidas en `db-tenant.ts`.
- Si se necesita acceso directo (ej: scripts de migración), usar la función de conexión explícita (`connectAuthDB`, `connectLogsDB`, `connectDB`).

## 🛠️ Cómo Auditar

1. Identifica las colecciones que usa el archivo.
2. Verifica qué función de conexión se está utilizando.
3. Si se usa `getTenantCollection`, verificar si el `dbType` (si se pasa) es coherente.
4. Si se usa `connectDB`/`connectAuthDB`/`connectLogsDB`, verificar que la colección pertenezca a ese clúster según las tablas anteriores.
