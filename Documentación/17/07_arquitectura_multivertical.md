# 🏢 ARQUITECTURA MULTI-VERTICAL: RAG-as-a-Service con Workflow Engine

**Documento Estratégico:** Evolución hacia Plataforma Vertical Multi-Tenant

---

## 📋 ÍNDICE

1. [Visión General](#visión-general)
2. [Modelo de Negocio](#modelo-de-negocio)
3. [Arquitectura Multi-Vertical](#arquitectura-multi-vertical)
4. [Sistema de Roles y Permisos](#sistema-de-roles-y-permisos)
5. [Workflow Engine](#workflow-engine)
6. [Customización por Vertical](#customización-por-vertical)
7. [Modelo de Datos Extensible](#modelo-de-datos-extensible)
8. [Roadmap de Implementación](#roadmap-de-implementación)

---

## 🎯 VISIÓN GENERAL

### Concepto

**RAG-as-a-Service Multi-Vertical** = Plataforma SaaS que combina:
- Motor RAG universal (busca en documentos/leyes/manuales/pólizas)
- Workflow engine configurable (asignación → validación → revisión)
- UI/UX adaptable por vertical (terminología, ejemplos, flujos)
- Multi-tenant con aislamiento total

### Verticales Objetivo

| Vertical | Caso de Uso Principal | Documentos RAG | Workflow Típico |
|----------|----------------------|----------------|-----------------|
| **Industria** | Mantenimiento técnico | Manuales, procedimientos, fichas técnicas | Técnico → Subir reporte → RAG valida → Supervisor revisa |
| **Banca** | Validación de operaciones | Normativas, compliance, políticas | Gestor → Subir operación → RAG valida → Compliance aprueba |
| **Seguros** | Gestión de siniestros | Pólizas, coberturas, exclusiones | Cliente reclama → Gestor asigna → RAG verifica cobertura → Aprueba/Rechaza |
| **Legal** | Revisión de contratos | Leyes, jurisprudencia, templates | Junior redacta → RAG verifica cláusulas → Senior revisa |
| **Sanidad** | Protocolos médicos | Guías clínicas, vademécums, protocolos | Médico → Consulta protocolo → RAG sugiere → Valida decisión |
| **Logística** | Compliance de pedidos | Reglamentos, ADR, normativas | Operador → Subir pedido → RAG valida conformidad → Aprueba envío |

---

## 💼 MODELO DE NEGOCIO

### Pricing por Vertical

```
Base Platform: €99/mes
├─ RAG Engine (búsquedas ilimitadas)
├─ 5 usuarios básicos
├─ 10 GB documentos
└─ Branding básico

Vertical Add-ons:
├─ Industry Pack: +€49/mes
│   └─ Terminología técnica, templates industriales
├─ Legal Pack: +€149/mes
│   └─ Integración jurisprudencia, templates legales
├─ Insurance Pack: +€99/mes
│   └─ Motor de pólizas, cálculo coberturas
└─ Custom Vertical: €499 setup + €99/mes
    └─ Workflow personalizado, UI customizada

Enterprise:
├─ Usuarios ilimitados
├─ Storage ilimitado
├─ White-label completo
├─ SLA 99.9%
└─ Precio: Consultar
```

### Monetización

1. **Suscripción base** (RAG + Workflow básico)
2. **Add-ons verticales** (packs especializados)
3. **Usuarios adicionales** (€15/usuario/mes)
4. **Storage adicional** (€10/GB/mes)
5. **API calls** (para integraciones externas)
6. **Professional Services** (customización, migración)

---

## 🏗️ ARQUITECTURA MULTI-VERTICAL

### Capas de la Plataforma

```
┌─────────────────────────────────────────┐
│   PRESENTATION LAYER (Next.js)          │
│   ┌─────────────────────────────────┐   │
│   │ Vertical UI Adapter              │   │
│   │ - Dynamic labels/terminology     │   │
│   │ - Vertical-specific components   │   │
│   │ - Customizable dashboards        │   │
│   └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│   BUSINESS LOGIC LAYER                   │
│   ┌────────────┬─────────────────────┐   │
│   │ Workflow   │  RAG Engine         │   │
│   │ Engine     │  (Universal)        │   │
│   │ (Configur.)│  - Hybrid search    │   │
│   │            │  - Semantic ranking │   │
│   └────────────┴─────────────────────┘   │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│   DATA LAYER (MongoDB)                   │
│   ┌──────────────────────────────────┐   │
│   │ Multi-Tenant Collections          │   │
│   │ - tenants (config vertical)       │   │
│   │ - workflows (definiciones)        │   │
│   │ - tasks (instancias workflow)     │   │
│   │ - knowledge_assets (docs RAG)     │   │
│   │ - rag_results (búsquedas)         │   │
│   └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### Aislamiento Multi-Tenant

**Nivel 1: Base de datos**
```typescript
// Todos los queries incluyen tenantId
db.collection("tasks").find({ tenantId: "acme-corp", status: "pending" })
```

**Nivel 2: Almacenamiento**
```
Cloudinary folders:
/tenants/{tenantId}/documents/
/tenants/{tenantId}/assets/
```

**Nivel 3: RAG Vectorial**
```typescript
// Embeddings incluyen metadata de tenant
vectorSearch({
  query: embedding,
  filter: { tenantId: "acme-corp", vertical: "industry" }
})
```

---

## 👥 SISTEMA DE ROLES Y PERMISOS

### Jerarquía de Roles (Guardian V3)

```typescript
// src/lib/schemas/roles.ts

export const ROLES = {
  // Super Admin (Perplexity - Interno)
  SUPERADMIN: "SUPERADMIN",
  
  // Tenant Admin (Cliente - Administrador general)
  TENANT_ADMIN: "TENANT_ADMIN",
  
  // Roles Administrativos del Cliente
  ADMIN_FINANCE: "ADMIN_FINANCE",      // Gestión de costes, billing
  ADMIN_COMPLIANCE: "ADMIN_COMPLIANCE", // Logs de auditoría, compliance
  ADMIN_CONTENT: "ADMIN_CONTENT",       // Gestión de documentos RAG
  
  // Roles Operativos
  MANAGER: "MANAGER",           // Asigna tareas, supervisa equipos
  REVIEWER: "REVIEWER",         // Revisa y valida tareas
  OPERATOR: "OPERATOR",         // Ejecuta tareas asignadas
  USER_BASIC: "USER_BASIC",     // Solo consulta RAG directo
  
  // Roles Verticales Especializados
  TECHNICIAN: "TECHNICIAN",     // Industria
  LAWYER_SENIOR: "LAWYER_SENIOR", // Legal
  LAWYER_JUNIOR: "LAWYER_JUNIOR", // Legal
  CLAIMS_MANAGER: "CLAIMS_MANAGER", // Seguros
  DOCTOR: "DOCTOR",              // Sanidad
} as const

export type Role = typeof ROLES[keyof typeof ROLES]
```

### Matriz de Permisos

| Recurso | TENANT_ADMIN | ADMIN_CONTENT | MANAGER | REVIEWER | OPERATOR | USER_BASIC |
|---------|--------------|---------------|---------|----------|----------|------------|
| **Usuarios** |
| Crear usuarios | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Asignar roles | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Ver usuarios | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Documentos RAG** |
| Subir documentos | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Eliminar docs | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Ver corpus | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Búsqueda RAG** |
| Búsqueda directa | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Ver historial propio | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Ver historial equipo | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Tareas/Workflow** |
| Crear tareas | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Asignar tareas | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Ejecutar asignadas | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Revisar tareas | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ |
| **Billing/Costes** |
| Ver costes | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Configurar límites | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Logs/Auditoría** |
| Ver logs sistema | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Exportar logs | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## ⚙️ WORKFLOW ENGINE

### Concepto

Un **workflow** es una secuencia configurable de estados y transiciones que define:
1. **Estados** de una tarea (ej: `DRAFT → PENDING_RAG → PENDING_VALIDATION → APPROVED`)
2. **Roles** que pueden ejecutar cada transición
3. **Validaciones** automáticas (ej: RAG debe aprobar antes de pasar a humano)
4. **Notificaciones** en cada cambio de estado

### Modelo de Datos

```typescript
// src/lib/schemas/workflow.ts

interface WorkflowDefinition {
  id: string
  tenantId: string
  vertical: "industry" | "legal" | "insurance" | "banking" | "healthcare" | "logistics"
  name: string
  version: number
  states: WorkflowState[]
  transitions: WorkflowTransition[]
  createdAt: Date
  updatedAt: Date
}

interface WorkflowState {
  id: string
  name: string                    // "DRAFT", "PENDING_RAG", "APPROVED"
  label: string                   // "Borrador", "Validando con IA", "Aprobado"
  type: "initial" | "intermediate" | "final" | "error"
  requiresRagValidation: boolean  // Si debe pasar por RAG
  requiresHumanReview: boolean    // Si requiere aprobación humana
  assignableRoles: Role[]         // Roles que pueden ver/editar en este estado
}

interface WorkflowTransition {
  id: string
  fromStateId: string
  toStateId: string
  label: string                   // "Enviar a revisión", "Aprobar", "Rechazar"
  allowedRoles: Role[]            // Quién puede ejecutar esta transición
  conditions?: TransitionCondition[] // Condiciones para poder transicionar
  actions?: TransitionAction[]     // Acciones automáticas al transicionar
}

interface TransitionCondition {
  type: "rag_score" | "field_required" | "custom"
  config: Record<string, any>     // Ej: { minScore: 0.8 }
}

interface TransitionAction {
  type: "notify_user" | "notify_role" | "log_event" | "trigger_webhook"
  config: Record<string, any>
}
```

### Ejemplo: Workflow de Seguros (Gestión Siniestro)

```typescript
const insuranceClaimWorkflow: WorkflowDefinition = {
  id: "insurance-claim-v1",
  tenantId: "insurance-corp",
  vertical: "insurance",
  name: "Gestión de Siniestros",
  version: 1,
  states: [
    {
      id: "draft",
      name: "DRAFT",
      label: "Borrador",
      type: "initial",
      requiresRagValidation: false,
      requiresHumanReview: false,
      assignableRoles: ["CLAIMS_MANAGER"]
    },
    {
      id: "pending_rag",
      name: "PENDING_RAG",
      label: "Validando cobertura con IA",
      type: "intermediate",
      requiresRagValidation: true,
      requiresHumanReview: false,
      assignableRoles: ["CLAIMS_MANAGER"]
    },
    {
      id: "pending_review",
      name: "PENDING_REVIEW",
      label: "Pendiente de revisión humana",
      type: "intermediate",
      requiresRagValidation: false,
      requiresHumanReview: true,
      assignableRoles: ["CLAIMS_MANAGER", "REVIEWER"]
    },
    {
      id: "approved",
      name: "APPROVED",
      label: "Siniestro aprobado",
      type: "final",
      requiresRagValidation: false,
      requiresHumanReview: false,
      assignableRoles: ["CLAIMS_MANAGER"]
    },
    {
      id: "rejected",
      name: "REJECTED",
      label: "Siniestro rechazado",
      type: "final",
      requiresRagValidation: false,
      requiresHumanReview: false,
      assignableRoles: ["CLAIMS_MANAGER"]
    }
  ],
  transitions: [
    {
      id: "draft_to_rag",
      fromStateId: "draft",
      toStateId: "pending_rag",
      label: "Validar con IA",
      allowedRoles: ["CLAIMS_MANAGER"],
      actions: [
        { type: "trigger_webhook", config: { url: "/api/rag/validate-claim" } }
      ]
    },
    {
      id: "rag_to_review",
      fromStateId: "pending_rag",
      toStateId: "pending_review",
      label: "Pasar a revisión",
      allowedRoles: ["CLAIMS_MANAGER"],
      conditions: [
        { type: "rag_score", config: { minScore: 0.7 } }
      ],
      actions: [
        { type: "notify_role", config: { role: "REVIEWER", message: "Nueva reclamación para revisar" } }
      ]
    },
    {
      id: "review_to_approved",
      fromStateId: "pending_review",
      toStateId: "approved",
      label: "Aprobar siniestro",
      allowedRoles: ["REVIEWER", "CLAIMS_MANAGER"]
    },
    {
      id: "review_to_rejected",
      fromStateId: "pending_review",
      toStateId: "rejected",
      label: "Rechazar siniestro",
      allowedRoles: ["REVIEWER", "CLAIMS_MANAGER"]
    }
  ],
  createdAt: new Date(),
  updatedAt: new Date()
}
```

### Instancia de Tarea

```typescript
// Colección: tasks
interface TaskInstance {
  id: string
  tenantId: string
  workflowId: string              // Referencia al workflow
  currentStateId: string          // Estado actual
  title: string                   // "Siniestro #12345 - Robo de vehículo"
  description?: string
  data: Record<string, any>       // Datos específicos del caso
  ragResults?: {
    score: number
    answer: string
    sources: any[]
    validatedAt: Date
  }
  assignedTo?: string             // userId
  assignedRole?: Role             // Role del asignado
  history: TaskHistoryEntry[]     // Trazabilidad completa
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

interface TaskHistoryEntry {
  timestamp: Date
  fromStateId: string
  toStateId: string
  performedBy: string             // userId
  performedByRole: Role
  comment?: string
  ragValidation?: {
    score: number
    answer: string
  }
}
```

---

## 🎨 CUSTOMIZACIÓN POR VERTICAL

### 1. Terminología Dinámica

Cada tenant tiene un diccionario de términos que se reemplaza en la UI:

```typescript
// src/lib/vertical-config.ts

interface VerticalConfig {
  id: string
  tenantId: string
  vertical: "industry" | "legal" | "insurance" | "banking" | "healthcare"
  labels: Record<string, string>
  examples: {
    searchQueries: string[]
    taskTitles: string[]
  }
  colors?: {
    primary: string
    secondary: string
  }
  logo?: string
}

const insuranceConfig: VerticalConfig = {
  id: "config-insurance",
  tenantId: "insurance-corp",
  vertical: "insurance",
  labels: {
    "task": "Siniestro",
    "tasks": "Siniestros",
    "document": "Póliza",
    "documents": "Pólizas",
    "search": "Consultar cobertura",
    "validate": "Validar siniestro",
    "approve": "Aprobar reclamación",
    "reject": "Rechazar reclamación",
    "upload": "Subir documentación",
    "review": "Revisar reclamación"
  },
  examples: {
    searchQueries: [
      "¿Cubre la póliza daños por robo?",
      "¿Qué exclusiones tiene esta póliza?",
      "¿Cuál es el límite de indemnización?"
    ],
    taskTitles: [
      "Siniestro #12345 - Robo de vehículo",
      "Reclamación #98765 - Daños por agua"
    ]
  },
  colors: {
    primary: "#0066CC",
    secondary: "#00A3E0"
  }
}

const industryConfig: VerticalConfig = {
  id: "config-industry",
  tenantId: "acme-corp",
  vertical: "industry",
  labels: {
    "task": "Reporte de Mantenimiento",
    "tasks": "Reportes",
    "document": "Manual Técnico",
    "documents": "Manuales",
    "search": "Consultar procedimiento",
    "validate": "Validar reporte",
    "approve": "Aprobar trabajo",
    "reject": "Rechazar reporte",
    "upload": "Subir manual",
    "review": "Supervisar trabajo"
  },
  examples: {
    searchQueries: [
      "¿Cuál es el torque del motor principal?",
      "Procedimiento de calibración de puertas",
      "¿Qué significa código de error E07?"
    ],
    taskTitles: [
      "Mantenimiento ARCA II - Motor principal",
      "Inspección semestral - Sistema hidráulico"
    ]
  },
  colors: {
    primary: "#FF6B35",
    secondary: "#F7931E"
  }
}
```

### 2. Hook de Customización

```typescript
// src/hooks/useVerticalConfig.ts

export function useVerticalConfig() {
  const { data: session } = useSession()
  const tenantId = session?.user?.tenantId
  
  const [config, setConfig] = useState<VerticalConfig | null>(null)
  
  useEffect(() => {
    if (tenantId) {
      fetch(`/api/tenants/${tenantId}/vertical-config`)
        .then(res => res.json())
        .then(data => setConfig(data.config))
    }
  }, [tenantId])
  
  const t = useCallback((key: string): string => {
    return config?.labels[key] || key
  }, [config])
  
  return { config, t }
}
```

### 3. Uso en Componentes

```typescript
// Antes (estático):
<Button>Subir documento</Button>

// Después (dinámico):
const { t } = useVerticalConfig()
<Button>{t("upload")} {t("document")}</Button>

// Renderiza:
// Industria: "Subir Manual Técnico"
// Seguros: "Subir Póliza"
// Legal: "Subir Contrato"
```

---

## 💾 MODELO DE DATOS EXTENSIBLE

### Colecciones MongoDB

```typescript
// tenants - Configuración del cliente
{
  _id: ObjectId,
  tenantId: string (unique),
  name: string,
  vertical: "industry" | "legal" | "insurance" | "banking" | "healthcare",
  subscription: {
    plan: "base" | "professional" | "enterprise",
    addOns: string[],
    maxUsers: number,
    maxStorageGB: number
  },
  config: {
    verticalConfigId: string,
    workflowIds: string[],
    features: {
      ragSearch: boolean,
      workflows: boolean,
      analytics: boolean,
      whiteLabel: boolean
    }
  },
  billing: {
    stripeCustomerId: string,
    status: "active" | "suspended" | "cancelled"
  },
  createdAt: Date,
  updatedAt: Date
}

// users - Usuarios del sistema
{
  _id: ObjectId,
  tenantId: string,
  email: string (unique),
  firstName: string,
  lastName: string,
  role: Role,
  permissions: string[],
  status: "active" | "inactive",
  lastLogin: Date,
  createdAt: Date
}

// workflows - Definiciones de workflows
{
  _id: ObjectId,
  tenantId: string,
  vertical: string,
  name: string,
  version: number,
  states: WorkflowState[],
  transitions: WorkflowTransition[],
  isActive: boolean,
  createdAt: Date,
  updatedAt: Date
}

// tasks - Instancias de tareas en workflows
{
  _id: ObjectId,
  tenantId: string,
  workflowId: string,
  currentStateId: string,
  title: string,
  description: string,
  data: object, // Datos específicos del caso
  ragResults: {
    score: number,
    answer: string,
    sources: array,
    validatedAt: Date
  },
  assignedTo: string, // userId
  assignedRole: string,
  history: TaskHistoryEntry[],
  createdBy: string,
  createdAt: Date,
  updatedAt: Date
}

// knowledge_assets - Documentos para RAG
{
  _id: ObjectId,
  tenantId: string,
  filename: string,
  originalName: string,
  fileType: string,
  sizeBytes: number,
  cloudinaryUrl: string,
  status: "vigente" | "obsoleto" | "archivado",
  ingestionStatus: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED",
  totalChunks: number,
  metadata: {
    vertical: string,
    documentType: string,
    version: string,
    tags: string[]
  },
  createdAt: Date,
  updatedAt: Date
}

// rag_chunks - Fragmentos vectorizados
{
  _id: ObjectId,
  tenantId: string,
  assetId: string,
  chunkIndex: number,
  text: string,
  embedding: number[], // Vector 1536 dimensiones
  page: number,
  metadata: object,
  createdAt: Date
}

// rag_searches - Historial de búsquedas
{
  _id: ObjectId,
  tenantId: string,
  userId: string,
  query: string,
  results: array,
  answer: string,
  confidence: number,
  feedback: "helpful" | "unhelpful" | null,
  correlationId: string,
  createdAt: Date
}

// vertical_configs - Configuraciones de UI por vertical
{
  _id: ObjectId,
  tenantId: string,
  vertical: string,
  labels: object,
  examples: object,
  colors: object,
  logo: string,
  createdAt: Date,
  updatedAt: Date
}

// usagelogs - Tracking de consumo (billing)
{
  _id: ObjectId,
  tenantId: string,
  userId: string,
  type: "VECTORSEARCH" | "WORKFLOW_EXECUTION" | "DOCUMENT_UPLOAD" | "API_CALL",
  value: number,
  metadata: object,
  timestamp: Date
}
```

---

## 🗺️ ROADMAP DE IMPLEMENTACIÓN

### Fase 1: Foundation (Actual - Mes 1-2)
✅ **Ya implementado en los 6 archivos MD:**
- Multi-tenant básico con tenantId
- RAG Engine con hybrid search
- Sistema de roles con Guardian V2
- Dashboard + Onboarding + Help system
- Testing suite (33 tests)

### Fase 2: Workflow Engine Core (Mes 3-4)

**Tareas:**
1. Crear modelo de datos de workflows
2. Implementar WorkflowEngine service
3. API CRUD workflows (/api/admin/workflows)
4. UI para definir workflows (visual workflow builder)
5. Ejecutor de transiciones con validaciones
6. Sistema de notificaciones (email + in-app)

**Entregables:**
- Workflow builder visual (estilo Zapier/n8n)
- API completa de workflows
- UI de gestión de tareas
- Sistema de asignaciones

### Fase 3: Vertical Configurations (Mes 5-6)

**Tareas:**
1. Modelo de vertical_configs
2. Hook useVerticalConfig con i18n
3. UI para gestión de terminología
4. Sistema de templates por vertical
5. Migración de textos hardcoded a dinámicos
6. Marketplace de workflows pre-hechos

**Entregables:**
- Editor de configuración vertical
- 3 packs verticales listos (Industry, Insurance, Legal)
- Templates de workflows por vertical
- Documentación de customización

### Fase 4: Advanced Features (Mes 7-9)

**Tareas:**
1. Analytics dashboard por tenant
2. Sistema de billing automatizado (Stripe)
3. Exportación de logs para compliance
4. Integraciones externas (Webhooks, APIs)
5. White-label completo
6. Mobile responsive optimization

**Entregables:**
- Analytics con métricas de negocio
- Billing automatizado
- API pública documentada
- White-label configurador

### Fase 5: Scale & Optimize (Mes 10-12)

**Tareas:**
1. Optimización de búsquedas RAG (caching)
2. Escalado horizontal (load balancing)
3. CDN para assets estáticos
4. Monitoreo avanzado (Datadog/New Relic)
5. SLA 99.9% infrastructure
6. Disaster recovery plan

**Entregables:**
- Infraestructura escalable
- Monitoreo 24/7
- Backup automatizado
- Documentación completa

---

## 📊 MÉTRICAS DE ÉXITO

### KPIs por Vertical

| Vertical | Métrica Clave | Target |
|----------|--------------|--------|
| Industria | Tiempo medio de resolución de reporte | -40% |
| Seguros | Tasa de aprobación automática (RAG > 0.9) | >60% |
| Legal | Tasa de error en contratos detectados | <5% |
| Banca | Operaciones validadas por hora | +200% |
| Sanidad | Adherencia a protocolos | >95% |

### KPIs Plataforma

- **Precisión RAG**: >85% de respuestas útiles (feedback)
- **Tiempo de respuesta RAG**: <3s p95
- **Uptime**: >99.5%
- **Adopción usuarios**: >70% usuarios activos semanalmente
- **NPS**: >50

---

## 🚀 PRÓXIMOS PASOS INMEDIATOS

1. **Validar arquitectura** con stakeholders
2. **Priorizar verticales** (empezar con 1-2)
3. **Definir workflows** de los 2 verticales iniciales
4. **Crear mockups** de UI vertical-specific
5. **Estimar costes** de infraestructura escalable
6. **Establecer pricing** por vertical
7. **Iniciar Fase 2** (Workflow Engine)

---

## 💡 CONCLUSIÓN

Esta arquitectura te permite:

✅ **Escalabilidad horizontal**: Añadir verticales sin reescribir core  
✅ **Time-to-market rápido**: Workflows configurables, no código custom  
✅ **Monetización flexible**: Base + add-ons verticales  
✅ **Retención alta**: Cada vertical "pegajoso" por workflows específicos  
✅ **Expansión internacional**: i18n + vertical configs  
✅ **Compliance**: Logs auditables, GDPR-ready  

**El código actual (6 archivos MD) es la base sólida. Ahora toca construir el Workflow Engine encima.**
