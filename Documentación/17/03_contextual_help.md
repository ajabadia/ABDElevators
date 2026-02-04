# COMPONENTE 3: SISTEMA DE TOOLTIPS CONTEXTUALES

**Archivo:** `src/hooks/useContextualHelp.ts`

```typescript
import { useState, useCallback } from "react"

export interface HelpTooltip {
  id: string
  title: string
  content: string
  example?: string
  tips?: string[]
  learnMore?: {
    label: string
    href: string
  }
}

export interface HelpContext {
  [key: string]: HelpTooltip
}

// Base de conocimiento de tooltips
const HELP_CONTEXT: HelpContext = {
  "upload-documents": {
    id: "upload-documents",
    title: "Subir Documentos Técnicos",
    content: "Puedes subir PDFs, imágenes y documentos Word. El sistema analizará automáticamente el contenido y lo indexará para búsquedas futuras.",
    example: "Ej: Manual ARCA II, esquemas de conexionado, procedimientos de mantenimiento",
    tips: [
      "Usa archivos en buen estado (legibles, bien escaneados)",
      "Nombres descriptivos ayudan a la búsqueda (ej: 'Manual_ARCA2_v3.pdf')",
      "Máximo 50MB por archivo",
      "PDFs con texto OCR se indexan mejor"
    ],
    learnMore: {
      label: "Ver guía de formatos",
      href: "/ayuda/formatos-soportados"
    }
  },

  "search-query": {
    id: "search-query",
    title: "Cómo Hacer Mejores Búsquedas",
    content: "Escribe preguntas en lenguaje natural, como si hablaras con un técnico. El sistema buscará en todos tus documentos automáticamente.",
    example: "✅ Buenos ejemplos:\n• ¿Cuál es el torque del motor principal?\n• Procedimiento de calibración de puertas\n• ¿Qué significa código E07?",
    tips: [
      "Sé específico: incluye el modelo si es importante",
      "Usa términos técnicos exactos",
      "Puedes hacer seguimiento: 'Y el tiempo de espera?'",
      "Si no encuentras respuesta, intenta reformular"
    ],
    learnMore: {
      label: "Tips avanzados de búsqueda",
      href: "/ayuda/busquedas-avanzadas"
    }
  },

  "search-sources": {
    id: "search-sources",
    title: "Fuentes de la Respuesta",
    content: "Cada respuesta muestra las fuentes de donde se extrajo la información. Puedes ver la página exacta para más contexto.",
    tips: [
      "Haz click en 'Ver documento' para acceder al original",
      "La página indicada es donde está la información exacta",
      "Múltiples fuentes = respuesta más confiable",
      "El porcentaje de confianza indica qué tan segura es la respuesta"
    ]
  },

  "documents-status": {
    id: "documents-status",
    title: "Estados de Documentos",
    content: "Cada documento tiene un estado que indica su progreso de procesamiento.",
    example: "🔵 Procesando - El sistema está analizando el documento\n✅ Listo - Ya puedes hacer búsquedas sobre él\n❌ Error - Hubo un problema. Intenta subirlo de nuevo",
    tips: [
      "Los documentos grandes tardan más (1-5 minutos)",
      "Puedes seguir usando otros documentos mientras se procesa",
      "Si falla, verifica que el formato sea correcto"
    ]
  },

  "rag-confidence": {
    id: "rag-confidence",
    title: "Confianza de la Respuesta",
    content: "El score de confianza (0-100%) indica cuán segura es la respuesta basada en los documentos disponibles.",
    example: "95% = Información directa encontrada\n70% = Información relacionada pero no exacta\n<50% = Información vaga o especulativa",
    tips: [
      "Busca respuestas con >80% de confianza",
      "Si la confianza es baja, prueba otra pregunta",
      "Más documentos = potencialmente mejores respuestas"
    ]
  },

  "feedback-system": {
    id: "feedback-system",
    title: "Sistema de Feedback",
    content: "Tu feedback (útil/no útil) nos ayuda a mejorar las respuestas para todos. Úsalo siempre que sea posible.",
    tips: [
      "Márcalo como 'No útil' si necesitaba más especificidad",
      "Tu feedback es anónimo para otros usuarios",
      "Ayuda a entrenar el sistema RAG",
      "Importa porque luego mejoran las respuestas para todos"
    ]
  },

  "history-function": {
    id: "history-function",
    title: "Tu Historial",
    content: "Aquí se guardan todas tus búsquedas y respuestas. Puedes volver a cualquier conversación anterior.",
    example: "Útil para:\n• Volver a consultas frecuentes\n• Ver cómo cambió una especificación\n• Compartir con colegas",
    tips: [
      "Las búsquedas se guardan automáticamente",
      "Puedes filtrar por fecha o palabra clave",
      "El historial es privado a tu cuenta",
      "Se conserva durante 90 días"
    ]
  },

  "document-filters": {
    id: "document-filters",
    title: "Filtros de Búsqueda",
    content: "Limita la búsqueda a documentos específicos si solo necesitas información de un modelo o tipo.",
    example: "Buscar solo en:\n• Modelo ARCA II\n• Tipo: Manual Técnico\n• Componente: Motor",
    tips: [
      "Más específico = resultados más precisos",
      "Pero menos específico = más cobertura",
      "Combina filtros para refinar"
    ]
  },

  "contact-support": {
    id: "contact-support",
    title: "Centro de Soporte",
    content: "¿No encuentras lo que buscas? Nuestro equipo técnico está disponible para ayudarte.",
    example: "Puedes contactarnos por:\n• Email: soporte@abdrag.com\n• Chat: Disponible de 09:00 a 18:00\n• Teléfono: +34 900 123 456",
    tips: [
      "Ten a mano el ID de tu consulta (correlationId)",
      "Describe detalladamente tu problema",
      "Adjunta screenshots si es posible",
      "Respuesta típica en <2 horas"
    ]
  }
}

export function useContextualHelp() {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null)

  const getHelp = useCallback((contextId: string): HelpTooltip | null => {
    return HELP_CONTEXT[contextId] || null
  }, [])

  const toggleHelp = useCallback((contextId: string) => {
    setActiveTooltip(activeTooltip === contextId ? null : contextId)
  }, [activeTooltip])

  const closeHelp = useCallback(() => {
    setActiveTooltip(null)
  }, [])

  return {
    getHelp,
    toggleHelp,
    closeHelp,
    activeTooltip,
    allContexts: HELP_CONTEXT
  }
}
```

