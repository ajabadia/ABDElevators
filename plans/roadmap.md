# PROYECTO: PROTOTIPO RAG ABDElevators
## ROADMAP DETALLADO DE IMPLEMENTACIÓN (MASTER GUIDE)

Este documento es la **fuente de verdad** para el desarrollo. Se basa en la Especificación Técnica v2.0 y el Plan Strategico de IA.

---

### 🏛️ PILARES DEL PRODUCTO PROFESIONAL
Para no desviarnos del plan "Enterprise-Ready", cada tarea debe cumplir con:
1.  **Trazabilidad Total**: Cada prompt enviado a Gemini y su respuesta deben quedar registrados en `auditoria_rag`.
2.  **Observabilidad**: Uso de `correlacion_id` en logs para seguir el flujo desde el upload hasta el informe.
3.  **Estándares UI/UX taller**: Contraste WCAG AAA, fuentes grandes (16px+), y señales visuales de estado (Vigente/Obsoleto).
4.  **Integridad de Datos**: Nunca se borra información; los documentos se marcan como `obsoletos` o `archivados`.

---

### 🗄️ MAPA DE DATOS (9 COLECCIONES)
1.  `documentos_tecnicos`: Maestro de manuales.
2.  `document_chunks`: Fragmentos vectorizados.
3.  `pedidos`: Registro de análisis.
4.  `checklists_templates`: Plantillas de verificación.
5.  `checklists_pedido`: Ejecuciones firmadas.
6.  `logs_aplicacion`: Auditoría técnica.
7.  `auditoria_rag`: Trazabilidad de IA.
8.  `incidencias_taller`: Loop de feedback.
9.  `estadisticas_diarias`: Métricas de uso.

---

### 🟢 FASE 1: INFRAESTRUCTURA Y FUNDAMENTOS (SEMANA 1)
**Objetivo:** Tener el esqueleto funcional y la base de datos conectada.

- [x] **1.1 Inicialización de Proyecto**
  - Next.js 15 (App Router), TypeScript (Strict Mode), Tailwind CSS.
  - Instalación de Shadcn UI (Component Library).
  - Configuración de variables de entorno (`.env.local`).
- [x] **1.2 Capa de Datos (MongoDB Atlas)**
  - [x] Configuración del cliente MongoDB con singleton pattern en `lib/db.ts`.
  - [x] Definición de Schemas Zod en `lib/schemas.ts`.
  - [ ] Creación de índice de búsqueda vectorial en `document_chunks`.
- [ ] **1.3 Integración de IA (Gemini)**
  - Configuración del SDK en `lib/llm.ts`.
  - Definición de utilidades para embeddings (`text-embedding-004`).
  - Definición de prompts versionados en `lib/prompts.ts`.

---

### 🟡 FASE 2: GESTIÓN DE LA BASE DE CONOCIMIENTO - ADMIN (SEMANA 2)
**Objetivo:** Permitir que ingeniería alimente el sistema con documentación oficial.

- [ ] **2.1 Panel de Ingesta (UI Admin)**
  - Sidebar de administración y vista de lista de documentos.
  - Formulario de subida con metadatos y control de versiones.
- [ ] **2.2 Pipeline de Procesamiento**
  - Extracción de texto de PDF (`pdf-parse`).
  - Estrategia de Chunking (500-800 chars, overlap 100).
  - Almacenamiento con contexto `texto_antes` / `texto_despues`.
- [ ] **2.3 Ciclo de Vida del Documento**
  - Lógica de estados: `borrador` -> `vigente` -> `obsoleto`.

---

### 🟠 FASE 3: ANÁLISIS DE PEDIDOS Y RAG (SEMANA 3)
**Objetivo:** Ejecutar la búsqueda semántica y presentar el valor al técnico.

- [ ] **3.1 Portal del Técnico (UI Taller)**
  - Diseño Dark Mode optimizado (#1f2937).
  - Zona de upload Drag-and-Drop premium.
- [ ] **3.2 Orquestación RAG (LangChain)**
  - Extracción de modelos con Gemini 2.0 Flash.
  - Búsqueda vectorial filtrada por `estado: vigente`.
- [ ] **3.3 Informe Dinámico con Checklists**
  - Renderizado de fragmentos con barras de relevancia.
  - Integración de checklists obligatorias.

---

### 🔴 FASE 4: FUNCIONES ENTERPRISE Y CIERRE (SEMANA 4)
**Objetivo:** Auditoría, exportación y despliegue.

- [ ] **4.1 Gestión de Usuarios y Permisos (Básica)**
  - Implementación de NextAuth.js v5 (Auth.js).
  - Roles básicos: `ADMIN`, `TECNICO`, `INGENIERIA`.
  - Arquitectura desacoplada para futura integración con SSO/Enterprise Identity (Azure AD, Okta, etc.).
- [ ] **4.2 Exportación y Reportes**
  - Generación de PDF profesional (`jsPDF` + `html2canvas`).
  - Reporte de incidencias desde el informe.
- [ ] **4.3 Observabilidad**
  - Implementación de logging estructurado y dashboard de auditoría.
- [ ] **4.4 Deployment y QA**
  - Tests E2E con Playwright.
  - Deployment final en Vercel.

---

### 📈 MÉTRICAS DE AVANCE
- **Fase 1:** 50%
- **Fase 2:** 0%
- **Fase 3:** 0%
- **Fase 4:** 0%
- **GLOBAL:** 12%
