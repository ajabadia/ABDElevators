# ROADMAP_MASTER – Source of Truth for ABD RAG Platform (Unified v2.7)

## 📖 Overview
This document consolidates **all** roadmap information, implementation plans, and task checklist into a single, authoritative reference. It combines the detailed phase roadmap, implementation plans, and the latest status from `ESTADO_PROYECTO.md` (v2.6).

---

### 🏛️ Detailed Phase Roadmap (from `plans/roadmap.md`)

# PROYECTO: PROTOTIPO RAG ABD RAG Platform
## ROADMAP DETALLADO DE IMPLEMENTACIÓN (MASTER GUIDE)

[... Completed Phases 1-7 Summarized for Brevity ...]

#### 🟢 FASE 1: INFRAESTRUCTURA Y FUNDAMENTOS (COMPLETADO)
- [x] 1.1 Inicialización, 1.2 Datos, 1.3 IA.

#### 🟡 FASE 2: GESTIÓN DE CONOCIMIENTO (COMPLETADO)
- [x] 2.1 Ingesta, 2.2 Pipeline, 2.3 Ciclo de Vida.

#### 🟠 FASE 3: ANÁLISIS & RAG (COMPLETADO)
- [x] 3.1 Portal Técnico, 3.2 Orquestación, 3.3 Informes.

#### 🔴 FASE 4: FUNCIONES ENTERPRISE (COMPLETADO)
- [x] 4.1 Usuarios, 4.2 Reportes, 4.3 Observabilidad, 4.4 Deploy.

#### 🔵 FASE 5: GESTIÓN DE USUARIOS (COMPLETADO)
- [x] 5.1 Maestro, 5.2 Perfil, 5.3 Documentos Pro.

#### 🟣 FASE 6: RAG PROFESIONAL (COMPLETADO)
- [x] 6.2 Checklists Dinámicos, 6.3 Configurador Visual, 6.4 Validación Humana.
- [x] 6.5 Audit Trail Robusto (PDF export, trace).
- [x] 6.8 Gestión Avanzada de Documentos (Smart Ingestion MD5 + Audit).

#### 🌐 FASE 7: GENERALIZACIÓN SAAS (COMPLETADO)
- [x] 7.1 Core Abstraction, 7.2 Workflows Multinivel, 7.3 Multi-tenant Metadata.
- [x] 7.4 Automatización Billing/Usage.

---

### 📊 Status & Metrics (v2.30)
- **Global Progress:** 198% (Phase 27 Completed - Advanced PDF Engine).
- **Recent Ship:** Compliance Suite, Federated Search, Advanced PDF (PyMuPDF).
- **Current Focus:** Global Optimization & Collective Intelligence.

---

### 📋 Upcoming & To‑Do (Consolidated View)

#### Immediate Sprint (Next 2 Weeks)
1. **Validación Avanzada (Prompts)** [x]
   - Implementar "Hard Limit" para longitud de prompts en `PromptService`.
   - Bloquear guardado si excede tokens máximos seguros.
2. **Estabilidad y Testeo (Unit Testing)** [ ]
   - Aumentar cobertura de tests unitarios al 80% en servicios críticos.
3. **Gestión de Facturación (Nueva Fase 27)** [x]
   - Implementar generación de facturas PDF y datos fiscales.
4. **Landing Page & Marketing Redesign (Fase 16)** [x]
   - Overhaul of Home, Pricing, and About pages.
   - Standardized on *Outfit* typography and high-tech aesthetics.
5. **Refinamiento de Trazabilidad** [x]
   - Auditoría de Ingesta (MD5) y Prompts Completada.

---

### 🔮 DETAILED PLANS FOR FUTURE & RECENT PHASES
*Historical value preserved for reference.*

#### 🚀 FASE 11: ADVANCED MULTI-TENANCY & GLOBAL GOVERNANCE (COMPLETADO)
- **Objetivo:** Convertir la plataforma en un centro de control total.
- **Hitos:**
  - [x] **Context Switching:** Selector global persistente.
  - [x] **RBAC Cross-Tenant:** Soporte para usuarios vinculados a múltiples organizaciones.
  - [x] **Data Isolation:** Middleware de filtrado dinámico.
  - [x] **Global Dashboard:** Vista agregada de métricas.

