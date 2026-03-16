
## 🎯 OBJETIVO

Este documento es tu **prompt de sistema** para pasar a Cursor, Antigrávity, o Claude cuando generes código para el proyecto RAG Ascensores.

---

## 📋 INSTRUCCIONES DE SISTEMA

### CONTEXTO DEL PROYECTO

**Proyecto:** Sistema RAG para análisis de especificaciones de pedidos de ascensores.

**Stack:**
- Frontend: Next.js 16 + React 19 + TypeScript strict
- Backend: Next.js API Routes (Route Handlers)
- Tooling: Turbopack (Build & Dev)
- DB: MongoDB Atlas
- AI/ML: Gemini API (LLM + embeddings)
- Hosting: Vercel
- UI: Tailwind CSS 4 + Shadcn UI

---

## ⚡ REGLAS NO NEGOCIABLES

### 20. Mandatory PNPM (NEW ERA 15)

```
REGLA: Prohibido usar `npm` o `yarn`. OBLIGATORIO usar `pnpm`.

RAZÓN: El proyecto usa monorepo con protocolos `workspace:` que fallan en `npm`. 
Además, `pnpm` garantiza consistencia en la resolución de dependencias peer (especialmente con React 19).

SI ROMPES: Fallo en instalación de dependencias y posible corrupción del lockfile.
```

### 1. TypeScript Strict Mode (ERA 8 Scoped)

```
REGLA: tsconfig.json DEBE tener "strict": true.
❌ Prohibido `: any` en: core schemas, exported lib/services, API responses.
```

### 2. Zod Validation BEFORE Processing

```
REGLA: Todos los inputs (form, query, body, file) se validan con Zod ANTES.
```

### 3. AppError para Todo Error

```
REGLA: Nunca throw Error() genérico. Siempre AppError o subclass.
```

### 4. Structured Logging

```
RULE: Every significant event must be logged with a consistent structure.
MANDATORY: await logEvento({ ... })
```

### 11. Multi-tenant Harmony

```
REGLA: Toda operación de DB debe realizarse a través de SecureCollection/getTenantCollection.
```

### 19. Zero Spanish in the Data Layer

```
REGLA: Prohibido usar términos en castellano en la capa de datos (Keys, enums, status).
```

---

## 🚫 RED FLAGS (RECHAZAMOS AUTOMÁTICO)

❌ `npm install ...` (Rechazo inmediato, usar `pnpm add ...`)
❌ `const x: any = ...`
❌ `console.log` en producción
❌ Operaciones DB sin `tenantId` (Aislamiento)
❌ Uso de términos en castellano en DB
