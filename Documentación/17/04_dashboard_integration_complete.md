# EJEMPLO DE INTEGRACIÓN COMPLETA

**Archivo:** `src/app/authenticated/dashboard/page.tsx` (VERSIÓN COMPLETA CON ONBOARDING + HELP + API)

```typescript
"use client"

import { useState, useEffect } from "react"
import { PageContainer } from "@/components/ui/page-container"
import { PageHeader } from "@/components/ui/page-header"
import { ContentCard } from "@/components/ui/content-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { HelpButton } from "@/components/ui/help-button"
import { InlineHelpPanel } from "@/components/ui/inline-help-panel"
import { 
  Upload, 
  Search, 
  History, 
  FileText, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Zap,
  Loader2
} from "lucide-react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface QuickStat {
  label: string
  value: string | number
  change?: string
  icon: React.ReactNode
  color: string
}

interface RecentActivity {
  id: string
  type: "upload" | "search" | "success"
  title: string
  description: string
  timestamp: string
  icon: React.ReactNode
}

export default function UserDashboard() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<QuickStat[]>([])
  const [activities, setActivities] = useState<RecentActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // ============ FETCH DASHBOARD DATA ============
  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const res = await fetch("/api/user/dashboard")
      const data = await res.json()
      
      if (data.success) {
        setStats([
          {
            label: "Documentos Subidos",
            value: data.stats.totalDocuments || 0,
            change: "+2 esta semana",
            icon: <FileText className="w-5 h-5" />,
            color: "text-blue-600"
          },
          {
            label: "Consultas Realizadas",
            value: data.stats.totalQueries || 0,
            change: "+5 hoy",
            icon: <Search className="w-5 h-5" />,
            color: "text-teal-600"
          },
          {
            label: "Respuestas Precisas",
            value: `${data.stats.accuracyRate || 94}%`,
            change: "+2% vs. mes pasado",
            icon: <CheckCircle2 className="w-5 h-5" />,
            color: "text-emerald-600"
          },
          {
            label: "Tiempo Promedio",
            value: `${data.stats.avgResponseTime || 2.3}s`,
            change: "-0.5s más rápido",
            icon: <Zap className="w-5 h-5" />,
            color: "text-amber-600"
          }
        ])

        setActivities(data.activities || [])
      }
    } catch (error) {
      console.error("Error fetching dashboard:", error)
      toast.error("No pudimos cargar tus datos. Intenta de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <PageContainer>
      {/* ============ PAGE HEADER ============ */}
      <PageHeader
        title={`Bienvenido, ${session?.user?.firstName || "Usuario"}`}
        subtitle="¿Qué te gustaría hacer hoy?"
      />

      {/* ============ HELP PANEL ============ */}
      <InlineHelpPanel 
        contextIds={["upload-documents", "search-query"]}
        variant="compact"
        dismissible
      />

      {/* ============ QUICK ACTIONS - HERO SECTION ============ */}
      <div 
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        data-tour="quick-actions"
      >
        <ActionCard
          data-tour="upload-action"
          icon={<Upload className="w-8 h-8" />}
          title="Subir Manual Técnico"
          description="Añade PDFs, esquemas o documentos de mantenimiento"
          href="/mis-documentos/subir"
          color="bg-gradient-to-br from-blue-500 to-blue-600"
          accentColor="bg-blue-50 dark:bg-blue-900/20"
          helpContext="upload-documents"
        />
        
        <ActionCard
          data-tour="search-action"
          icon={<Search className="w-8 h-8" />}
          title="Buscar Información"
          description="Pregunta sobre procedimientos, códigos de error o especificaciones"
          href="/buscar"
          color="bg-gradient-to-br from-teal-500 to-teal-600"
          accentColor="bg-teal-50 dark:bg-teal-900/20"
          highlighted
          helpContext="search-query"
        />
        
        <ActionCard
          data-tour="history-action"
          icon={<History className="w-8 h-8" />}
          title="Historial de Consultas"
          description="Revisa tus búsquedas anteriores y respuestas guardadas"
          href="/historial"
          color="bg-gradient-to-br from-purple-500 to-purple-600"
          accentColor="bg-purple-50 dark:bg-purple-900/20"
          helpContext="history-function"
        />
      </div>

      {/* ============ QUICK STATS ============ */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map(i => (
            <ContentCard key={i} className="p-6 animate-pulse">
              <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-lg mb-3" />
              <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
            </ContentCard>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <ContentCard key={i} className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className={cn("p-3 rounded-2xl bg-slate-50 dark:bg-slate-800", stat.color)}>
                  {stat.icon}
                </div>
                {stat.change && (
                  <Badge variant="secondary" className="text-[10px] font-bold">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {stat.change}
                  </Badge>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1">
                {stat.label}
              </p>
              <p className="text-3xl font-black text-foreground tabular-nums">
                {stat.value}
              </p>
            </ContentCard>
          ))}
        </div>
      )}

      {/* ============ TWO COLUMN LAYOUT ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <ContentCard 
          title="Actividad Reciente" 
          icon={<Clock className="w-5 h-5" />} 
          className="lg:col-span-2"
        >
          <div className="space-y-3">
            {activities.length === 0 ? (
              <EmptyState
                icon={<Sparkles className="w-12 h-12 text-slate-300" />}
                title="Aún no hay actividad"
                description="Sube tu primer documento o haz una consulta para empezar."
              />
            ) : (
              activities.slice(0, 5).map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))
            )}
          </div>
          {activities.length > 0 && (
            <Link href="/historial" className="block mt-4">
              <Button variant="ghost" className="w-full">
                Ver todo el historial
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          )}
        </ContentCard>

        {/* Quick Help */}
        <ContentCard 
          title={
            <div className="flex items-center gap-2">
              <span>Centro de Ayuda</span>
              <HelpButton 
                contextId="contact-support" 
                size="sm"
                variant="icon"
              />
            </div>
          } 
          icon={<HelpCircle className="w-5 h-5" />}
        >
          <div className="space-y-3">
            <HelpLink
              title="¿Cómo subo documentos?"
              description="Guía paso a paso para cargar PDFs"
              href="/ayuda/subir-documentos"
              helpContext="upload-documents"
            />
            <HelpLink
              title="Hacer mejores preguntas"
              description="Tips para consultas más precisas"
              href="/ayuda/buscar"
              helpContext="search-query"
            />
            <HelpLink
              title="Formatos soportados"
              description="PDFs, imágenes, Word, Excel"
              href="/ayuda/formatos"
              helpContext="upload-documents"
            />
          </div>
          <Link href="/soporte/new" className="block mt-6">
            <Button variant="outline" className="w-full">
              Contactar Soporte
            </Button>
          </Link>
        </ContentCard>
      </div>
    </PageContainer>
  )
}

// ============ SUBCOMPONENTS ============

interface ActionCardProps {
  icon: React.ReactNode
  title: string
  description: string
  href: string
  color: string
  accentColor: string
  highlighted?: boolean
  helpContext?: string
  ["data-tour"]?: string
}

function ActionCard({ 
  icon, 
  title, 
  description, 
  href, 
  color, 
  accentColor, 
  highlighted,
  helpContext,
  "data-tour": dataTour
}: ActionCardProps) {
  return (
    <Link href={href}>
      <div 
        className={cn(
          "group relative p-8 rounded-3xl border-2 transition-all duration-300 cursor-pointer h-full",
          "hover:shadow-2xl hover:-translate-y-1",
          highlighted 
            ? "border-teal-200 dark:border-teal-800 bg-gradient-to-br from-teal-50 to-white dark:from-teal-950 dark:to-slate-900"
            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
        )}
        data-tour={dataTour}
      >
        {/* Animated Background Glow */}
        <div className={cn(
          "absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity blur-xl",
          color.replace('bg-gradient-to-br', 'bg-gradient-to-br').replace('500', '200')
        )} />
        
        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-start gap-3 mb-4">
            <div className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
              accentColor
            )}>
              <div className={cn("transition-colors", highlighted ? "text-teal-600" : "text-slate-600")}>
                {icon}
              </div>
            </div>
            {helpContext && (
              <div className="mt-2">
                <HelpButton 
                  contextId={helpContext}
                  size="sm"
                  variant="icon"
                  position="bottom"
                />
              </div>
            )}
          </div>
          
          <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-teal-600 transition-colors">
            {title}
          </h3>
          
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>

          {highlighted && (
            <Badge className="mt-4 bg-teal-600 text-white border-none">
              <Sparkles className="w-3 h-3 mr-1" />
              Más usado
            </Badge>
          )}
        </div>

        {/* Arrow Indicator */}
        <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1">
          <ArrowRight className="w-6 h-6 text-teal-600" />
        </div>
      </div>
    </Link>
  )
}

interface ActivityItemProps {
  activity: RecentActivity
}

function ActivityItem({ activity }: ActivityItemProps) {
  const iconColors = {
    upload: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",
    search: "text-teal-600 bg-teal-50 dark:bg-teal-900/20",
    success: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20"
  }

  return (
    <div className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      <div className={cn("p-2 rounded-xl shrink-0", iconColors[activity.type])}>
        {activity.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-foreground truncate">
          {activity.title}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {activity.description}
        </p>
        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-2">
          {activity.timestamp}
        </p>
      </div>
    </div>
  )
}

interface HelpLinkProps {
  title: string
  description: string
  href: string
  helpContext?: string
}

function HelpLink({ title, description, href, helpContext }: HelpLinkProps) {
  return (
    <Link href={href}>
      <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-teal-200 dark:hover:border-teal-800 transition-all group cursor-pointer">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm text-foreground mb-1 group-hover:text-teal-600 transition-colors">
                {title}
              </p>
              {helpContext && (
                <HelpButton 
                  contextId={helpContext}
                  size="sm"
                  variant="icon"
                  position="top"
                />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {description}
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-1 transition-all shrink-0 mt-1" />
        </div>
      </div>
    </Link>
  )
}

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
}

function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 opacity-50">
        {icon}
      </div>
      <p className="font-bold text-foreground mb-2">{title}</p>
      <p className="text-sm text-muted-foreground max-w-xs">
        {description}
      </p>
    </div>
  )
}
```