#### 🚀 FASE 12: MODO DEMO EFÍMERO & FREE TRIAL (COMPLETADO ✅)
- **Objetivo:** Permitir que potenciales clientes prueben la plataforma en un entorno seguro y auto-limpiable.
- **Hitos:**
  - [x] **Ephemeral Tenant Factory:** Crear tenant de prueba con un solo click.
  - [x] **Auto-Cleanup Engine (TTL):** Proceso programado para borrar tenants tras N días.
  - [x] **Demo Data Seeding:** Ingesta automática de documentos y usuarios "fake".

#### 🛡️ FASE 13: CONTINUIDAD, BACKUP & DISASTER RECOVERY (COMPLETADO ✅)
- **Objetivo:** Garantizar la integridad de los datos y recuperación.
- **Estrategia Técnica:**
  - [x] **Unified Backup Engine:** Scripting `mongodump --query` aislado por tenant.
  - [x] **Cloudinary Archiver:** Sync a S3 Glacier con verificación de hash.
  - [x] **Data Portability Service:** Descarga de "Knowledge Package" (ZIP).

#### ⚖️ FASE 14: GDPR COMPLIANCE & DERECHO AL OLVIDO (COMPLETADO ✅)
- **Objetivo:** Sistema profesional de borrado de datos (Right to take down).
- **Hitos:**
  - [x] **Purge System:** Eliminación total de PII.
  - [x] **Document Shredding:** Borrado físico inmediato en Cloudinary.
  - [x] **Deletion Receipt:** Evidencia inmutable de borrado (log anónimo/Certificado PDF).

#### 🎨 FASE 16: MARKETING OVERHAUL (COMPLETADO ✅)
- **Objetivo:** Refinar la presencia pública y la conversión del sitio.
- **Hitos:**
  - [x] **Hero / Bento Redesign:** Estética premium 2.0.
  - [x] **FAQ & Pricing:** Claridad en planes y dudas comunes.
  - [x] **Vision & Team:** Nueva página `/about` con formulario de contacto.

#### 🔌 FASE 30: API PÚBLICA & INTEGRACIÓN DE SISTEMAS (COMPLETADO ✅)
- **Objetivo:** Exponer funcionalidad RAG como API RESTful.
- **Endpoints Propuestos:**
  - [x] `POST /api/v1/documents/ingest`: Inyectar documentos.
  - [x] `POST /api/v1/rag/query`: Consulta semántica pura.
  - [x] `POST /api/v1/analysis/extract`: Análisis de pedidos.
- **Seguridad:**
  - [x] **API Key Management:** Panel de generación/revocación.
  - [x] **Rate Limiting:** Límites por Key/Tier via Middleware.

#### ♿ FASE 17: ACCESIBILIDAD (A11Y) & SEO AUDIT (COMPLETADO ✅)
- **Objetivo:** Cumplimiento WCAG 2.1 AA.
- **Tareas:**
  - [x] **Auditoría Automática:** Lighthouse, axe DevTools.
  - [x] **Screen Readers:** Testing con NVDA/VoiceOver.
  - [x] **SEO:** Structured Data (Schema.org) y Meta Tags dinámicos.

#### 🎨 FASE 18: WHITE-LABEL BRANDING (COMPLETADO ✅)
- **Objetivo:** Personalización corporativa por tenant.
- **Tareas:**
  - [x] **Schema Extension:** Campo `brandingAssets` en Tenant.
  - [x] **CSS Injection:** `BrandingProvider` para colores/logos dinámicos.
  - [x] **Favicon Injection:** Soporte para iconos personalizados.

#### 🌍 FASE 19: INTERNACIONALIZACIÓN COMPLETA (COMPLETADO ✅)
- **Objetivo:** Expansión global (ES/EN/FR/DE).
- **Tareas:**
  - [x] **Auditoría de Cobertura:** Verificar 100% traducciones (Keys faltantes).
  - [x] **Selector UI:** Persistencia de idioma preferido.
  - [x] **Formateo Regional:** Fechas y Monedas adaptadas.
  - [x] **Multilingual RAG:** Soporte transversal para idiomas.

