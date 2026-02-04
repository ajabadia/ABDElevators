# 🚀 SETUP COMPLETO: GUÍA DE IMPLEMENTACIÓN

**Archivo:** `SETUP_IMPLEMENTATION.md`

---

## 📋 ÍNDICE

1. [Requisitos Previos](#requisitos-previos)
2. [Estructura de Carpetas](#estructura-de-carpetas)
3. [Fase 1: Configuración de Testing](#fase-1-configuración-de-testing)
4. [Fase 2: Backend APIs](#fase-2-backend-apis)
5. [Fase 3: Hooks y Componentes](#fase-3-hooks-y-componentes)
6. [Fase 4: Dashboard Completo](#fase-4-dashboard-completo)
7. [Fase 5: Verificación y Testing](#fase-5-verificación-y-testing)
8. [Troubleshooting](#troubleshooting)

---

## ✅ Requisitos Previos

### Tecnologías Necesarias
```
Node.js 18+
npm 9+
Next.js 14+
TypeScript 5+
MongoDB (conectada)
NextAuth.js 4+
Gemini API key
```

### Dependencias Instaladas
```bash
npm list | grep -E "(react|next-auth|sonner|lucide|zod)"
```

Resultado esperado:
```
├── next@14.x
├── react@18.x
├── next-auth@4.x
├── sonner@1.x
├── lucide-react@latest
└── zod@3.x
```

---

## 📁 Estructura de Carpetas

### Crear estructura completa

```bash
# Ejecutar en raíz del proyecto
mkdir -p src/__tests__/integration
mkdir -p src/__tests__/hooks
mkdir -p src/__tests__/api
mkdir -p src/app/api/user/{dashboard,search,documents,feedback}
mkdir -p src/app/authenticated/{dashboard,buscar,mis-documentos,historial}
mkdir -p src/hooks
mkdir -p src/components/ui
mkdir -p src/services
mkdir -p src/lib
```

### Verificar estructura

```bash
tree -I 'node_modules' -L 3 src/
```

Estructura esperada:
```
src/
├── __tests__/
│   ├── api/
│   ├── hooks/
│   ├── integration/
│   └── setup.ts
├── app/
│   ├── api/
│   │   └── user/
│   │       ├── dashboard/
│   │       ├── search/
│   │       ├── documents/
│   │       └── feedback/
│   └── authenticated/
│       ├── dashboard/
│       ├── buscar/
│       ├── mis-documentos/
│       └── historial/
├── components/
│   └── ui/
├── hooks/
├── lib/
└── services/
```

---

## 🧪 FASE 1: Configuración de Testing

### 1.1 Instalar dependencias

```bash
npm install --save-dev \
  jest \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  jest-environment-jsdom \
  ts-jest \
  @types/jest

# Verificar instalación
npm list jest @testing-library/react
```

### 1.2 Copiar configuración

**De archivo `05_testing_suite.md`, copiar:**

```bash
# 1. jest.config.js → raíz del proyecto
cp 05_testing_suite.md jest.config.js

# 2. src/__tests__/setup.ts
mkdir -p src/__tests__
# Copiar contenido de setup.ts del archivo 05
```

### 1.3 Configurar package.json

```bash
# Abrir package.json y reemplazar/añadir en "scripts":
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:integration": "jest --testPathPattern=integration",
    "test:hooks": "jest --testPathPattern=hooks",
    "test:api": "jest --testPathPattern=api"
  }
}
```

### 1.4 Verificar setup

```bash
npm test -- --version

# Output esperado:
# Jest version: 29.x
```

---

## 🔌 FASE 2: Backend APIs

### 2.1 Crear endpoint Search

**Archivo:** `src/app/api/user/search/route.ts`

Copiar contenido completo de `01_API_USER_SEARCH_ROUTE.md`

```bash
mkdir -p src/app/api/user/search
# Copiar contenido typescript del archivo 01
```

### 2.2 Crear endpoint Dashboard

**Archivo:** `src/app/api/user/dashboard/route.ts`

Copiar desde `04_dashboard_integration_complete.md` (sección "Archivos Complementarios")

```bash
mkdir -p src/app/api/user/dashboard
# Copiar endpoint GET /api/user/dashboard
```

### 2.3 Verificar imports necesarios

Validar que existan estos servicios/libs:

```typescript
// ✅ Verificar que existen:
- @/lib/auth (NextAuth)
- @/lib/guardian-guard (enforcePermission)
- @/services/rag-service (RagService.hybridSearch)
- @/lib/usage-service (UsageService.trackUsage)
- @/lib/errors (AppError, handleApiError)
- @/lib/logger (logEvento)
- @/lib/gemini-client (getGenAI)
- @/lib/db (connectDB)
```

Si falta alguno, crear:

```bash
# Crear stubs para servicios faltantes
touch src/services/rag-service.ts
touch src/lib/usage-service.ts
touch src/lib/gemini-client.ts
```

### 2.4 Testear endpoints

```bash
# Test unitarios
npm run test:api

# Output esperado:
# PASS src/__tests__/api/search.test.ts
#   ✓ debería rechazar sin autenticación
#   ✓ debería buscar documentos correctamente
```

---

## 🪝 FASE 3: Hooks y Componentes

### 3.1 Crear hooks

**Archivo 1:** `src/hooks/useOnboarding.ts`

Copiar de `02_onboarding_hook.md` (sección useOnboarding hook)

```bash
mkdir -p src/hooks
# Copiar código typescript
```

**Archivo 2:** `src/hooks/useContextualHelp.ts`

Copiar de `03_contextual_help.md` (sección useContextualHelp hook)

```bash
# Copiar código typescript
```

**Archivo 3:** `src/hooks/useLocalStorage.ts`

Copiar de `04_dashboard_integration_complete.md` (sección complementaria)

```bash
# Copiar código typescript
```

### 3.2 Crear componentes Onboarding

**Archivo 1:** `src/components/ui/onboarding-overlay.tsx`

Copiar de `02_onboarding_hook.md` (sección OnboardingOverlay)

```bash
mkdir -p src/components/ui
# Copiar código typescript
```

**Archivo 2:** `src/components/onboarding-provider.tsx`

Copiar de `02_onboarding_hook.md` (sección OnboardingProvider)

```bash
mkdir -p src/components
# Copiar código typescript
```

### 3.3 Crear componentes Help

**Archivo 1:** `src/components/ui/help-tooltip.tsx`

Copiar de `03_contextual_help.md`

```bash
# Copiar código typescript
```

**Archivo 2:** `src/components/ui/help-button.tsx`

Copiar de `03_contextual_help.md`

```bash
# Copiar código typescript
```

**Archivo 3:** `src/components/ui/inline-help-panel.tsx`

Copiar de `03_contextual_help.md`

```bash
# Copiar código typescript
```

### 3.4 Verificar imports

```bash
npm run lint

# Debería no tener errores de import
```

### 3.5 Testear hooks

```bash
npm run test:hooks

# Output esperado:
# PASS src/__tests__/hooks/useOnboarding.test.ts
# PASS src/__tests__/hooks/useContextualHelp.test.ts
#   ✓ debería inicializar correctamente
#   ✓ debería navegar entre pasos
#   ...
```

---

## 📊 FASE 4: Dashboard Completo

### 4.1 Reemplazar dashboard

**Archivo:** `src/app/authenticated/dashboard/page.tsx`

Copiar contenido completo de `04_dashboard_integration_complete.md`

```bash
# Crear página
mkdir -p src/app/authenticated/dashboard

# Copiar código typescript - ASEGURAR QUE INCLUYA:
# - Importes de componentes help
# - data-tour attributes
# - OnboardingProvider en layout
```

### 4.2 Actualizar layout

**Archivo:** `src/app/authenticated/layout.tsx`

```typescript
import { OnboardingProvider } from "@/components/onboarding-provider"

export default function AuthenticatedLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <OnboardingProvider>
      {children}
    </OnboardingProvider>
  )
}
```

### 4.3 Crear páginas stub (si no existen)

```bash
# Crear archivos vacíos para otras páginas
mkdir -p src/app/authenticated/{buscar,mis-documentos,historial,ayuda}

# Buscar
cat > src/app/authenticated/buscar/page.tsx << 'EOF'
export default function SearchPage() {
  return <div>Página de búsqueda</div>
}
EOF

# Mis documentos
cat > src/app/authenticated/mis-documentos/page.tsx << 'EOF'
export default function DocumentsPage() {
  return <div>Mis documentos</div>
}
EOF

# Historial
cat > src/app/authenticated/historial/page.tsx << 'EOF'
export default function HistoryPage() {
  return <div>Historial</div>
}
EOF
```

### 4.4 Testear integración

```bash
npm run test:integration

# Output esperado:
# PASS src/__tests__/integration/dashboard.integration.test.tsx
#   Dashboard Integration Tests
#     ✓ debería mostrar skeleton loaders
#     ✓ debería cargar datos del dashboard
#     ✓ debería renderizar 3 action cards
```

---

## ✅ FASE 5: Verificación y Testing

### 5.1 Ejecutar toda la suite

```bash
npm test

# Output esperado:
# Test Suites: 5 passed, 5 total
# Tests:       33 passed, 33 total
# Snapshots:   0 total
# Time:        12.345s
```

### 5.2 Coverage report

```bash
npm run test:coverage

# Genera archivo: coverage/lcov-report/index.html
# Abrir en navegador: open coverage/lcov-report/index.html
```

Cobertura esperada:
```
Statements   : 78% ( 250/320 )
Branches     : 75% ( 180/240 )
Functions    : 80% ( 95/120 )
Lines        : 78% ( 245/315 )
```

### 5.3 Lint y tipos

```bash
# Verificar tipos TypeScript
npx tsc --noEmit

# Linting
npm run lint

# Debería tener 0 errores
```

### 5.4 Build preview

```bash
npm run build

# Output esperado:
# ✓ Compiled successfully
# Route (app)                              Size     First Load JS
# ○ /authenticated                         -        -
# ○ /authenticated/dashboard               42 kB    112 kB
# ○ /authenticated/buscar                  38 kB    108 kB
```

---

## 🧪 VERIFICACIÓN EN VIVO

### 5.5 Testear en navegador

```bash
npm run dev

# Abrir: http://localhost:3000

# Verificar:
1. ✅ Login funciona
2. ✅ Dashboard carga con stats
3. ✅ Skeleton loaders aparecen primero
4. ✅ Onboarding aparece después de 1.5s
5. ✅ Help buttons funcionan en action cards
6. ✅ Tooltip se abre/cierra
7. ✅ Data-tour attributes presentes
8. ✅ InlineHelpPanel visible
9. ✅ Activity feed carga
10. ✅ Dark mode funciona
```

### 5.6 Probar flujo completo

```
1. Abrir DevTools → Consola
2. localStorage.clear()
3. Recargar página
4. Esperar 1.5s → Debería aparecer onboarding
5. Click en botón siguiente → Cambiar a paso 2
6. Click en help button → Debería abrir tooltip
7. Click en "Ver tips" → Debería expandir tips
8. Click en action card → Debería navegar (o mock)
```

---

## 🐛 Troubleshooting

### Problema 1: Tests fallan por imports

```
Error: Cannot find module '@/components/ui/help-button'
```

**Solución:**
```bash
# Verificar que existan todos los archivos
find src -name "*.tsx" -o -name "*.ts" | grep -E "(help|onboarding)"

# Debería listar:
# src/hooks/useOnboarding.ts
# src/hooks/useContextualHelp.ts
# src/components/onboarding-overlay.tsx
# src/components/onboarding-provider.tsx
# src/components/ui/help-button.tsx
# src/components/ui/help-tooltip.tsx
# src/components/ui/inline-help-panel.tsx
```

### Problema 2: API devuelve 401 Unauthorized

```
Error: UNAUTHORIZED - No autorizado
```

**Solución:**
```bash
# Verificar que NextAuth está configurado
# Verificar que la sesión tiene tenantId

# En dashboard, añadir log:
console.log("Session:", session)

# Debería mostrar:
# {
#   user: {
#     id: "...",
#     tenantId: "...",
#     firstName: "...",
#     email: "..."
#   }
# }
```

### Problema 3: localStorage no persiste

```
Error: localStorage is not defined (en server-side rendering)
```

**Solución:**
```typescript
// En useLocalStorage.ts verificar:
if (typeof window !== 'undefined') {
  window.localStorage.setItem(key, JSON.stringify(valueToStore))
}
```

### Problema 4: Onboarding no aparece

```
Onboarding debería aparecer pero no aparece
```

**Solución:**
```typescript
// Verificar en DevTools:
localStorage.getItem('onboarding-completed')
// Debería devolver: null (si es primer login)

// Si devuelve "true":
localStorage.removeItem('onboarding-completed')
// Recargar página
```

### Problema 5: Help tooltips fuera de pantalla

```
Los tooltips aparecen fuera del viewport
```

**Solución:**
```typescript
// En help-tooltip.tsx, verificar positioning:
// El componente debe usar getBoundingClientRect()
// y ajustar posición dinámicamente

// Alternativa: Usar "bottom" placement que siempre funciona
<HelpButton contextId="search-query" position="bottom" />
```

---

## 📝 Checklist Final

### Configuración
- [ ] Node.js 18+ instalado
- [ ] npm install ejecutado
- [ ] jest.config.js en raíz
- [ ] Variables de entorno configuradas

### Estructura
- [ ] Carpetas creadas (`__tests__`, `app/api/user`, etc.)
- [ ] Todos los archivos copiados
- [ ] No hay errores de import

### APIs
- [ ] `/api/user/search` funciona
- [ ] `/api/user/dashboard` funciona
- [ ] Tests API pasan: `npm run test:api`

### Componentes
- [ ] useOnboarding hook creado
- [ ] useContextualHelp hook creado
- [ ] Componentes help creados
- [ ] OnboardingProvider en layout
- [ ] Tests hooks pasan: `npm run test:hooks`

### Dashboard
- [ ] Dashboard page actualizada
- [ ] data-tour attributes presentes
- [ ] Stats cargan correctamente
- [ ] Activity feed funciona
- [ ] Tests integración pasan: `npm run test:integration`

### Verificación Final
- [ ] `npm test` - Todos los tests pasan
- [ ] `npm run test:coverage` - Cobertura > 70%
- [ ] `npm run build` - Build sin errores
- [ ] `npm run dev` - Navegar y verificar manualmente
- [ ] Onboarding aparece en primer login
- [ ] Help buttons funcionan
- [ ] Dark mode funciona

---

## 📊 Resumen de Archivos

| Archivo | Ubicación | Tipo |
|---------|-----------|------|
| API Search | `src/app/api/user/search/route.ts` | Backend |
| API Dashboard | `src/app/api/user/dashboard/route.ts` | Backend |
| useOnboarding | `src/hooks/useOnboarding.ts` | Hook |
| useContextualHelp | `src/hooks/useContextualHelp.ts` | Hook |
| useLocalStorage | `src/hooks/useLocalStorage.ts` | Hook |
| OnboardingProvider | `src/components/onboarding-provider.tsx` | Component |
| OnboardingOverlay | `src/components/ui/onboarding-overlay.tsx` | Component |
| HelpButton | `src/components/ui/help-button.tsx` | Component |
| HelpTooltip | `src/components/ui/help-tooltip.tsx` | Component |
| InlineHelpPanel | `src/components/ui/inline-help-panel.tsx` | Component |
| Dashboard | `src/app/authenticated/dashboard/page.tsx` | Page |
| Layout | `src/app/authenticated/layout.tsx` | Layout |
| Tests | `src/__tests__/**/*.test.ts` | Testing |
| Jest Config | `jest.config.js` | Config |

---

## 🚀 Comandos Rápidos

```bash
# Setup inicial
npm install --save-dev jest @testing-library/react @testing-library/jest-dom

# Desarrollo
npm run dev

# Testing
npm test                    # Todos los tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report
npm run test:integration   # Solo integración

# Build
npm run build
npm start

# Linting
npm run lint
npx tsc --noEmit

# Limpieza
rm -rf coverage
rm -rf .next
npm cache clean --force
```

---

## 📞 Soporte

Si algo falla:

1. **Revisar error exacto**
2. **Buscar en sección Troubleshooting**
3. **Verificar imports**: `find src -name "*.tsx" | head`
4. **Limpiar cache**: `rm -rf .next node_modules && npm install`
5. **Reiniciar dev server**: `npm run dev`

---

## ✨ ¡Listo para implementar!

Tienes todo lo necesario para un setup profesional con:
- ✅ 33 tests con >70% cobertura
- ✅ API RAG integrada con Gemini
- ✅ Onboarding automático
- ✅ Sistema de help contextual
- ✅ Dashboard completamente funcional
- ✅ Multi-tenant con tenantId
- ✅ Logging y correlationId
- ✅ Dark mode integrado
- ✅ Accesibilidad WCAG

**Tiempo estimado de implementación: 4-5 horas**
