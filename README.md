# ABD Multi-Industry RAG Platform (Vision 2.0)

Sistema RAG (Retrieval-Augmented Generation) genérico y multi-tenant diseñado para análisis de documentos técnicos, legales e industriales. Evolucionado desde el prototipo ABDElevators hacia una solución SaaS horizontal.

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

5. **Iniciar servidor de desarrollo**
```bash
npm run dev
```

## 👥 Usuarios de Prueba

| Email | Password | Rol | Permisos |
|-------|----------|-----|----------|
| admin@abd.com | admin123 | ADMIN | Acceso completo |
| tecnico@abd.com | tecnico123 | TECNICO | Portal técnico |
| ingenieria@abd.com | ingenieria123 | INGENIERIA | Solo lectura |

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── (admin)/          # Panel administrativo
│   ├── (tecnico)/        # Portal técnico
│   ├── api/              # API routes
│   └── login/            # Autenticación
├── components/
│   ├── admin/            # Componentes admin
│   ├── tecnico/          # Componentes técnicos
│   └── shared/           # Componentes compartidos
└── lib/
    ├── auth.ts           # NextAuth config
    ├── db.ts             # MongoDB connection
    ├── llm.ts            # Gemini integration
    ├── rag-service.ts    # Vector search
    └── pdf-export.ts     # PDF generation
```

## 🔧 Scripts Disponibles

```bash
npm run dev          # Servidor desarrollo
npm run build        # Build producción
npm run start        # Servidor producción
npm run seed-users   # Crear usuarios prueba
npm run lint         # Linter
```

## 🌐 Deployment en Vercel

1. Conectar repositorio en Vercel
2. Configurar variables de entorno
3. Deploy automático en cada push a `main`

## 📊 Características

- ✅ Autenticación con NextAuth.js v5
- ✅ Control de acceso basado en roles
- ✅ Upload y procesamiento de PDFs
- ✅ Análisis con Gemini 2.0 Flash
- ✅ Búsqueda vectorial (MongoDB Atlas)
- ✅ Exportación de informes a PDF
- ✅ Dashboard de auditoría
- ✅ Trazabilidad completa (correlacion_id)

## 📝 Licencia

Propietario - ABDElevators © 2026