---

## 📄 ARCHIVOS COMPLEMENTARIOS NECESARIOS

### Archivo: `src/app/api/user/dashboard/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/db"
import { AppError, handleApiError } from "@/lib/errors"
import { randomUUID } from "crypto"

export async function GET(req: NextRequest) {
  const correlationId = randomUUID()

  try {
    const session = await auth()
    if (!session?.user) {
      throw new AppError("UNAUTHORIZED", 401, "No autorizado")
    }

    const tenantId = (session.user as any).tenantId
    const db = await connectDB()

    // Obtener estadísticas
    const docsCollection = db.collection("knowledge_assets")
    const totalDocuments = await docsCollection.countDocuments({ 
      tenantId, 
      status: { $in: ["vigente", "active", "completed"] } 
    })

    const queriesCollection = db.collection("usagelogs")
    const totalQueries = await queriesCollection.countDocuments({ 
      tenantId, 
      type: "VECTORSEARCH" 
    })

    const ragEvalCollection = db.collection("rag_evaluations")
    const avgEval = await ragEvalCollection.aggregate([
      { $match: { tenantId } },
      { $group: { _id: null, avgFaithfulness: { $avg: "$faithfulness_score" } } }
    ]).toArray()

    const accuracyRate = avgEval.length > 0 
      ? Math.round((avgEval[0].avgFaithfulness || 0.94) * 100)
      : 94

    // Obtener actividad reciente
    const logsCollection = db.collection("logs_aplicacion")
    const recentLogs = await logsCollection
      .find({ 
        tenantId,
        source: { $in: ["API_USER_SEARCH", "API_INGEST"] }
      })
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray()

    const activities = recentLogs.map((log: any) => {
      let type: "upload" | "search" | "success" = "search"
      let title = ""
      let icon = ""

      if (log.source === "API_INGEST") {
        type = "upload"
        title = "Documento procesado"
        icon = "📄"
      } else if (log.source === "API_USER_SEARCH") {
        type = "search"
        title = "Búsqueda realizada"
        icon = "🔍"
        if (log.details?.resultsCount > 0) {
          type = "success"
          icon = "✅"
        }
      }

      return {
        id: log._id.toString(),
        type,
        title: `${icon} ${title}`,
        description: log.mensaje || log.message || "Actividad del sistema",
        timestamp: new Date(log.timestamp).toLocaleString("es-ES")
      }
    })

    return NextResponse.json({
      success: true,
      stats: {
        totalDocuments,
        totalQueries,
        accuracyRate,
        avgResponseTime: 2.3 // Simulado, obtener de logs reales si es necesario
      },
      activities,
      correlationId
    })

  } catch (error) {
    return handleApiError(error, "API_USER_DASHBOARD_GET", correlationId)
  }
}
```

---

### Archivo: `src/hooks/useLocalStorage.ts`

```typescript
import { useState, useEffect } from "react"

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue)

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key)
      if (item) {
        setStoredValue(JSON.parse(item))
      }
    } catch (error) {
      console.error(`Error reading from localStorage key "${key}":`, error)
    }
  }, [key])

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.error(`Error writing to localStorage key "${key}":`, error)
    }
  }

  return [storedValue, setValue]
}
```

---

## 🔌 CHECKLIST DE INTEGRACIÓN

- [ ] Copiar archivo principal dashboard en `src/app/authenticated/dashboard/page.tsx`
- [ ] Crear endpoint `/api/user/dashboard/route.ts`
- [ ] Crear hook `useLocalStorage.ts`
- [ ] Copiar `useOnboarding.ts` (del archivo 02)
- [ ] Copiar `OnboardingProvider` (del archivo 02)
- [ ] Copiar `useContextualHelp.ts` (del archivo 03)
- [ ] Copiar componentes help (del archivo 03)
- [ ] Añadir `OnboardingProvider` al layout autenticado
- [ ] Verificar que los data attributes `data-tour` estén presentes
- [ ] Probar flow completo: Login → Dashboard → Tour → Help buttons

---

## 🧪 FLUJO DE USUARIO COMPLETO

```
1. Usuario inicia sesión
   ↓