---

**Archivo:** `src/components/ui/help-tooltip.tsx`

```typescript
"use client"

import React, { useState } from "react"
import {
  HelpCircle,
  X,
  ChevronRight,
  Lightbulb,
  ExternalLink
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { HelpTooltip } from "@/hooks/useContextualHelp"

interface HelpTooltipProps {
  help: HelpTooltip
  onClose: () => void
  position?: "top" | "right" | "bottom" | "left"
  inline?: boolean
}

export function HelpTooltipComponent({
  help,
  onClose,
  position = "right",
  inline = false
}: HelpTooltipProps) {
  const [isExpanded, setIsExpanded] = useState(inline)

  const baseClasses = "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 animate-in fade-in slide-in-from-bottom-2 duration-300"
  
  const positionClasses = {
    top: "absolute bottom-full mb-3 left-1/2 -translate-x-1/2",
    right: "absolute left-full ml-3 top-1/2 -translate-y-1/2",
    bottom: "absolute top-full mt-3 left-1/2 -translate-x-1/2",
    left: "absolute right-full mr-3 top-1/2 -translate-y-1/2"
  }

  const maxWidth = inline ? "w-full" : "w-96"

  return (
    <div className={cn(baseClasses, !inline && positionClasses[position], maxWidth, "p-5")}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-2 flex-1">
          <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg shrink-0 mt-0.5">
            <HelpCircle className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-sm text-foreground">
              {help.title}
            </h4>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {help.content}
            </p>
          </div>
        </div>
        {!inline && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors shrink-0 -mt-1 -mr-1"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Example */}
      {help.example && (
        <>
          <div className="my-3 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              💡 Ejemplo:
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-mono whitespace-pre-wrap">
              {help.example}
            </p>
          </div>
        </>
      )}

      {/* Tips */}
      {help.tips && help.tips.length > 0 && (
        <>
          {isExpanded || inline ? (
            <div className="my-3 space-y-2">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                Tips:
              </p>
              <ul className="space-y-1.5 ml-1">
                {help.tips.map((tip, i) => (
                  <li key={i} className="flex gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <span className="text-teal-600 font-bold">→</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <button
              onClick={() => setIsExpanded(true)}
              className="text-xs text-teal-600 hover:text-teal-700 font-semibold mt-2 flex items-center gap-1 group"
            >
              Ver tips
              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}
        </>
      )}

      {/* Learn More */}
      {help.learnMore && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <a
            href={help.learnMore.href}
            className="text-xs text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1 group"
          >
            {help.learnMore.label}
            <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        </div>
      )}

      {/* Arrow pointer */}
      {!inline && (
        <div
          className={cn(
            "absolute w-2 h-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rotate-45",
            position === "right" && "-left-1 top-1/2 -translate-y-1/2",
            position === "left" && "-right-1 top-1/2 -translate-y-1/2",
            position === "top" && "-bottom-1 left-1/2 -translate-x-1/2",
            position === "bottom" && "-top-1 left-1/2 -translate-x-1/2"
          )}
        />
      )}
    </div>
  )
}
```

