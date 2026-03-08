---
name: project-context-loader
description: Carga el contexto crítico, reglas de arquitectura y patrones de desarrollo del proyecto ABD RAG Platform.
---
# Project Context Loader

## Cuándo usar este skill
- **Al iniciar una nueva sesión** de desarrollo con el usuario.
- Cuando el usuario te pida "ponerte en contexto" o "¿qué proyecto es este?".
- Antes de proponer cambios arquitectónicos mayores para asegurar consistencia con las reglas del proyecto.
- Si detectas que estás generando código que podría violar los principios de multi-tenancy o seguridad.

## Inputs necesarios
- No requiere inputs explícitos más allá de estar en el directorio del proyecto `ABDElevators`.

## Workflow
1. **Analizar la Misión:** Entender que este es un sistema Enterprise de misión crítica (RAG Platform para industrias reguladas), no un CRUD simple.
2. **Cargar Reglas de Oro:** Internalizar las 4 reglas inquebrantables (Tenant Isolation, Zod First, Encryption, Audit).
3. **Revisar Arquitectura (Era 11):** Recordar la transición a **Cognitive Hierarchical RAG**. Los documentos ahora tienen perfiles y secciones automatizadas para mejorar la precisión y reducir costes. Los servicios residen en `src/services/[domain]/` con repositorios aislados.
4. **Validar Agosticidad:** Asegurar que no hay dependencias hardcoded de industria (`ELEVATORS`). El fallback siempre es `GENERIC`.
5. **Verificar Patrones:** Confirmar el uso de hooks (`useApiList`) y componentes base.
6. **Output de Confirmación:** Listar el "Estado de Conocimiento" al usuario.

## Instrucciones y Conocimiento Crítico (Extracto de GUIA_IA.MD)

### 1. Reglas de Negocio Críticas (VIOLAR = BUG CRÍTICO)
- **#1 Aislamiento de Tenant:** `getTenantCollection` es OBLIGATORIO. Nunca usar `db.collection` directo. Queries siempre filtradas por `tenantId`.
- **#2 Validación Zod:** Todo input (body, query, params) se valida con Zod *antes* de tocar lógica.
- **#3 Cifrado:** Campos `encrypted: true` en ontología usan `SecurityService`.
- **#4 Auditoría:** Toda escritura requiere `logEvento` con `correlationId`.

### 2. Stack Tecnológico & Arquitectura
- **Core:** Next.js 15 + MongoDB Atlas + TypeScript Strict.
- **Auth:** NextAuth (Roles jerárquicos: SUPER_ADMIN > ADMIN > ENGINEERING > COMPLIANCE > REVIEWER > TECHNICAL).
- **RAG:** Ingesta PDF -> Text Extraction -> Chunking -> Vector Search -> Gemini (Centralizado en `@abd/rag-engine`).
- **Workflow:** Máquina de estados (FSM) agnóstica (`@abd/workflow-engine`) con transiciones visuales, lógica compilada y Generación de Tareas Automáticas.

### 3. Patrones de Frontend
- **Data Fetching:** NO usar `useEffect` directo. Usar `useApiList`, `useApiItem`.
- **UI:** Tailwind CSS, `PageContainer`, `ContentCard`, `DataTable`.

### 4. Checklist PRE-CÓDIGO (Mental)
Antes de generar código, verifica:
- [ ] ¿Esta operación respeta el tenantId de la sesión?
- [ ] ¿Hay un schema Zod definiendo la entrada?
- [ ] ¿Estoy logueando la operación con `logEvento`?
- [ ] ¿Si es una entidad nueva, está definida en el `EntityEngine`?

## Output (Formato al ejecutar)
Al ejecutar este skill, responde al usuario con el siguiente resumen:

## Contexto del Proyecto Cargado: ABD RAG Platform (Era 11 - HIERARCHICAL COGNITION) 🧠

He sincronizado las reglas críticas y la arquitectura de la **Era 11**:
1.  **Mapa de Rutas Canónico:** 91 rutas trazadas en `map.md`. Prohibido crear rutas fantasma (Fase 305 In Progress).
2.  **Jerarquía de Conocimiento:** Uso obligatorio de `doc_profiles` y `doc_sections` para RAG avanzado.
3.  **Seguridad Guardian:** `enforcePermission` obligatorio en módulos críticos (Billing, Audit, Security).
4.  **Higiene de Tipos:** Prohibido `: any` en core logic y servicios exportados.
5.  **UI DRY & Sonic:** `sonner` es la única librería de toast. Uso obligatorio de `HubPage` y `MetricCard`.
6.  **Reglas de Oro #1-13:** Respeto estricto a Tenant Isolation, Zod First, Encryption y Audit.
7.  **Agosticidad de Dominio:** Los servicios son abstractos; `ELEVATORS` es solo un caso de uso; el fallback es `GENERIC`.

Estoy listo para desarrollar bajo el paradigma de **Cognición Jerárquica** de la Era 11. ¿Por dónde empezamos?
