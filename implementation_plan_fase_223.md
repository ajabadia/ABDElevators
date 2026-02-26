# Implementation Plan - Fase 223: i18n Hardcode Purge

## Contexto de Fase
- **Fase:** 223 - Purgado de código "hardcodeado" para Internacionalización.
- **Scope Limitado (Era 8):** Purga prioritaria de navegación principal, páginas de Compliance, Audit, Governance y Settings.
- **Reglas Principales:** 
  - Todo input/output del sistema se debe traducir mediante el hook `useTranslations`.
  - Terminología Profesional de ascensores e I.A. (Nada de "RAG", "Agentic", sino "Buscador Inteligente", "Inteligencia Técnica" etc).
  - Diccionarios deben ser modulares (`messages/[locale]/[namespace].json`), evitando el monolítico legacy.

## Fases de Ejecución

### 1. Auditoría de Módulos (i18n-a11y-auditor)
1. Escanear sistemáticamente en búsqueda de strings hardcoded dentro de `/app/admin/ai/governance`, `/app/admin/audit`, `/app/admin/settings/i18n` y `/app/admin/compliance`.
2. Extracción de textos literales estáticos de los layout genéricos y navegación principal (sidebar y breadcrumbs).
3. Documentar en un archivo temporal o en `docs/i18n-debt.md` toda la "deuda profunda" (strings secundarios) que se desplazarán para la Era 9.

### 2. Extracción a Diccionarios Modulares
1. Actualizar (o crear) los namespaces en idioma Inglés (`messages/en/`) y Español (`messages/es/`).
2. Mapear las cadenas de texto halladas en las páginas hacia sus nuevas claves modulares. (ej: `admin.governance.title`).
3. Refactorizar los componentes para usar `const t = useTranslations('Namespace')`.
4. Prevenir colisión de llaves durante el reemplazo masivo, respetando reglas de anidación JSON.

### 3. Sincronización de Archivos
1. Asegurar paridad estricta entre todas las variables en `messages/es/` y `messages/en/`.
2. Verificar que el build o los tests no se rompan a causa de hooks de traducción colocados en Client o Server components de forma incorrecta.

### 4. Review Final y Cierre
1. Compilar el proyecto (`npm run build`) para verificar consistencia tipográfica y tipado de `next-intl`.
2. Sincronizar Roadmap marcando la FASE 223 como finalizada.
