---
description: Audita y valida cualquier ruta o archivo nuevo/modificado según los estándares de ABD RAG Platform (Definition of Done).
---

# Code Quality Auditor - ABD RAG Platform (v3.1 - SGSI Integrated)

## Propósito

Esta skill audita **cualquier ruta o archivo nuevo o modificado** en la aplicación ABD RAG Platform, asegurando que cumple con todos los estándares de calidad, seguridad (incluyendo SGSI/ISO 27001), accesibilidad, i18n, logging, y multi-tenancy definidos en la "Definition of Done".

## Cuándo Usar

- **Antes de crear** una nueva ruta API, servicio, página o componente
- **Después de modificar** código existente que afecte lógica de negocio, seguridad o UX
- **En code reviews** para validar que se cumplen todos los estándares
- **Cuando detectes** código legacy que no cumple estándares actuales

## Proceso de Auditoría

### 1. Identificar Tipología

Determina qué tipo de archivo estás auditando:

- **API Route** (`app/api/.../route.ts`)
- **Servicio de Dominio (Modular)** (`src/services/[dominio]/[Layer].ts`)
- **Puentes de Compatibilidad** (`src/lib/[service]-bridge.ts`)
- **Paquetes Core** (`packages/@abd/*`)
- **Página/Componente React** (`app/.../page.tsx`, `components/[dominio]/*`)
- **Logging/Auditoría forense** (`src/services/observability/*`)
- **Documentación de Seguridad** (`security/*`)

### 2. Aplicar Checklist Específica

Según la tipología, aplica la checklist correspondiente:

---

## Checklist: API Routes (`app/api/.../route.ts`)

### ✅ Autenticación y Permisos
- [ ] Usa `auth()` de `lib/auth` para obtener sesión en rutas protegidas
- [ ] Valida `rol` y `tenantId` antes de operar (ADMIN, SUPERADMIN, etc.)
- [ ] Si es API pública, valida `x-api-key` con `ApiKeyService.validateApiKey`
- [ ] Usa `enforcePermission(resource, action)` para permisos granulares

### ✅ Rate Limiting
- [ ] Rutas sensibles (auth, login, magic link) usan `checkRateLimit(ip, LIMITS.AUTH)`
- [ ] Rutas de core business usan `checkRateLimit(ip, LIMITS.CORE)`

### ✅ Validación de Entrada
- [ ] Define schema Zod en `lib/schemas.ts` o `lib/schemas/*.ts`
- [ ] Valida `req.json()` / `formData` con el schema **antes** de procesar
- [ ] Lanza `ValidationError` / `AppError` específicos, **nunca** `Error` genérico
- [ ] **Zero Spanish**: Verifica que no hay keys o enums en castellano (Regla #19).

### ✅ Manejo de Errores
- [ ] Captura `AppError` → `return NextResponse.json(error.toJSON(), { status: error.status })`
- [ ] Captura `ZodError` → `return NextResponse.json({ code: 'VALIDATION_ERROR', details: error.issues }, { status: 400 })`
- [ ] Otros errores → log + `INTERNAL_ERROR` 500 estándar
- [ ] **No exponer** detalles sensibles (stack traces, secretos) al cliente

### ✅ Logging y Auditoría (Era 11/13)
- [ ] Registra `logEvento` en operaciones importantes.
- [ ] **PII Masking**: Verifica que los datos sensibles no se filtren en logs (LoggingService auto-masking).
- [ ] Incluye `correlationId` (UUID) en toda la cadena de la request.

### ✅ SGSI & ISO 27001 Compliance
- [ ] **Documentación**: Si el endpoint maneja datos sensibles o flujos críticos, ¿se ha actualizado `/security/records/risk-register.md`?
- [ ] **Evidencia**: ¿El cambio requiere actualizar un apéndice técnico en `/security/technical-appendices/`?

### ✅ Multi-tenant y Dominios (Era 11)
- [ ] Filtra **siempre** por `tenantId` y `environment`.
- [ ] Uso de `getTenantCollection` para aislamiento automático (Regla de Oro #11).

### ✅ Performance
- [ ] Mide duración (`Date.now()`) y loguea si supera SLA.

---

## Checklist: Servicios de Dominio (`src/services/[dominio]/*`)

### ✅ Diseño y Responsabilidad
- [ ] Servicio tiene cohesión clara.
- [ ] No mezcla lógica de API (req/res) dentro del servicio.

### ✅ Resiliencia y Seguridad
- [ ] Llamadas externas usan `executeWithResilience`.
- [ ] Datos sensibles (PII) se manejan con encriptación en reposo si aplica.
- [ ] **Zero Spanish**: Enums y constantes internas están en inglés.

---

## Checklist: Páginas y Componentes React (`app/*`, `components/*`)

### ✅ i18n y Accesibilidad
- [ ] Usa `useTranslations` / `getTranslations`.
- [ ] Cumple con roles ARIA y gestión de foco.

---

## Proceso de Ejecución

### Paso 1: Leer el Archivo
```
view_file o view_code_item del archivo a auditar
```

### Paso 2: Identificar Tipología
Determina si es API Route, Servicio, Componente React, etc.

### Paso 3: Aplicar Checklist (SGSI Awareness)
Revisa cada ítem, prestando especial atención a si los cambios requieren actualizar la documentación en `/security`.

### Paso 4: Generar Reporte
Crea un reporte con Cumple, Warnings, Fallos Críticos y **Alineación SGSI**.

---

## Reglas Críticas

1. **NUNCA aprobar código** que no valide entrada, no respete multi-tenancy o exponga secretos.
2. **SGSI MANDATORY**: Cualquier cambio arquitectónico o de manejo de datos debe ser evaluado contra las políticas en `/security`.
3. **FAIL-CLOSED**: Si no hay seguridad clara, se rechaza.

---

## Output Esperado

Genera un documento markdown detallado con el resumen de la auditoría y los fixes propuestos, incluyendo una sección de "Impacto en SGSI/ISO 27001".