---

**Archivo:** `src/components/ui/help-button.tsx`

```typescript
"use client"

import React, { useState, useRef, useEffect } from "react"
import { HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { HelpTooltipComponent } from "./help-tooltip"
import { useContextualHelp } from "@/hooks/useContextualHelp"
import { cn } from "@/lib/utils"

interface HelpButtonProps {
  contextId: string
  position?: "top" | "right" | "bottom" | "left"
  size?: "sm" | "md" | "lg"
  variant?: "icon" | "text" | "inline"
  label?: string
  className?: string
}

export function HelpButton({
  contextId,
  position = "right",
  size = "sm",
  variant = "icon",
  label = "Ayuda",
  className
}: HelpButtonProps) {
  const { getHelp, activeTooltip, toggleHelp, closeHelp } = useContextualHelp()
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const help = getHelp(contextId)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen])

  if (!help) return null

  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10"
  }

  const handleClick = () => {
    setIsOpen(!isOpen)
    toggleHelp(contextId)
  }

  return (
    <div className="relative inline-block">
      {variant === "icon" && (
        <Button
          ref={buttonRef}
          variant="ghost"
          size="icon"
          className={cn(sizeClasses[size], "hover:bg-blue-50 dark:hover:bg-blue-900/20", className)}
          onClick={handleClick}
          aria-label={label}
        >
          <HelpCircle className={cn(
            "text-blue-500 hover:text-blue-600",
            size === "sm" && "w-4 h-4",
            size === "md" && "w-5 h-5",
            size === "lg" && "w-6 h-6"
          )} />
        </Button>
      )}

      {variant === "text" && (
        <Button
          ref={buttonRef}
          variant="ghost"
          size="sm"
          className={cn("text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 gap-1 h-6 px-2", className)}
          onClick={handleClick}
        >
          <HelpCircle className="w-3 h-3" />
          {label}
        </Button>
      )}

      {variant === "inline" && (
        <button
          ref={buttonRef}
          className={cn(
            "inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors cursor-help ml-1.5 -mt-0.5 shrink-0",
            className
          )}
          onClick={handleClick}
          aria-label={label}
          title={label}
        >
          <HelpCircle className="w-3 h-3" />
        </button>
      )}

      {/* Tooltip */}
      {isOpen && (
        <HelpTooltipComponent
          help={help}
          onClose={() => {
            setIsOpen(false)
            closeHelp()
          }}
          position={position}
        />
      )}
    </div>
  )
}
```

---

**Archivo:** `src/components/ui/inline-help-panel.tsx`

