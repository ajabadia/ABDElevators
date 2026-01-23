# ABD Multi-Industry RAG Platform (Vision 2.0)

Sistema RAG (Retrieval-Augmented Generation) genérico y multi-tenant diseñado para análisis de documentos técnicos, legales e industriales. Evolucionado desde el prototipo ABD RAG Plataform hacia una solución SaaS horizontal.

## 🚀 Inicio Rápido

### Windows
```bash
start_app.bat
```

### Linux/Mac
```bash
npm run dev
```

## 📋 Requisitos Previos

- Node.js 18+ 
- MongoDB Atlas (cuenta gratuita)
- Google AI Studio API Key (Gemini)

## ⚙️ Configuración

1. **Clonar el repositorio**
```bash
git clone https://github.com/ajabadia/ABDElevators.git
cd ABDElevators
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**

Crear archivo `.env.local`:
```env
# Database
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/ABDElevators

# AI
GEMINI_API_KEY=AIzaSy...

# Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=genera_con_openssl_rand_base64_32

# Cloudinary (para almacenar PDFs)
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

4. **Crear usuarios iniciales**
```bash
npm run seed-users
```

56. **Crear usuario raíz (SuperAdmin)**
```bash
npm run create-super-admin
```

7. **Iniciar servidor de desarrollo**
```bash
npm run dev
```

## 👥 Usuarios de Prueba

| Email | Password | Rol | Permisos |
|-------|----------|-----|----------|
| superadmin@abd.com | super123 | SUPER_ADMIN | **Acceso Total:** Gobierno global y multinivel |
| admin@abd.com | admin123 | ADMIN | **Tenant Admin:** Gestión de usuarios y documentos |
| tecnico@abd.com | tecnico123 | TECNICO | **Técnico:** Portal de validación y workflow |
| ingenieria@abd.com | ingenieria123 | INGENIERIA | **Consulta:** Solo lectura documentos técnicos |

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── (authenticated)/         # Rutas protegidas por NextAuth
│   │   ├── (admin)/             # Panel administrativo global
│   │   └── pedidos/             # Portal técnico y validación
│   ├── api/                     # API routes (Workflow, RAG, Soporte)
│   └── login/                   # Autenticación
├── components/
│   ├── workflow/                # Motor de estados y transiciones
│   ├── tecnico/                 # Validadores y checklists
│   └── shared/                  # Header, Sidebar, Notificaciones
└── lib/
    ├── workflow-engine.ts       # Lógica de transiciones de estado
    ├── notification-service.ts  # Alertas In-App y Email (Resend)
    ├── contact-service.ts       # Sistema de soporte técnico
    ├── auth.ts                  # NextAuth v5 config
    └── db-tenant.ts             # Aislamiento sagrado de datos
```

## 🔧 Scripts Disponibles

```bash
npm run dev                  # Servidor desarrollo
npm run build                # Build producción
npm run create-super-admin   # Crear usuario raíz global (Fase 10)
npm run seed-users           # Crear usuarios de prueba por defecto
npm run seed-workflows       # Inicializar workflows estándar
npm run seed-notifications   # Cargar notificaciones de ejemplo
npm run test                 # Ejecutar tests unitarios (Jest)
```

## 🌐 Deployment en Vercel

1. Conectar repositorio en Vercel
2. Configurar variables de entorno (incluir `RESEND_API_KEY` para emails)
3. Deploy automático en cada push a `main`

## 📊 Características (Visión 2.0)

- ✅ **Motor de Workflows:** Estados y transiciones dinámicas configurables por el Admin.
- ✅ **Notificaciones Hub:** Sistema push in-app con campana animada y correos transaccionales.
- ✅ **Soporte Técnico:** Módulo de contacto directo de técnicos con administración.
- ✅ **Ingeniería de Prompts:** Editor en vivo para ajustar el comportamiento de los modelos Gemini.
- ✅ **Aislamiento Multi-tenant:** Los datos y flujos están segmentados por TenantId.
- ✅ **Hardening de Seguridad:** Middleware avanzado con protección de APIs y rate limiting.
- ✅ **Trazabilidad Total:** Audit trail completo con `correlacion_id` y firma digital.
- ✅ **RAG Avanzado:** Búsqueda vectorial con MongoDB Atlas y Gemini 2.0 Flash.

## 📝 Licencia

Propietario - ABD RAG Plataform © 2026
