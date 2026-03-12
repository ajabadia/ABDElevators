# Apéndice Técnico: Arquitectura Multi-tenant

## 1. Modelo de Aislamiento
La plataforma utiliza un modelo de aislamiento lógico basado en `tenantId` en todas las colecciones relevantes.

## 2. Mecanismo de Seguridad (BaseRepository)
- **Aislamiento Nativo**: `BaseRepository` utiliza `SecureCollection` que inyecta automáticamente el filtro `{ tenantId }` en todas las operaciones.
- **Validación Relacional**: El método `validateExists` asegura que las claves foráneas pertenecen al mismo tenant antes de persistir.

## 3. Aislamiento en RAG (Vector DB)
- **Ingesta**: Cada chunk se etiqueta con `tenantId`.
- **Búsqueda**: Las queries a la base de datos vectorial aplican un filtro obligatorio por `tenantId` obtenido de la sesión activa.

## 4. API Keys
Las API Keys están vinculadas a un `tenantId` único y están restringidas por `scopes` (TENANT, SPACE, ASSET). El sistema valida que el token no pueda acceder a datos fuera de su propiedad.
