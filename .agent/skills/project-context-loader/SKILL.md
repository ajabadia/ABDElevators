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
3. **Revisar Arquitectura:** Recordar los 3 pilares: Entity Engine, Workflow Engine, RAG System.
4. **Verificar Patrones:** Confirmar el uso de hooks (`useApiList`) y componentes base.
5. **Output de Confirmación:** Listar el "Estado de Conocimiento" al usuario.

## Instrucciones y Conocimiento Crítico (Extracto de GUIA_IA.MD)

### 1. Reglas de Negocio Críticas (VIOLAR = BUG CRÍTICO)
- **#1 Aislamiento de Tenant:** `getTenantCollection` es OBLIGATORIO. Nunca usar `db.collection` directo. Queries siempre filtradas por `tenantId`.
- **#2 Validación Zod:** Todo input (body, query, params) se valida con Zod *antes* de tocar lógica.
- **#3 Cifrado:** Campos `encrypted: true` en ontología usan `SecurityService`.
- **#4 Auditoría:** Toda escritura requiere `logEvento` con `correlationId`.

### 2. Stack Tecnológico & Arquitectura
- **Core:** Next.js 15 + MongoDB Atlas + TypeScript Strict.
- **Auth:** NextAuth (Roles jerárquicos: SUPER_ADMIN > ADMIN > ENGINEERING > COMPLIANCE > REVIEWER > TECHNICAL).
- **RAG:** Ingesta PDF -> Text Extraction -> Chunking -> Vector Search -> Gemini.
- **Workflow:** Máquina de estados (FSM) con transiciones visuales, lógica compilada y Generación de Tareas Automáticas (WorkflowTasks).

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

```markdown
**Contexto del Proyecto Cargado: ABD RAG Platform** 🧠

He sincronizado las reglas críticas y arquitectura:
1.  **Seguridad:** Aislamiento estricto por Tenant (`getTenantCollection`) y Auditoría obligatoria (`logEvento`).
2.  **Validación:** Zod-First en todos los endpoints.
3.  **Core Systems:** Entity Engine, RAG Service, y Workflow Engine (Visual + Logic).
4.  **Frontend:** Uso de hooks estandarizados (`useApiList`) y componentes base.

Estoy listo para desarrollar respetando los estándares Enterprise del proyecto. ¿Por dónde empezamos?
```
