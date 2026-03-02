# 🚀 Developer Onboarding Guide — ABD RAG Platform (ERA 9)

> **Para:** Nuevos desarrolladores | **Tiempo estimado:** 2-3 horas | **Actualizado:** 2026-03-02

## 1. Prerrequisitos

```bash
# Software requerido
Node.js 20.x LTS          # Runtime
Python 3.10+              # PyMuPDF Bridge (extracción de PDFs)
Git                       # Control de versiones
MongoDB Atlas Account     # Base de datos (solicitar acceso al lead)
Google AI Studio Key      # API de Gemini (solicitar al lead)
```

## 2. Setup Inicial

```bash
# 1. Clonar y entrar
git clone https://github.com/ajabadia/ABDElevators.git
cd ABDElevators

# 2. Instalar dependencias (incluye paquetes del monorepo)
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con las credenciales proporcionadas por el equipo

# 4. Inicializar datos base
npm run seed-users           # Usuarios de prueba
npm run seed-prompts         # Prompts maestros del sistema
npm run seed-workflows       # Workflows estándar
npm run create-super-admin   # Usuario SuperAdmin
npm run ensure-indexes       # Índices de MongoDB

# 5. Arrancar el servidor de desarrollo
npm run dev
# → http://localhost:3000
```

## 3. Usuarios de Prueba

| Email | Password | Rol | Acceso |
|-------|----------|-----|--------|
| `superadmin@abd.com` | `super123` | SUPER_ADMIN | Control total |
| `admin@abd.com` | `super123` | ADMIN | Platform admin |
| `admin@elevadores.mx` | `super123` | ADMIN | Tenant Elevadores |
| `tecnico@elevadores.mx` | `tecnico123` | TECHNICAL | Validación técnica |
| `ingenieria@elevadores.mx` | `ingenieria123` | ENGINEERING | Consulta y análisis |

## 4. Estructura del Proyecto (Resumen)

```
packages/                 ← Monorepo packages (importar con @abd/*)
  platform-core/          ← Auth, DB, Logger, Errors
  rag-engine/             ← Ingesta, Chunking, Retrieval
  workflow-engine/        ← FSM, Tasks, Cases

src/
  app/api/                ← 128 API endpoints (Route Handlers)
  app/(portal)/           ← Páginas de usuario final
  app/(admin)/            ← Panel de administración
  core/                   ← Motor agéntico, Guardian, Ontología
  services/               ← 16 módulos de servicio
  components/             ← UI Components (Shadcn + Custom)
  lib/                    ← Bridges a platform-core + utilities
  hooks/                  ← React 19 hooks
  verticals/              ← Extensiones de industria

messages/                 ← Traducciones (es/, en/)
tests/                    ← Tests unitarios e integración
Documentación/            ← Documentación de proyecto
```

## 5. Flujo de Desarrollo

### 5.1 Crear un nuevo endpoint API

```typescript
// src/app/api/mi-recurso/route.ts
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextResponse } from 'next/server';
import { enforcePermission } from '@/lib/guardian-guard';
import { handleApiError } from '@/lib/errors';
import { z } from 'zod';

// 1. Schema Zod
const InputSchema = z.object({
  nombre: z.string().min(1),
});

async function GET_internal(request: Request) {
  const correlationId = globalThis.crypto.randomUUID();
  try {
    // 2. Auth + ABAC
    const session = await enforcePermission('mi-recurso', 'read');

    // 3. Acceder a datos con tenant isolation
    const { getTenantCollection } = await import('@/lib/db-tenant');
    const collection = await getTenantCollection('mi_coleccion', session);
    const data = await collection.find({});

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return handleApiError(error, 'API_MI_RECURSO', correlationId);
  }
}

// 4. Wrap con SLA monitoring
export const GET = withPerformanceSLA(GET_internal, {
  endpoint: 'GET /api/mi-recurso',
  thresholdMs: 500,
});
```

### 5.2 Crear un componente UI

```tsx
// src/components/mi-componente/MiComponente.tsx
"use client";

import { useTranslations } from 'next-intl';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';

interface MiComponenteProps {
  titulo: string;
}

export function MiComponente({ titulo }: MiComponenteProps) {
  const t = useTranslations('common');

  return (
    <Card>
      <CardHeader>
        <CardTitle>{titulo}</CardTitle>
      </CardHeader>
    </Card>
  );
}
```

### 5.3 Añadir traducciones

1. Añadir clave en `messages/es/common.json`
2. Añadir clave equivalente en `messages/en/common.json`
3. Usar con `useTranslations('namespace')` en componentes client
4. Usar `getTranslations('namespace')` en Server Components

## 6. Reglas Críticas (No Negociables)

| # | Regla | Consecuencia de Violación |
|---|-------|--------------------------|
| 1 | **TypeScript Strict** `strict: true` — No `: any` en services/lib | PR rechazado |
| 2 | **Zod Validation** — Todo input validado ANTES de procesamiento | PR rechazado |
| 3 | **AppError** — Nunca `throw Error()` genérico | PR rechazado |
| 4 | **Structured Logging** — `await logEvento({...})` con `correlationId` | PR rechazado |
| 5 | **No Browser Storage** — No `localStorage`, `sessionStorage`, `cookies` | PR rechazado |
| 6 | **Dual Validation** — Cliente + Servidor con Zod | PR rechazado |
| 7 | **DB Transactions** — Múltiples ops = `session.withTransaction()` | PR rechazado |
| 8 | **Performance SLA** — Medir tiempo en endpoints, log si > threshold | PR rechazado |
| 9 | **Security Headers** — Middleware agrega X-Content-Type-Options, etc. | PR rechazado |
| 10 | **Accessibility** — Roles semánticos, ARIA, contraste WCAG AA | Deuda técnica |
| 11 | **SecureCollection** — Toda DB op via `getTenantCollection()` | PR rechazado |
| 12 | **Prompt Governance** — Prompts en DB via `PromptService` | Deuda técnica |
| 13 | **Data Protection** — PII cifrada con `SecurityService.encrypt()` | Violación GDPR |

## 7. Comandos Útiles

```bash
npm run dev              # Dev server (Turbopack)
npm run build            # Production build
npm test                 # Suite de tests
npm run seed-users       # Reset usuarios de prueba
npm run seed-prompts     # Sincronizar prompts
npm run ensure-indexes   # Reparar índices DB
```

## 8. Checklist de Primer PR

- [ ] ¿Tiene schema Zod para inputs?
- [ ] ¿Usa `enforcePermission` en el endpoint?
- [ ] ¿Pasa `session` a `getTenantCollection`?
- [ ] ¿Usa `AppError` en catches (no `Error()`)?
- [ ] ¿Tiene `logEvento()` con `correlationId`?
- [ ] ¿Mide performance si es API?
- [ ] ¿Tiene traducciones en ES y EN?
- [ ] ¿No usa `: any` en lib/services?
- [ ] ¿No usa `localStorage`/`sessionStorage`?
- [ ] ¿Pruebas unitarias para lógica crítica?

## 9. Recursos Clave

| Documento | Ubicación |
|-----------|-----------|
| Arquitectura ERA 9 | `Documentación/ARCHITECTURE_ERA9.md` |
| Roadmap Master | `ROADMAP_MASTER.md` |
| Mapa de Rutas | `map.md` |
| Matriz de Permisos | `docs/permissions-matrix.md` |
| Reglas del Proyecto | `.agent/rules.md` |
| Guía de Estilo | `Documentación/STYLE_GUIDE.md` |
| Convenciones de Código | `Documentación/CODING_CONVENTIONS_ERA9.md` |
