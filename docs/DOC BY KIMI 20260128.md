# Documentación Técnica - ABD RAG Platform

## 1. Visión General

**ABD RAG Platform** es una plataforma enterprise de IA generativa especializada en análisis técnico, mantenimiento preventivo y gestión documental industrial. Utiliza arquitectura RAG (Retrieval Augmented Generation) con Gemini 2.0 para procesar documentación técnica y pedidos de ingeniería.

### Stack Tecnológico Principal

| Capa | Tecnología |
|------|------------|
| **Framework** | Next.js 16 (App Router), React 19 |
| **Lenguaje** | TypeScript (Strict Mode) |
| **Estilos** | TailwindCSS + Shadcn/ui + Framer Motion |
| **Base de Datos** | MongoDB Atlas (Vector Search) |
| **AI/ML** | Gemini 2.0 Flash, LangChain, Embeddings |
| **Autenticación** | NextAuth.js v5 (Auth.js) |
| **Almacenamiento** | Cloudinary (PDFs/Imágenes), AWS S3 (opcional) |
| **Pagos** | Stripe (Billing) |
| **Internacionalización** | next-intl |

---

## 2. Arquitectura del Sistema

### 2.1 Estructura de Carpetas
src/
├── middleware.ts                 # Seguridad, rate limiting, routing
├── app/
│   ├── (authenticated)/          # Grupo rutas protegidas
│   │   ├── (admin)/admin/        # Panel administración
│   │   ├── (tecnico)/pedidos/    # Vista técnica/análisis
│   │   ├── soporte/              # Tickets de soporte
│   │   ├── perfil/               # Configuración usuario
│   │   └── layout.tsx            # Layout autenticado
│   ├── api/                      # API Routes (REST)
│   ├── page.tsx                  # Landing page
│   └── globals.css               # Variables CSS/design tokens
├── components/
│   ├── ui/                       # Shadcn/ui components
│   ├── admin/                    # Componentes admin específicos
│   ├── landing/                  # Secciones landing page
│   └── shared/                   # Navbar, Footer, Layouts
├── lib/                          # Servicios y utilidades
│   ├── auth.ts                   # Configuración Auth.js
│   ├── db.ts                     # Conexiones MongoDB
│   ├── schemas.ts                # Validaciones Zod
│   └── *.service.ts              # Lógica de negocio
└── hooks/                        # Hooks personalizados (React Query)
Copy

### 2.2 Patrones Arquitectónicos

- **Multi-Tenancy**: Aislamiento de datos por `tenantId` en todas las colecciones
- **Hybrid Rendering**: Server Components por defecto, Client Components para interacción
- **API Layer**: Route Handlers con validación Zod y manejo centralizado de errores (`AppError`)
- **Service Layer**: Lógica de negocio desacoplada (BillingService, PromptService, etc.)

---

## 3. Sistema de Autenticación y Seguridad

### 3.1 Roles y Permisos

| Rol | Descripción | Acceso |
|-----|-------------|--------|
| `SUPER_ADMIN` | Control total de la plataforma | Todos los tenants/configuraciones |
| `ADMIN` | Administrador de organización | Su tenant + gestión usuarios |
| `TECNICO` | Usuario operativo | Pedidos, búsquedas, documentos |
| `INGENIERIA` | Solo lectura documentación | Sección documentos (read-only) |

### 3.2 Middleware (`middleware.ts`)

Funcionalidades implementadas:
- **Rate Limiting**: 10,000 req/hora (admin), 50,000 req/hora (superadmin), 10 req/min para MFA
- **Protección de Rutas**: Redirección automática a `/login` si no hay sesión
- **Control de Acceso Basado en Roles (RBAC)**:
  - INGENIERIA: Solo GET en `/admin/documentos`
  - TECNICO: Sin acceso a `/admin/*`
- **Headers de Seguridad**: HSTS, X-Content-Type-Options, X-Frame-Options, UUID de correlación

---

## 4. Módulos Funcionales

### 4.1 Gestión Documental (RAG)

