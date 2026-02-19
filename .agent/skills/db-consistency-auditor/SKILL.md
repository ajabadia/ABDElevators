---
name: db-consistency-auditor
description: Audita la consistencia de las conexiones a base de datos, asegurando que cada colección se dirija a su clúster correspondiente (AUTH, LOGS, MAIN).
---

# DB Consistency Auditor Skill

Este skill garantiza que las operaciones de base de datos se realicen en el clúster correcto, evitando mezclar datos de identidad, logs y negocio.

## 📋 Reglas de Auditoría

Cada colección debe usar su conexión específica o `getTenantCollection` (que maneja el ruteo internamente).

### 1. Cluster: AUTH (MONGODB_AUTH_URI)
Contiene datos de identidad, tenants y configuraciones críticas.
- **Colecciones:** `users`, `v2_users`, `tenants`, `tenant_configs`, `mfa_configs`, `invitations`, `permission_groups`
- **Conexión válida:** `connectAuthDB()` o `getTenantCollection(nombre, session, 'AUTH')`

### 2. Cluster: LOGS (MONGODB_LOGS_URI)
Contiene trazas de auditoría, uso y notificaciones.
- **Colecciones:** `application_logs`, `usage_logs`, `notifications`, `notification_templates`, `notification_configs`
- **Conexión válida:** `connectLogsDB()` o `getTenantCollection(nombre, session, 'LOGS')`

### 3. Cluster: MAIN (MONGODB_URI)
Contiene los datos de negocio y activos de conocimiento.
- **Colecciones:** `document_types`, `taxonomies`, `knowledge_assets`, `user_documents`, `spaces`, `tickets`, `rag_audit`, `audit_ingestion`, `document_chunks`, `reports`, `rag_evaluations`
- **Conexión válida:** `connectDB()` o `getTenantCollection(nombre, session, 'MAIN')`

## 🚫 Red Flags (Errores Críticos)

- ❌ `connectDB().collection('users')` -> Los usuarios NO están en el clúster MAIN.
- ❌ `connectAuthDB().collection('reports')` -> Los informes NO son datos de identidad.
- ❌ **CRÍTICO**: Uso de `db.collection(...)` directo en APIs -> Salta el aislamiento multi-tenant (Regla de Oro #11).
- ❌ Uso de `db.collection(...)` sin haber validado previamente a qué clúster pertenece `db`.
- ❌ Hardcoding de nombres de base de datos en las queries.

## ✅ Mejores Prácticas

- Usar **`getTenantCollection`** siempre que sea posible, ya que aplica automáticamente las reglas de ruteo definidas en `db-tenant.ts`.
- Si se necesita acceso directo (ej: scripts de migración), usar la función de conexión explícita (`connectAuthDB`, `connectLogsDB`, `connectDB`).

## 🛠️ Cómo Auditar

1. Identifica las colecciones que usa el archivo.
2. Verifica qué función de conexión se está utilizando.
3. Si se usa `getTenantCollection`, verificar si el `dbType` (si se pasa) es coherente.
4. Si se usa `connectDB`/`connectAuthDB`/`connectLogsDB`, verificar que la colección pertenezca a ese clúster según las tablas anteriores.
