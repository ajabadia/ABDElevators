# FASE 194: Onboarding Real & Contextual Help
## Guía de Ejecución Detallada

**Prioridad:** ALTA | **Estimación:** 2 semanas | **Depende de:** FASE 191 + 192

---

## 🎯 Objetivo

Reemplazar el `OnboardingProvider` vacío con un flujo progresivo y medible.
Activar la ayuda contextual existente con contenido real.

---

## 📋 Estado Actual (Verificado 2026-02-19)

### `OnboardingProvider` (src/components/onboarding-provider.tsx)
```typescript
// 28 líneas. Literalmente:
export function OnboardingProvider({ children }: { children: ReactNode }) {
    return (
        <OnboardingContext.Provider value={{}}>  // ← value VACÍO
            {children}
            <OnboardingOverlay />
        </OnboardingContext.Provider>
    );
}
```

### `OnboardingOverlay` (src/components/ui/onboarding-overlay.tsx)
- Existe y tiene tours parciales con pasos
- Tiene `useOnboarding` hook con lógica de "steps"
- Textos parcialmente traducidos
- **Desconectado del flujo core** → No guía hacia acciones clave

### Componentes de ayuda existentes:
- `HelpButton` (src/components/ui/help-button.tsx) ← **Existe pero sin contenido real**
- `HelpTooltipComponent` (src/components/ui/help-tooltip.tsx) ← **Existe**
- `InlineHelpPanel` (src/components/ui/inline-help-panel.tsx) ← **Existe**

---

## 🏗️ Flujo de Onboarding Propuesto

### Paso 1: "Bienvenido" + Selector de Contexto

```
┌─────────────────────────────────────────────────┐
│  🎉 Bienvenido a ABD RAG Platform               │
│                                                   │
│  La IA que entiende tu documentación técnica.     │
│                                                   │
│  ¿Cuál es tu rol principal?                       │
│                                                   │
│  ┌─────────────┐  ┌─────────────┐                │
│  │ 🔧 Técnico   │  │ 📋 Calidad  │                │
│  │ Mantenimiento│  │ Inspección  │                │
│  └─────────────┘  └─────────────┘                │
│  ┌─────────────┐  ┌─────────────┐                │
│  │ 🏗️ Ingeniería│  │ ⚙️ IT/Admin │                │
│  │ Diseño      │  │ Configurar  │                │
│  └─────────────┘  └─────────────┘                │
│                                                   │
│         [Comenzar →]                              │
└─────────────────────────────────────────────────┘
```

**Acción backend:** Guardar `userContext` en perfil → influye en:
- Navegación visible (FASE 191)
- Preguntas sugeridas en search/analyze
- Dashboards/métricas relevantes

### Paso 2: "Sube tu primer documento"

```
┌─────────────────────────────────────────────────┐
│  📄 Sube tu primer documento                     │
│                                                   │
│  Arrastra un PDF, Word o texto técnico.           │
│  La IA lo analizará y podrás hacerle preguntas.   │
│                                                   │
│  ┌─────────────────────────────────────┐         │
│  │                                     │         │
│  │     📁 Arrastra aquí o haz click    │         │
│  │                                     │         │
│  └─────────────────────────────────────┘         │
│                                                   │
│  ¿No tienes un documento a mano?                  │
│  [Usar documento de ejemplo →]                    │
│                                                   │
│         Paso 2 de 3  ────────○                    │
└─────────────────────────────────────────────────┘
```

**Documento demo:** PDF de normativa EN 81-20 (extracto) o manual genérico de ascensor, pre-cargado en el tenant demo.

### Paso 3: "Haz tu primera pregunta"

```
┌─────────────────────────────────────────────────┐
│  🔍 Haz tu primera pregunta                      │
│                                                   │
│  (Basado en el documento que subiste)             │
│                                                   │
│  ┌─────────────────────────────────────┐         │
│  │ Escribe una pregunta...             │         │
│  └─────────────────────────────────────┘         │
│                                                   │
│  O prueba con una de estas:                       │
│  ┌────────────────────────────────────┐          │
│  │ "¿Cuáles son los requisitos de     │          │
│  │  seguridad principales?"           │          │
│  └────────────────────────────────────┘          │
│  ┌────────────────────────────────────┐          │
│  │ "Resume los puntos clave para      │          │
│  │  una inspección"                   │          │
│  └────────────────────────────────────┘          │
│                                                   │
│         Paso 3 de 3  ──────────────○              │
└─────────────────────────────────────────────────┘
```

### Paso 4 (opcional): "Explora más"

Muestra las 4 acciones principales (según contexto elegido en Paso 1) con enlace directo.
Botón "Ir al panel" cierra el onboarding.

---

## 🔧 Implementación

### 1. Llenar el `OnboardingProvider`

```typescript
// Estado del onboarding (persistido en DB o cookie)
interface OnboardingState {
  completed: boolean;
  currentStep: number;
  userContext: 'tecnico' | 'calidad' | 'ingenieria' | 'admin';
  firstDocUploaded: boolean;
  firstQuestionAsked: boolean;
}
```

### 2. Work Context Engine (integrado)

El selector de contexto del Paso 1 alimenta un `WorkContext` que influye en:
- `useSmartConfig` → defaults de configuración RAG
- `useNavigation` → items visibles
- Sugerencias de preguntas en Search
- Checklists asociadas al contexto

```typescript
type WorkContext = 'inspection' | 'maintenance' | 'engineering' | 'admin';

const CONTEXT_DEFAULTS: Record<WorkContext, ContextConfig> = {
  inspection: {
    defaultQuestions: [
      "¿Cuáles son los requisitos de seguridad principales?",
      "¿Qué puntos debe verificar una inspección anual?"
    ],
    relevantNorms: ['EN 81-20', 'EN 81-50'],
    suggestedChecklists: ['inspeccion_anual', 'inspeccion_periodica']
  },
  // ... etc
};
```

### 3. Activar Contextual Help existente

Los componentes `HelpButton`, `HelpTooltipComponent`, `InlineHelpPanel` ya existen.
Solo falta llenarlos de contenido:

| Componente | Ubicación | Contenido a añadir |
|------------|-----------|-------------------|
| HelpButton en Search | `GlobalSemanticSearch` | "Escribe preguntas en lenguaje natural. Ej: ¿Qué dice la norma sobre..." |
| HelpTooltip en Upload | DropZone | "Formatos aceptados: PDF, DOCX, TXT. Máximo 50MB." |
| InlineHelp en Reports | ReportHub | "Los informes se generan a partir de tus análisis anteriores." |
| HelpTooltip en Scores | VectorResults | "Alta = respaldado por múltiples fuentes. Media = verificar." |

### 4. Demo Sandbox

Configurar un tenant de demo con:
- 3-5 documentos técnicos de ascensores pre-indexados
- Checklists de ejemplo pre-creadas
- Ontología de elevators activada

Reutilizar datos sintéticos que ya existen en `src/verticals/elevators/`.

---

## ✅ Criterio de "Done"

- [ ] Onboarding aparece la primera vez que un usuario entra (post-login)
- [ ] 3 pasos completables en < 3 minutos
- [ ] "Usar documento de ejemplo" funciona con PDF real
- [ ] Selector de contexto persiste y afecta la navegación
- [ ] `HelpButton` muestra contenido real en al menos 5 páginas clave
- [ ] Tasa de completado (tracking) implementada
- [ ] Se puede saltar en cualquier momento
- [ ] No vuelve a aparecer una vez completado