**Flujo de Ingesta**:
1. Upload PDF → Cloudinary (folder por tenant)
2. Extracción texto (OCR/PDF parsing)
3. Chunking semántico (~500 tokens)
4. Generación embeddings (Gemini + BGE-M3 local)
5. Indexación MongoDB Atlas Vector Search
6. **Dual-Indexing**: Traducción automática para documentos extranjeros (shadow chunks)

**Entidades Principales**:
- `documentos_tecnicos`: Metadatos del documento
- `document_chunks`: Fragmentos vectorizados con embeddings
- `tipos_documento`: Taxonomía configurable por tenant

### 4.2 Análisis de Pedidos (Core Business)

**Proceso**:
1. Upload PDF del pedido técnico
2. Extracción de modelos/componentes mediante Gemini
3. Búsqueda RAG de documentación relacionada
4. Detección de riesgos (RiskService)
5. Generación de checklist dinámico
6. Guardado como `pedido` + `generic_case` (abstracción)

**Estados del Pedido**:
`ingresado` → `analizado` → `en_revision` → `completado`

### 4.3 Motor de Workflows

- Definición de estados personalizables por tenant
- Transiciones validadas por reglas de negocio
- Visualización gráfica del flujo (WorkflowStatusBar)
- Histórico de transiciones

### 4.4 Sistema de Facturación (Billing)

**Planes Soportados**:
- FREE, STANDARD, PRO, ENTERPRISE, ULTRA
- Métricas: Reports, Tokens, Storage, API Calls, Vector Searches

**Funcionalidades**:
- Lógica de overage (recargos por exceso)
- Stripe Checkout/Portal integration
- Webhooks para sincronización de estado
- Lógica de prorrateo al cambiar de plan

### 4.5 Sistema de Notificaciones

**Canales**: Email (SendGrid/AWS SES), In-App, Push
**Tipos**: SYSTEM, BILLING_EVENT, RISK_ALERT, ANALYSIS_COMPLETE
**Plantillas**: Configurables por tenant en múltiples idiomas
**Histórico**: Auditoría completa de envíos y errores

### 4.6 Soporte y Tickets

- Creación de tickets con categorización (TECHNICAL, BILLING, ACCESS)
- Sistema de mensajería conversacional
- Escalado automático por prioridad (LOW → CRITICAL)
- SLA tracking

---

## 5. API Reference (Endpoints Principales)