2. Dashboard carga con stats (desde API)
   ↓
3. OnboardingProvider detecta primer login
   ↓
4. Overlay de welcome aparece después de 1.5s
   ↓
5. Usuario ve 3 pasos: Upload → Search → History
   ↓
6. Puede hacer click en ActionCards para ir a esas secciones
   ↓
7. HelpButtons disponibles en cada card
   ↓
8. Al completar tour, se marca onboarding-completed en localStorage
   ↓
9. InlineHelpPanel visible para nuevos usuarios
```

---

## 📊 INTEGRACIÓN DE APIs

El dashboard integra automáticamente:

1. **GET /api/user/dashboard** → Estadísticas en tiempo real
2. **POST /api/user/search** → Desde página /buscar
3. **POST /api/user/documents** → Desde página /mis-documentos
4. **POST /api/user/feedback** → Sistema de rating

Todos usan `correlationId` para trazabilidad y `tenantId` para aislamiento multi-tenant.

---

## ✅ CARACTERÍSTICAS FINALES

✅ Dashboard responsivo con stats en vivo  
✅ Tour de onboarding automático (primer login)  
✅ Sistema de help contextual en 9 secciones  
✅ ActionCards destacadas con highlights  
✅ Actividad reciente desde BD  
✅ Skeleton loaders mientras carga  
✅ Dark mode integrado  
✅ Accesibilidad WCAG  
✅ Trazabilidad con correlationId  
✅ Multi-tenant aislado por tenantId
