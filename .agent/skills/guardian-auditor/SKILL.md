---
name: guardian-auditor
description: Evalúa si un archivo (API, Server Action o Componente) está correctamente integrado con el sistema de permisos Guardian V2.
---

# Guardian V2 Auditor Skill

## Cuándo usar este skill
- Cuando el usuario pida revisar la seguridad de un endpoint o funcionalidad.
- Antes de dar por finalizada la creación de una nueva API administrativa o técnica.
- Para asegurar que se respeta el aislamiento por tenant y la lógica "Deny-First".

## Inputs necesarios
- **Ruta del archivo**: El archivo `.ts` o `.tsx` a auditar.
- **Contexto de Guardian**: Conocimiento de los recursos definidos en el sistema (ej: `PROMPTS`, `WORKFLOWS`, `USERS`).

## Workflow

### 1. Detección de Protección y RBAC (Phase 70)
1.  **RBAC Gatekeeping**: Verifica si el archivo utiliza el sistema de roles unificado:
    -   Uso de `requireRole([UserRole.ADMIN, ...])` para control de acceso rápido.
    -   Uso de `enforcePermission(resource, action)` para control granular (ABAC).
2.  **Validación de Tipado (Crítico)**:
    -   ❌ **PROHIBIDO**: `session.user.role === 'admin'` o comparaciones de strings.
    -   ✅ **OBLIGATORIO**: `session.user.role === UserRole.ADMIN`.
3.  Si el archivo es una API Route (`route.ts`) y no usa ni `requireRole` ni `enforcePermission` -> **RAISE ERROR (CRITICAL)**.

### 2. Validación de Parámetros
Analiza los argumentos de las funciones de protección:
- `resource`: Debe ser un slug válido (ej: `ROLES`, `PII_CONFIG`, `ANALYTICS`).
- `action`: Debe ser una acción estándar (`CREATE`, `READ`, `UPDATE`, `DELETE`, `EXECUTE`).
- **SuperAdmin Bypass**: Verifica que el bypass de Super Admin en archivos CORE (como `GuardianEngine.ts` o middlewares) use exclusivamente `UserRole.SUPER_ADMIN`.

### 3. Verificación de Tenant Isolation
- Asegura que después de la validación de permisos, las queries a DB filtren explícitamente por `tenantId` extraído de la sesión validada.
- **Punto Crítico**: No basta con tener permiso si luego se puede acceder a datos de otro tenant.

## Instrucciones y Reglas
- **REGLA DE ORO**: Si detectas un endpoint sin protección de permisos que maneje datos sensibles o configuración -> **ERROR CRÍTICO**.
- **ELIMINAR LITERALES**: Toda mención a roles en código debe ser vía el Enum `UserRole`. No aceptes PRs con strings como "SUPER_ADMIN" o "TECNICO".
- **DENY-FIRST**: Recuerda que en Guardian V2, la ausencia de permiso = Denegado. No asumas permisos implícitos.
- **SLA**: Las auditorías de seguridad deben ser precisas y no dejar lugar a ambigüedad.

## Output (formato exacto)
1. **Status de Seguridad**: `[PROTEGIDO | VULNERABLE | PARCIAL]`.
2. **Cumplimiento Fase 70**: `[SI | NO]` (¿Usa UserRole enum y requireRole?).
3. **Hallazgos**: Tabla con "Localización (Línea)", "Tipo (Permisos/RBAC/Tenant)" y "Gravedad".
4. **Corrección Sugerida**: Código necesario para cerrar la brecha detectada siguiendo los patrones de Phase 70.

## Manejo de Errores
- Si el archivo no es una API o componente sensible, informa al usuario que la auditoría no aplica.
- Si faltan constantes de recursos, sugiere su creación en `lib/schemas.ts`.