### Administración
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/admin/global-stats` | GET | Métricas globales (SuperAdmin) |
| `/api/admin/documentos` | GET | Listado corpus técnico |
| `/api/admin/ingest` | POST | Ingesta de documentos RAG |
| `/api/admin/usuarios` | GET/POST | Gestión de usuarios |
| `/api/admin/tenants` | GET/POST | Configuración multi-tenant |
| `/api/admin/prompts` | GET/POST | Motor de prompts dinámicos |
| `/api/admin/workflows` | GET/POST | Definición de flujos de trabajo |
| `/api/admin/billing/*` | - | Facturación y planes |

### Técnico/Operativo
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/tecnico/pedidos/analyze` | POST | Análisis RAG de pedidos |
| `/api/tecnico/rag/chat` | POST | Chat agentic con contexto |
| `/api/casos` | GET/POST | Gestión de casos genéricos |

### Autenticación
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/auth/perfil` | GET/PATCH | Datos usuario |
| `/api/auth/mfa/*` | - | Configuración MFA |
| `/api/auth/documentos` | GET/POST | Documentos personales |
| `/api/auth/cambiar-password` | POST | Cambio de contraseña |

### Webhooks
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/webhooks/stripe` | POST | Eventos de pago |

---

## 6. Modelos de Datos (Schemas Zod)

### Usuario
```typescript
{
  email: string (unique)
  password: string (bcrypt)
  nombre, apellidos, puesto: string
  rol: "SUPER_ADMIN" | "ADMIN" | "TECNICO" | "INGENIERIA"
  tenantId: string
  activeModules: string[]
  mfaEnabled?: boolean
  notificationPreferences: Object
}
Documento Técnico
TypeScript
Copy
{
  tenantId: string
  nombre_archivo: string
  tipo_componente: string
  modelo: string
  version: string
  estado: "vigente" | "obsoleto" | "borrador" | "archivado"
  cloudinary_public_id: string
  archivo_md5: string  // Para deduplicación
  total_chunks: number
  language: string     // Detección automática
}
Pedido (Caso Técnico)
TypeScript
Copy
{
  numero_pedido: string
  tenantId: string
  nombre_archivo: string
  pdf_texto: string
  modelos_detectados: Array<{tipo, modelo}>
  estado: string
  metadata: {
    risks: Array[]
    checklistItems: Array[]
  }
  archivo_md5: string
}
7. Características Técnicas Avanzadas
7.1 Seguridad
Hash MD5 para deduplicación de archivos (ahorro de tokens)
Validación Zod en todas las entradas de API
SQL/NoSQL Injection protection mediante consultas parametrizadas
CORS configurado por entorno
Sanitización de outputs HTML
7.2 Performance
Rate Limiting distribuido (Redis/Upstash)
Lazy loading de componentes pesados (AgentTraceViewer)
Batched inserts para chunks (batch size: 10)
Prefetching excluido del rate limiting
SLA Monitoring: Logs automáticos si >500ms/1000ms/2000ms según endpoint
7.3 Observabilidad
Correlation IDs: UUID v4 en todas las operaciones
Structured Logging: Niveles (ERROR, WARN, INFO, DEBUG)
Audit Trail: Colección logs_aplicacion con stack traces
Performance Metrics: Tracking de embeddings, tokens, storage
7.4 Internacionalización (i18n)
Soporte multi-idioma mediante next-intl
Detección automática de idioma en documentos
Traducción técnica de shadow chunks (alemán/español)
8. Configuración y Variables de Entorno
Requeridas
env
Copy
# Base de datos
MONGODB_URI=mongodb+srv://...
MONGODB_LOGS_URI=...

# Auth
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# AI
GOOGLE_API_KEY=      # Gemini
OPENAI_API_KEY=      # Fallback/ChatGPT

# Stripe (Billing)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_PRO_MONTHLY=
STRIPE_PRICE_ENTERPRISE_MONTHLY=

# Email (SendGrid/AWS)
EMAIL_SERVER_HOST=
EMAIL_FROM=
Opcionales
env
Copy
# Storage alternativo
AWS_S3_BUCKET=
AWS_REGION=

# Features flags
ENABLE_MFA=true
ENABLE_BILLING=true
9. Guía de Desarrollo
Comandos Útiles
bash
Copy
# Instalación
npm install

# Desarrollo
npm run dev

# Producción
npm run build
npm start

# Linting
npm run lint
Convenciones de Código
TypeScript: Strict mode activado
Imports: Usar @/ alias para rutas absolutas
Errores: Siempre usar AppError con códigos estandarizados
Logging: Usar logEvento con correlación_id en todas las operaciones críticas
DB: Usar getTenantCollection() para queries blindadas por tenant
Testing Sugerido
Validar aislamiento multi-tenant (no ver datos de otros tenants)
Probar rate limiting (429 responses)
Verificar deduplicación MD5 en ingestas
Test de flujo completo: Pedido → Análisis → Reporte
10. Roadmap y Estado Actual
Fases Completadas (según comentarios en código):
✅ Fase 7.2: Motor de Workflows
✅ Fase 7.5: Sistema de Auditoría Avanzado
✅ Fase 7.6: Gestión Dinámica de Prompts
✅ Fase 9.2: Facturación SaaS
✅ Fase 10: Plataforma Governance (Contactos, Notificaciones)
✅ Fase 11.1: Seguridad (Invitaciones)
✅ Fase 21.1: Detección de Idioma
✅ Fase 23: Notification Hub
✅ Fase 24.2: ROI Dashboards y User Insights
En Desarrollo:
🔧 AWS S3 Integration (placeholder presente)
🔧 Custom Agents ( mencionado en feature flags)