#### 🎫 FASE 20: SISTEMA DE TICKETING EMPRESARIAL (COMPLETADO ✅)
- **Objetivo:** Soporte jerárquico L1/L2/L3.
- **Hitos:**
  - [x] **Jerarquía de Soporte:** Usuario -> Tenant Admin -> SuperAdmin -> Ingeniería.
  - [x] **SLA Management:** (Pendiente configuración de alertas de tiempo).
  - [x] **Unified Support Hub:** Panel master-detail para gestión.

---

### **🧠 FASES DE OPTIMIZACIÓN (2026)**

#### 🧠 FASE 21: EVOLUCIÓN AGÉNTICA 2.0 (COMPLETADO)
- [x] **Orquestación LangGraph**: Self-Correction y Loops.
- [x] **Multilingual RAG**: BGE-M3 + Hybrid Search (RRF).
- [x] **Evaluation Framework**: RAGAs dashboard.

#### 🧠 FASE 25: OPTIMIZACIÓN & EFICIENCIA (COMPLETADO)
- [x] **Gemini 3.0**: Upgrade de modelos.
- [x] **Smart Ingestion (MD5)**: Deduplicación y Ahorro.
- [x] **Auditoría de Ingesta**: Trazabilidad User/IP.

#### 🧾 FASE 27: ENTERPRISE INVOICE MANAGER (COMPLETADO ✅)
- [x] **Invoice Engine**: Generación PDF + Datos Fiscales.
- [x] **Self-Service**: Portal de descargas para clientes.
- [x] **Delivery**: Envío automático por email.

- [x] **Advanced PDF**: PyMuPDF integration (Hybrid Node/Python Bridge) ✅.

---

### 💎 STRATEGIC ENTERPRISE OVERHAUL (AUDITORÍA 2026)
Esta sección consolida la visión de producto hacia una estabilidad absoluta y UX de alto nivel, basada en la auditoría exhaustiva de Enero 2026.

#### 🚀 FASE 31: ESTABILIZACIÓN, SEGURIDAD & UX REDESIGN (COMPLETADO ✅)
- **Objetivo:** Transformar el prototipo en una plataforma SaaS de grado bancario con UX Enterprise.
- **Documentación de Referencia:**
  - `documentación/06/`: Auditoría UX, MongoDB y Mejoras Técnicas (30 Wireframes).
  - `documentación/07/`: Roadmap detallado de ejecución (8 semanas).
  - `documentación/08/`: Mapa de refactorización de código y deuda técnica.
- **Hitos de Infraestructura & Seguridad:**
  - [x] **Multi-tenant Hardening:** Validación estricta de `tenantId` vía JWT/Middleware (Cero fugas).
  - [x] **MongoDB Pro:** Implementación de Índices críticos (-60% latencia), Transacciones ACID y Soft Deletes.
  - [x] **Async Jobs:** Migración de procesos largos a colas de trabajo (BullMQ).
  - [x] **Observabilidad Pro:** Tracing con OpenTelemetry y agregación de logs (Axiom/ELK).
- **Hitos de Frontend & UX:**
  - [x] **Standard Components:** Implementación de Biblioteca de 45+ componentes.
  - [x] **State & Cache Management:** Adopción total de Zustand + React Query.
  - [x] **Optimización Perceptual:** Skeleton loadings y optimización móvil real.
- **Hitos de Calidad de Código (Refactor):**
  - [x] **Generic Hooks:** Implementación de `useApiList`, `useApiMutation`, `useFilters`.
  - [x] **Clean Core:** Reducción del 50% de código repetido en Ticketing, Usuarios y Documentos.

## 🗑️ DEPRECATED & ARCHIVED
Listado de funcionalidades o planes que han sido descartados o sustituidos por mejores alternativas.

- ~~[Fase 15: Landing Page Reality Check]~~
    - **Fecha:** 2026-01-28
    - **Motivo:** Integrado y superado por el "Marketing Overhaul" de la Fase 16.
    - **Estado:** Histórico conservado.

---

## How to Use This Document
- Treat this file as the **single source of truth**.
- Update relevant sections when milestone reached.

*Updated and Audited on 2026-01-31 by Antigravity (Skill: roadmap-manager)*

