# PROYECTO: PROTOTIPO RAG ABDElevators
## ROADMAP DETALLADO DE IMPLEMENTACIÓN (MASTER GUIDE)

Este documento es la **fuente de verdad** para el desarrollo. Se basa en la Especificación Técnica v2.0 y el Plan Strategico de IA.

---

### 🏛️ PILARES DEL PRODUCTO PROFESIONAL
Para no desviarnos del plan "Enterprise-Ready", cada tarea debe cumplir con:
1.  **Reglas de Oro (No Negociables)**: Ver `Documentación/02/instrucciones-cursor-antigrávity`.
    -   **TypeScript Strict**: Sin `any`, tipos explícitos.
    -   **Zod First**: Validación preemptiva de todos los inputs.
    -   **AppError**: Uso de excepciones personalizadas, no `Error` genérico.
    -   **Logging Estructurado**: `logEvento` con `correlacion_id`.
    -   **Performance**: Medir y loguear si excede SLA.
2.  **Trazabilidad Total**: Cada prompt enviado a Gemini y su respuesta deben quedar registrados en `auditoria_rag`.
3.  **Observabilidad**: Uso de `correlacion_id` en logs para seguir el flujo desde el upload hasta el informe.
4.  **Estándares UI/UX taller**: Contraste WCAG AAA, fuentes grandes (16px+), y señales visuales de estado (Vigente/Obsoleto).
5.  **Integridad de Datos**: Nunca se borra información; los documentos se marcan como `obsoletos` o `archivados`.

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
  - [x] Creación de índice de búsqueda vectorial en `document_chunks`.
- [/] **1.3 Integración de IA (Gemini)**
  - [x] Configuración del SDK en `lib/llm.ts`.
  - [x] Definición de utilidades para embeddings (`text-embedding-004`).
  - [x] Definición de prompts versionados en `lib/prompts.ts`.

---

### 🟡 FASE 2: GESTIÓN DE LA BASE DE CONOCIMIENTO - ADMIN (SEMANA 2)
**Objetivo:** Permitir que ingeniería alimente el sistema con documentación oficial.

- [x] **2.1 Panel de Ingesta (UI Admin)**
  - [x] Sidebar de administración y vista de lista de documentos.
  - [x] Formulario de subida con metadatos y control de versiones.
- [x] **2.2 Pipeline de Procesamiento**
  - [x] Extracción de texto de PDF (`pdf-parse`).
  - [x] Estrategia de Chunking (500-800 chars, overlap 100).
  - [x] Almacenamiento con contexto `texto_antes` / `texto_despues`.
- [x] **2.3 Ciclo de Vida del Documento**
  - [x] Lógica de estados: `borrador` -> `vigente` -> `obsoleto`.

---

### 🟠 FASE 3: ANÁLISIS DE PEDIDOS Y RAG (SEMANA 3)
**Objetivo:** Ejecutar la búsqueda semántica y presentar el valor al técnico.

- [x] **3.1 Portal del Técnico (UI Taller)**
  - [x] Diseño Dark Mode optimizado (#1f2937).
  - [x] Zona de upload Drag-and-Drop premium.
- [x] **3.2 Orquestación RAG (LangChain)**
  - [x] Extracción de modelos con Gemini 2.0 Flash.
  - [x] Búsqueda vectorial filtrada por `estado: vigente`.
- [x] **3.3 Informe Dinámico con Checklists**
  - [x] Renderizado de fragmentos con barras de relevancia.
  - [x] Integración de checklists obligatorias.

---

### 🔴 FASE 4: FUNCIONES ENTERPRISE Y CIERRE (SEMANA 4)
**Objetivo:** Auditoría, exportación y despliegue.

- [x] **4.1 Gestión de Usuarios y Permisos (Básica)**
  - [x] Implementación de NextAuth.js v5 (Auth.js).
  - [x] Roles básicos: `ADMIN`, `TECNICO`, `INGENIERIA`.
  - [x] Arquitectura desacoplada para futura integración con SSO/Enterprise Identity (Azure AD, Okta, etc.).
- [x] **4.2 Exportación y Reportes**
  - [x] Generación de PDF profesional (`jsPDF` + `html2canvas`).
  - [x] Reporte de incidencias desde el informe.
- [x] **4.3 Observabilidad**
  - [x] Implementación de logging estructurado y dashboard de auditoría.
- [x] **4.4 Deployment y QA**
  - [x] Tests E2E con Playwright.
  - [x] Deployment final en Vercel.

---

### 📈 MÉTRICAS DE AVANCE
- **Fase 1:** 100%
- **Fase 2:** 100%
- **Fase 3:** 100%
- **Fase 4:** 100%
- **GLOBAL:** 100%
