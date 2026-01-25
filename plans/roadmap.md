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
- [x] **1.1 Inicialización de Proyecto**
- [x] **1.2 Capa de Datos (MongoDB Atlas)**
- [x] **1.3 Integración de IA (Gemini)**

---

### 🟡 FASE 2: GESTIÓN DE LA BASE DE CONOCIMIENTO - ADMIN (SEMANA 2)
- [x] **2.1 Panel de Ingesta (UI Admin)**
- [x] **2.2 Pipeline de Procesamiento**
- [x] **2.3 Ciclo de Vida del Documento**

---

### 🟠 FASE 3: ANÁLISIS DE PEDIDOS Y RAG (SEMANA 3)
- [x] **3.1 Portal del Técnico (UI Taller)**
- [x] **3.2 Orquestación RAG (LangChain)**
- [x] **3.3 Informe Dinámico con Checklists**

---

### 🔴 FASE 4: FUNCIONES ENTERPRISE Y CIERRE (SEMANA 4)
- [x] **4.1 Gestión de Usuarios y Permisos (Básica)**
- [x] **4.2 Exportación y Reportes**
- [x] **4.3 Observabilidad**
- [x] **4.4 Deployment y QA**
- [x] **4.5 Optimización Mobile y Sidebar Pro**

---

### 🔵 FASE 5: SISTEMA DE GESTIÓN DE USUARIOS (EN PROCESO)
- [x] **5.1 Configuración Maestro de Usuarios**
- [x] **5.2 Perfil de Usuario Pro**
- [x] **5.3 Gestión de Tipos y Documentos Pro**
  - [x] Repositorio personal de documentos de usuario (`/mis-documentos`).
  - [x] Unificación de Layout y UX (Sidebar/Header global).

---

### 🟣 FASE 6: RAG PROFESIONAL + CHECKLISTS DINÁMICOS (COMPLETADO)
- [x] **6.1 Vector Search Sin LLM**
- [x] **6.2 Checklists Dinámicos Configurables**
- [x] **6.3 Configuración Visual**
- [x] **6.4 Validación Humana Estructurada**

### 🧠 FASE 21: AGENTIC RAG EVOLUTION (COMPLETADO)
- [x] **21.1 Motor Agéntico con Autocorrección**: LangGraph Loop, BGE-M3 Multilingual, Confidence critiques.
- [x] **21.2 UI Agéntica en Vivo**: Trazabilidad paso a paso, medidor de confianza, revisión side-by-side.

### 📧 FASE 23: NOTIFICATION HUB & BI (COMPLETADO)
- [x] **23.1 Hub Unificado**: Servicio central de notificaciones (Email/In-App/Log).
- [x] **23.2 Business Intelligence**: Estadísticas agregadas, detección de riesgos y oportunidades de upsell.
- [x] **23.3 UI de Gestión**: Dashboard Admin, Editor de Plantillas Multi-idioma, Auditoría de cambios.

### 📈 MÉTRICAS DE AVANCE
- **Fase 1-6:** 100%
- **Fase 21 (Agentic):** 100%
- **Fase 23 (Notifications):** 100%
- **GLOBAL:** 98% (Preparando cierre de proyecto y hardening final)
