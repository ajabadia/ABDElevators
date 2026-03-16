---
name: project-context-loader
description: Carga el contexto crítico, reglas de arquitectura y patrones de desarrollo del proyecto ABD RAG Platform.
---
# Project Context Loader (v3.1 - SGSI Aware)

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
3. **Revisar Arquitectura (Era 13):** Recordar la transición a **Cognitive Hierarchical RAG**. Los servicios residen en `src/services/[domain]/` con repositorios aislados.
4. **SGSI & Compliance (ISO 27001):** Cargar la existencia de la carpeta `/security` como fuente de verdad de políticas, riesgos y evidencias técnicas de seguridad.
5. **Validar Agosticidad:** Asegurar que no hay dependencias hardcoded de industria (`ELEVATORS`). El fallback siempre es `GENERIC`.
6. **Verificar Patrones:** Confirmar el uso de hooks (`useApiList`) y componentes base.
7. **Output de Confirmación:** Listar el "Estado de Conocimiento" al usuario.

## Instrucciones y Conocimiento Crítico (Extracto de GUIA_IA.MD)

### 1. Reglas de Negocio Críticas (VIOLAR = BUG CRÍTICO)
- **#1 Aislamiento de Tenant:** `getTenantCollection` es OBLIGATORIO. Nunca usar `db.collection` directo. Queries siempre filtradas por `tenantId`.
- **#2 Validación Zod:** Todo input (body, query, params) se valida con Zod *antes* de tocar lógica.
- **#3 Cifrado:** Campos `encrypted: true` en ontología usan `SecurityService`.
- **#4 Auditoría:** Toda escritura requiere `logEvento` con `correlationId`.
- **#5 Diseño Unificado (CORE/DRY):** Prohibido el diseño "espectacular" aislado. Toda UI debe usar `platform-card`, `platform-title` y componentes base (`PageHeader`).
- **#6 Registro SGSI:** Cualquier cambio en el modelo de seguridad o datos sensibles debe documentarse en `/security`.
- **#7 Zero Spanish:** Prohibido el uso de castellano en la capa de datos (Regla #19).
- **#8 Mandatory PNPM:** OBLIGATORIO usar `pnpm` en lugar de `npm` o `yarn` para evitar conflictos en workspaces y protocolos `workspace:`.

### 2. Stack Tecnológico & Arquitectura
- **Core:** Next.js 15/16 + MongoDB Atlas + TypeScript Strict.
- **Database:** Isolated 4-cluster architecture (ERA 8 Alignment):
    - **AUTH:** Identity, Tenants & Security.
    - **LOGS:** Telemetry, Audits & Notifications.
    - **CONFIG:** Intelligence, Prompts, Translations & AI.
    - **MAIN:** Core Business Data (Orders, Cases, assets).
- **Auth:** NextAuth v5 (Roles jerárquicos: SUPER_ADMIN > ADMIN > ENGINEERING > COMPLIANCE > REVIEWER > TECHNICAL).

### 3. Patrones de Frontend
- **Data Fetching:** NO usar `useEffect` directo. Usar `useApiList`, `useApiItem`.
- **UI:** Tailwind CSS, `PageContainer`, `ContentCard`, `DataTable`.

### 4. Checklist PRE-CÓDIGO (Mental)
Antes de generar código, verifica:
- [ ] ¿Esta operación respeta el tenantId de la sesión?
- [ ] ¿Hay un schema Zod definiendo la entrada?
- [ ] ¿Estoy logueando la operación con `logEvento`?
- [ ] ¿Los datos sensibles están enmascarados/encriptados?
- [ ] ¿He revisado si este cambio impacta el `risk-register.md` en `/security`?

## Output (Formato al ejecutar)
Al ejecutar este skill, responde al usuario con el siguiente resumen:

## Contexto del Proyecto Cargado: ABD RAG Platform (Era 13 - SECURITY HARDENING) 🛡️

He sincronizado las reglas críticas y la arquitectura de la **Era 13**:
1.  **SGSI & ISO 27001:** Políticas, riesgos y evidencias centralizadas en `/security`.
2.  **Integridad Relacional:** Uso de `EntityIdSchema` y `TenantScopedSchema` para eliminar islas de datos.
3.  **Seguridad Guardian V3.1:** `enforcePermission` con RBAC dinámico y caché en Redis.
4.  **Higiene de Tipos Strict:** Prohibido `: any` y `string` para IDs; uso de tipos branded.
5.  **Observability:** Trazabilidad transversal con `correlationId` y PII-masking en logs.
6.  **Zero Spanish (Era 15):** Estandarización de toda la capa de datos en inglés (Regla #19).
7.  **Reglas de Oro #1-18:** Respeto estricto a las normas de aislamiento, seguridad y auditoría.
8.  **Package Manager:** Uso mandatorio de `pnpm` para toda gestión de dependencias.

Estoy listo para desarrollar bajo el paradigma de **Seguridad y Cumplimiento** de la Era 13. ¿Por dónde empezamos?
