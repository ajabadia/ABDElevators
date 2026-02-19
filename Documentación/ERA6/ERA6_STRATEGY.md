# ERA 6: UX-FIRST CONSOLIDATION & USABILITY SURGERY
## Documento Estratégico de Referencia

**Fecha de creación:** 2026-02-19
**Autor:** Antigravity (agente IA) + User
**Backup ERA 5:** Confirmado por el usuario antes de iniciar.
**Regla de oro:** No se crea ninguna funcionalidad nueva. Solo se refactoriza, simplifica, consolida o elimina.

---

## 📖 Contexto y Motivación

### ¿Por qué ERA 6?

Tras completar ERA 5 (Suite Evolution), el proyecto tiene una base técnica sólida pero con deuda de usabilidad grave:

- **35 subdirectorios bajo `admin/`** → Parálisis de navegación
- **50+ archivos `.tsx` con colores hardcodeados** → Fractura visual entre módulos
- **5+ páginas con `coming_soon`** → Código muerto que genera falsas expectativas
- **`OnboardingProvider` vacío** (28 líneas, `value={}`) → Sin guía para nuevos usuarios
- **Flujo de análisis de documento:** ~8-12 clicks + 3 decisiones técnicas → TTFV inaceptable

### Filosofía

> "Un técnico debe poder subir un PDF y obtener una respuesta útil en 60 segundos, sin leer un manual."

---

## 🔍 Análisis Crítico de Propuestas Externas

Se recibieron dos propuestas externas. Se analizaron críticamente y se tomó lo mejor de cada una.

### Propuesta 1: "ABD RAG Platform 2.0 - UX-First" (14 semanas)

**Adoptado:**
- SmartNav plana con 4 acciones primarias
- SimpleAnalyzeFlow en 3 pasos (upload → pregunta → respuesta)
- WorkContextEngine con contextos semánticos (inspection, maintenance, audit, training)
- AnswerFeedbackWidget con thumbs up/down
- ProgressiveOnboarding medible (3 pasos obligatorios)

**Rechazado:**
- "Eliminar la jerarquía de hubs anidados" → Se ESCONDE por rol, no se elimina
- ActionDashboard con `useActionableInsights()` → Es una feature nueva disfrazada. Sin backend de alertas
- 14 semanas estimadas → Sobredimensionado para refactoring sobre base existente

### Propuesta 2: "5 líneas de mejora" (Sin timeline)

**Adoptado:**
- "Technical Assistant Home" ultra reducido (3 bloques grandes)
- Selector de rol/uso en onboarding (Técnico/Responsable/IT-Admin)
- Plantillas pre-hechas para Workflow Designer
- Sandbox con datos sintéticos de ascensores
- FilterBar en modo compacto por defecto
- Toasts en lenguaje de negocio

**Rechazado:**
- Falta especificidad en convivencia con las 35 rutas admin existentes
- No menciona deuda visual (los 50+ archivos con colores hardcodeados)
- No tiene métricas de éxito medibles

### Lo que NOSOTROS añadimos:

1. **FASE 190 (Visual Consistency) va PRIMERA** → Base sobre la que todo tiene sentido
2. **FASE 196 (Placeholder Cleanup) es OBLIGATORIA** → Antes de construir, limpia
3. **Métricas verificables en cada FASE** → 0 hardcoded colors, ≤3 clicks, TTFV < 3 min
4. **No crear features nuevas disfrazadas de UX** → El ActionDashboard se convierte en "reorientar dashboards existentes"

---

## 📋 Plan de Fases (Resumen)

| FASE | Nombre | Prioridad | Semanas | Doc de Referencia |
|------|--------|-----------|---------|-------------------|
| 190 | Visual Consistency & Design Tokens | CRÍTICA | 2 | `ERA6_FASE190_VISUAL.md` |
| 191 | Navigation Simplification | CRÍTICA | 2 | `ERA6_FASE191_NAVIGATION.md` |
| 192 | Core Flow Optimization | ALTA | 3 | `ERA6_FASE192_CORE_FLOWS.md` |
| 193 | Admin Panel Consolidation | MEDIA | 2 | `ERA6_FASE193_ADMIN.md` |
| 194 | Onboarding & Contextual Help | ALTA | 2 | `ERA6_FASE194_ONBOARDING.md` |
| 195 | Feedback Loop & Value Dashboard | MEDIA | 2 | (inline en ROADMAP) |
| 196 | Placeholder Cleanup & Tech Debt | ALTA | 2 | (inline en ROADMAP) |

**Total estimado:** ~15 semanas (puede comprimirse a 10-12 si no hay sorpresas)

---

## ⚠️ Riesgos Identificados

1. **Regresiones en navegación:** Al cambiar la sidebar, rutas existentes pueden romperse. Mitigación: Route aliases mantienen las URLs viejas.
2. **i18n cascading:** Al mover o reorganizar páginas, las claves de traducción pueden quedar huérfanas. Mitigación: Auditar `messages/` con grep tras cada FASE.
3. **Conflictos con Guardian:** El filtrado por rol puede chocar con la Matriz de Permisos existente. Mitigación: Usar `activeModules` de `useNavigation`, no duplicar lógica.
4. **Scope creep:** Tendencia a "mejorar" features existentes en vez de simplificarlos. Mitigación: La REGLA DE ERA 6 (no crear features nuevos) es ley.

---

## 📊 Métricas de Éxito Globales

| Métrica | Objetivo | Cómo medir |
|---------|----------|------------|
| Time-to-first-value (TTFV) | < 3 min | Telemetría: upload → first useful answer |
| Clicks para función principal | ≤ 3 | Audit de flujo manual |
| Colores hardcodeados | 0 | `grep` regex en codebase |
| Páginas placeholder visibles | 0 | Audit de rutas |
| Tasa onboarding completado | > 80% | Evento de tracking |
| Satisfacción respuestas RAG | > 75% thumbs up | Colección `rag_feedback` |
| Admin subdirectorios visibles (rol User) | ≤ 4 | Config de navegación |

---

## 🧠 Principios de Diseño

1. **Progressive Disclosure**: Lo simple primero, lo complejo bajo "Avanzado"
2. **Smart Defaults**: Auto-configurar según tipo de documento y contexto de trabajo
3. **Feedback Inmediato**: Preview de PDF, highlight de fuentes, confianza humanizada
4. **Contextual Help**: Ayuda en el momento exacto de la duda, no manuales
5. **Reduce Cognitive Load**: Máximo 3 opciones visibles, el resto en "Más opciones"
6. **Value-Oriented Metrics**: "Ahorraste 12 horas" > "Procesaste 24 documentos"
7. **Zero Dead Ends**: Ninguna página sin funcionalidad real visible al usuario