```typescript
"use client"

import React from "react"
import { Lightbulb, ExternalLink, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useContextualHelp } from "@/hooks/useContextualHelp"
import { cn } from "@/lib/utils"

interface InlineHelpPanelProps {
  contextIds: string[]
  variant?: "compact" | "full"
  dismissible?: boolean
}

export function InlineHelpPanel({
  contextIds,
  variant = "compact",
  dismissible = true
}: InlineHelpPanelProps) {
  const { getHelp } = useContextualHelp()
  const [isDismissed, setIsDismissed] = React.useState(false)

  if (isDismissed) return null

  return (
    <div className={cn(
      "border border-blue-100 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/20 rounded-2xl p-4 space-y-3",
      variant === "full" && "p-6 space-y-4"
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl shrink-0 mt-0.5">
            <Lightbulb className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="font-bold text-sm text-blue-900 dark:text-blue-300">
              💡 Ayuda Rápida
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">
              Consejos útiles sobre esta sección
            </p>
          </div>
        </div>
        {dismissible && (
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors shrink-0"
          >
            <X className="w-4 h-4 text-blue-600" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="space-y-2">
        {contextIds.map(contextId => {
          const help = getHelp(contextId)
          if (!help) return null

          return (
            <div key={help.id} className="ml-10">
              {variant === "full" ? (
                <>
                  <p className="text-xs font-semibold text-blue-900 dark:text-blue-300 mb-1">
                    {help.title}
                  </p>
                  <p className="text-xs text-blue-800 dark:text-blue-400 leading-relaxed">
                    {help.content}
                  </p>
                </>
              ) : (
                <p className="text-xs text-blue-800 dark:text-blue-400 leading-relaxed">
                  <span className="font-semibold">{help.title}:</span> {help.content}
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Learn More Button */}
      {contextIds.length === 1 && getHelp(contextIds[0])?.learnMore && (
        <div className="pt-2 border-t border-blue-100 dark:border-blue-900/30">
          <a
            href={getHelp(contextIds[0])?.learnMore?.href || "#"}
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold group"
          >
            {getHelp(contextIds[0])?.learnMore?.label}
            <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        </div>
      )}
    </div>
  )
}
```

---

## 🚀 Uso en Componentes

```typescript
// Opción 1: Button en icono (pequeño)
<div className="flex items-center gap-2">
  <label>Consulta Técnica</label>
  <HelpButton contextId="search-query" size="sm" />
</div>

// Opción 2: Button como texto
<HelpButton 
  contextId="upload-documents" 
  variant="text"
  label="¿Qué puedo subir?"
  position="bottom"
/>

// Opción 3: Inline (dentro de texto)
<p>
  El sistema de búsqueda es muy poderoso.
  <HelpButton contextId="search-sources" variant="inline" />
</p>

// Opción 4: Panel de ayuda inline en sección
<InlineHelpPanel 
  contextIds={["upload-documents", "documents-status"]}
  variant="full"
/>
```

---

## 📋 Integración en Páginas

En `src/app/authenticated/buscar/page.tsx`:

```typescript
import { HelpButton } from "@/components/ui/help-button"
import { InlineHelpPanel } from "@/components/ui/inline-help-panel"

export default function SearchPage() {
  return (
    <>
      {/* Panel de ayuda superior */}
      <InlineHelpPanel 
        contextIds={["search-query", "search-sources"]}
        dismissible
      />

      {/* Input con botón de ayuda */}
      <div className="flex gap-2">
        <Input placeholder="Pregunta..." />
        <HelpButton 
          contextId="search-query"
          position="top"
          size="md"
        />
      </div>
    </>
  )
}
```

---

## ✅ Características

✅ 9 contextos de ayuda predefinidos  
✅ Tooltips flotantes con arrow  
✅ Ejemplos y tips integrados  
✅ Enlaces a documentación completa  
✅ Variantes: icon, text, inline  
✅ Panel de ayuda inline desplegable  
✅ Responsive y accesible  
✅ Dark mode integrado  
✅ Fácil de extender con nuevos contextos
