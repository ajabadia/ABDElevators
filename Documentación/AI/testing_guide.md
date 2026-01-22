# Guía de Pruebas - RAG Vision 2.0

Esta guía describe cómo validar las nuevas capacidades de generalización y aislamiento de la plataforma.

## 🧪 Pruebas de Generalización (Multi-Industria)

La plataforma ahora adapta su terminología según el contexto del usuario.

### 1. Verificación de "Pedidos" (ELEVATORS)
- **Usuario**: `tecnico@abd.com` o cualquier usuario sin industria definida (fallback).
- **Qué verificar**:
    - El Header muestra "Análisis de Pedidos Técnico".
    - Los botones dicen "Iniciar Análisis Pedido".
    - El historial muestra "PEDIDO_#...".

### 2. Verificación de "Expedientes" (LEGAL)
Para probar esto, debes simular un usuario del sector legal o actualizar uno en la DB:
- **Acción**: Ejecuta en la terminal de MongoDB:
  ```javascript
  db.usuarios.updateOne({email: "tecnico@abd.com"}, {$set: {industry: "LEGAL"}})
  ```
- **Qué verificar (tras login)**:
    - El Header cambia automáticamente a "Análisis de Expedientes Técnico".
    - La descripción menciona "contratos o documentos legales".
    - El botón de acción cambia a "Analizar Contrato".

---

## 🔒 Pruebas de Aislamiento (Multi-Tenant)

### 1. Inyección de TenantId
- Sigue el flujo de análisis de un documento.
- Verifica en la colección `pedidos` de MongoDB que el nuevo registro contiene el campo `tenantId` correcto (basado en el usuario que hizo la carga).

### 2. Aislamiento de Consultas
- El helper `db-tenant.ts` asegura que el usuario solo puede ver lo que pertenece a su organización.
- Si intentas acceder a un `pedido_id` de otro tenant via API, el sistema debe denegar el acceso (implementado en el middleware de aislamiento).

---

## 🏗️ Pruebas del Motor de Workflows (Visión 2.0 - Fase 7.2)

El sistema ahora permite transiciones de estado configurables por industria.

### 1. Inicializar Workflows
- **Acción**: Ejecuta en la terminal:
  ```bash
  npm run seed-workflows
  ```
  *(Nota: Asegúrate de tener el script en `package.json` o usa `npx ts-node scripts/seed-workflows.ts`)*

### 2. Prueba de Transición (Análisis)
- **Contexto**: Un técnico analiza un documento.
- **Acción**: Tras el análisis, el sistema crea un "Caso Genérico" en estado `PENDING`.
- **API Call**: Puedes simular el avance del workflow llamando a:
  ```http
  POST /api/casos/[caso_id]/transicion
  Content-Type: application/json
  {
    "action": "ANALYZE",
    "industry": "ELEVATORS",
    "caseType": "MAINTENANCE"
  }
  ```
- **Verificación**: El estado del caso en MongoDB debe cambiar a `ANALYZED`.

### 3. Restricciones de Rol (Seguridad)
- **Acción**: Intenta ejecutar la acción `FINALIZE` (Cerrar Caso) con un usuario con rol `TECNICO`.
- **Verificación**: El sistema debe devolver un error `403 UNAUTHORIZED` ya que el workflow base exige rol `ADMIN` para esta acción.
- **Acción**: Intenta cerrar el caso con el admin sin enviar firma.
- **Verificación**: Debe fallar indicando que la firma es obligatoria (`require_signature: true`).

---

## 🏷️ Pruebas de Taxonomías y Metadatos (Visión 2.0 - Fase 7.3)

El sistema soporta categorización dinámica mediante taxonomías por industria.

### 1. Inicializar Taxonomías
- **Acción**: Ejecuta en la terminal:
  ```bash
  npx tsx scripts/seed-taxonomies.ts
  ```

### 2. Verificación de Disponibilidad
- **API Call**: Verifica las taxonomías disponibles para tu industria:
  ```http
  GET /api/admin/taxonomias
  ```
- **Verificación**: Debes recibir la lista de taxonomías (`geography`, `asset_type`, `criticality`) con sus opciones correspondientes (Norte, Sur, Ascensor, Alta, etc.).

### 3. Aislamiento por Tenant
- **Verificación**: Asegúrate de que las taxonomías creadas tienen el `tenantId` correcto. Un usuario de otro tenant no debería ver estas etiquetas si no han sido creadas expresamente para él.

---

## 📊 Logs y Monitoreo

## 📋 Checklist General

- [x] **Auth**: Login persistente con roles y contexto industrial.
- [x] **Layout**: Sidebar con labels dinámicos reactivos.
- [x] **RAG**: Búsqueda vectorial filtrada por tenant.
- [x] **Taxonomías**: Categorización dinámica por industria/tenant activa.
- [x] **Admin**: Gestión de usuarios y configuración industrial.
