# COMPONENTE 2: ONBOARDING HOOK + COMPONENT

**Archivo:** `src/hooks/useOnboarding.ts`

```typescript
import { useEffect, useState } from "react"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { useSession } from "next-auth/react"

export interface OnboardingStep {
  id: string
  target: string
  title: string
  content: string
  placement: "top" | "bottom" | "left" | "right"
  action?: {
    label: string
    href: string
  }
  index: number
}

export function useOnboarding() {
  const { data: session } = useSession()
  const [isCompleted, setIsCompleted] = useLocalStorage("onboarding-completed", false)
  const [currentStep, setCurrentStep] = useLocalStorage<number>("onboarding-step", 0)
  const [isVisible, setIsVisible] = useState(false)

  const steps: OnboardingStep[] = [
    {
      id: "welcome",
      target: "[data-tour='quick-actions']",
      title: "🎯 Bienvenido a ABD RAG Platform",
      content: "Hola! Aquí puedes subir documentos técnicos, hacer búsquedas inteligentes y acceder a tu historial. En 2 minutos te mostramos cómo.",
      placement: "bottom",
      action: {
        label: "Empecemos →",
        href: "#"
      },
      index: 0
    },
    {
      id: "upload",
      target: "[data-tour='upload-action']",
      title: "📄 Paso 1: Sube tus Manuales Técnicos",
      content: "Aquí puedes arrastrar PDFs, imágenes de esquemas o documentos Word. El sistema los analizará automáticamente en segundos.",
      placement: "right",
      action: {
        label: "Probar ahora →",
        href: "/mis-documentos"
      },
      index: 1
    },
    {
      id: "search",
      target: "[data-tour='search-action']",
      title: "🔍 Paso 2: Haz Preguntas en Lenguaje Natural",
      content: "Una vez subidos, pregunta sobre lo que necesites. Ej: '¿Cuál es el torque del motor?' El sistema buscará automáticamente en tus documentos.",
      placement: "right",
      action: {
        label: "Ir a Búsqueda →",
        href: "/buscar"
      },
      index: 2
    },
    {
      id: "history",
      target: "[data-tour='history-action']",
      title: "📋 Paso 3: Accede a tu Historial",
      content: "Todas tus búsquedas y respuestas quedan guardadas aquí. Puedes volver a consultarlas cuando quieras.",
      placement: "right",
      index: 3
    }
  ]

  useEffect(() => {
    // Solo mostrar onboarding en primer login
    if (session && !isCompleted) {
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 1500) // Esperar a que cargue todo

      return () => clearTimeout(timer)
    }
  }, [session, isCompleted])

  const goToStep = (index: number) => {
    setCurrentStep(index)
  }

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const completeOnboarding = () => {
    setIsCompleted(true)
    setIsVisible(false)
  }

  const skipOnboarding = () => {
    completeOnboarding()
  }

  return {
    steps,
    currentStep,
    isVisible,
    isCompleted,
    goToStep,
    nextStep,
    prevStep,
    completeOnboarding,
    skipOnboarding,
    progress: ((currentStep + 1) / steps.length) * 100
  }
}
```

---

**Archivo:** `src/components/ui/onboarding-overlay.tsx`

```typescript
"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  X, 
  ChevronRight, 
  ChevronLeft,
  Sparkles,
  SkipForward
} from "lucide-react"
import { cn } from "@/lib/utils"
import { OnboardingStep } from "@/hooks/useOnboarding"

interface OnboardingOverlayProps {
  step: OnboardingStep
  currentIndex: number
  totalSteps: number
  progress: number
  onNext: () => void
  onPrev: () => void
  onSkip: () => void
  onComplete: () => void
}

export function OnboardingOverlay({
  step,
  currentIndex,
  totalSteps,
  progress,
  onNext,
  onPrev,
  onSkip,
  onComplete
}: OnboardingOverlayProps) {
  const [position, setPosition] = useState<{
    top: number
    left: number
    width: number
    height: number
  } | null>(null)

  useEffect(() => {
    const element = document.querySelector(step.target)
    if (element) {
      const rect = element.getBoundingClientRect()
      setPosition({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height
      })
    }
  }, [step.target])

  if (!position) return null

  const PADDING = 12
  const TOOLTIP_WIDTH = 340

  // Calcular posición del tooltip
  const getTooltipPosition = () => {
    const placements = {
      top: {
        top: position.top - TOOLTIP_WIDTH - PADDING - 50,
        left: position.left + (position.width - TOOLTIP_WIDTH) / 2
      },
      bottom: {
        top: position.top + position.height + PADDING,
        left: position.left + (position.width - TOOLTIP_WIDTH) / 2
      },
      left: {
        top: position.top + (position.height - TOOLTIP_WIDTH) / 2,
        left: position.left - TOOLTIP_WIDTH - PADDING
      },
      right: {
        top: position.top + (position.height - TOOLTIP_WIDTH) / 2,
        left: position.left + position.width + PADDING
      }
    }
    return placements[step.placement as keyof typeof placements]
  }

  const tooltipPos = getTooltipPosition()

  const isLastStep = currentIndex === totalSteps - 1

  return (
    <>
      {/* Overlay oscuro */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={onSkip}
      />

      {/* Highlight del elemento */}
      <div
        className="fixed z-40 border-2 border-teal-400 rounded-2xl shadow-2xl shadow-teal-500/50 pointer-events-none transition-all duration-300"
        style={{
          top: position.top - PADDING,
          left: position.left - PADDING,
          width: position.width + PADDING * 2,
          height: position.height + PADDING * 2,
          boxShadow: "0 0 30px rgba(13, 148, 136, 0.6), inset 0 0 20px rgba(13, 148, 136, 0.1)"
        }}
      />

      {/* Tooltip */}
      <div
        className="fixed z-50 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
        style={{
          top: `${tooltipPos.top}px`,
          left: `${tooltipPos.left}px`,
          width: `${TOOLTIP_WIDTH}px`
        }}
      >
        {/* Close Button */}
        <button
          onClick={onSkip}
          className="absolute top-3 right-3 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Progress Bar */}
        <div className="mb-4 space-y-2">
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-[10px]">
              <Sparkles className="w-2 h-2 mr-1" />
              Paso {currentIndex + 1} de {totalSteps}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={onSkip}
              className="text-[10px] h-6 gap-1"
            >
              <SkipForward className="w-3 h-3" />
              Saltar tour
            </Button>
          </div>
        </div>

        {/* Título */}
        <h3 className="text-lg font-bold text-foreground mb-2">
          {step.title}
        </h3>

        {/* Contenido */}
        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          {step.content}
        </p>

        {/* Botones de acción */}
        <div className="flex gap-3">
          {currentIndex > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onPrev}
              className="gap-1"
            >
              <ChevronLeft className="w-3 h-3" />
              Anterior
            </Button>
          )}

          <div className="flex-1" />

          {step.action && (
            <Button
              variant="outline"
              size="sm"
              className="text-[12px]"
              asChild
            >
              <a href={step.action.href}>
                {step.action.label}
              </a>
            </Button>
          )}

          <Button
            size="sm"
            onClick={isLastStep ? onComplete : onNext}
            className="bg-teal-600 hover:bg-teal-700 gap-1"
          >
            {isLastStep ? (
              <>¡Listo! </>
            ) : (
              <>
                Siguiente
                <ChevronRight className="w-3 h-3" />
              </>
            )}
          </Button>
        </div>

        {/* Dots de navegación */}
        <div className="flex justify-center gap-1.5 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <button
              key={i}
              onClick={() => i <= currentIndex + 1 ? undefined : null}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                i === currentIndex
                  ? "bg-teal-600 w-6"
                  : i < currentIndex
                    ? "bg-teal-200 cursor-pointer"
                    : "bg-slate-200 dark:bg-slate-800"
              )}
              disabled={i > currentIndex + 1}
            />
          ))}
        </div>
      </div>
    </>
  )
}
```

---

**Archivo:** `src/components/onboarding-provider.tsx`

```typescript
"use client"

import { useOnboarding } from "@/hooks/useOnboarding"
import { OnboardingOverlay } from "@/components/ui/onboarding-overlay"

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const {
    steps,
    currentStep,
    isVisible,
    isCompleted,
    nextStep,
    prevStep,
    completeOnboarding,
    skipOnboarding,
    progress
  } = useOnboarding()

  return (
    <>
      {children}
      {isVisible && !isCompleted && (
        <OnboardingOverlay
          step={steps[currentStep]}
          currentIndex={currentStep}
          totalSteps={steps.length}
          progress={progress}
          onNext={nextStep}
          onPrev={prevStep}
          onSkip={skipOnboarding}
          onComplete={completeOnboarding}
        />
      )}
    </>
  )
}
```

---

## 🔧 Integración en Layout

**Archivo:** `src/app/authenticated/layout.tsx`

```typescript
// Añadir esto al layout autenticado:

import { OnboardingProvider } from "@/components/onboarding-provider"

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <OnboardingProvider>
      {children}
    </OnboardingProvider>
  )
}
```

---

## ✅ Data Attributes a Añadir en Dashboard

En `src/app/authenticated/dashboard/page.tsx`, añade estos atributos:

```tsx
// En Quick Actions section:
<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12" data-tour="quick-actions">
  <ActionCard
    data-tour="upload-action"
    // ... resto de props
  />
  
  <ActionCard
    data-tour="search-action"
    // ... resto de props
  />
  
  <ActionCard
    data-tour="history-action"
    // ... resto de props
  />
</div>
```

---

## 📌 Características

✅ Tour de 3 pasos automático en primer login  
✅ Persistencia en localStorage  
✅ Skip/saltar en cualquier momento  
✅ Navegación entre pasos  
✅ Highlight con spotlight effect  
✅ Tooltip posicionado inteligentemente  
✅ Progreso visual  
✅ Animaciones suaves
