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

### 1. Detección de Protección
1. Verifica si el archivo utiliza `enforcePermission` (para API Routes/Actions) o `GuardianGuard` (para componentes UI).
2. Si el archivo es una API Route (`route.ts`) y no tiene `enforcePermission` en las primeras líneas de ejecución -> **RAISE ERROR (CRITICAL)**.

### 2. Validación de Parámetros
Analiza los argumentos de `enforcePermission(resource, action)`:
- `resource`: Debe ser un slug válido (ej: `ROLES`, `PII_CONFIG`, `ANALYTICS`).
- `action`: Debe ser una acción estándar (`CREATE`, `READ`, `UPDATE`, `DELETE`, `EXECUTE`).
- Verifica que el recurso sea coherente con la funcionalidad del archivo.

### 3. Verificación de Tenant Isolation
- Asegura que después de la validación de permisos, las queries a DB filtren explícitamente por `tenantId` extraído de la sesión validada.
- **Punto Crítico**: No basta con tener permiso si luego se puede acceder a datos de otro tenant.

## Instrucciones y Reglas
- **REGLA DE ORO**: Si detectas un endpoint sin protección de permisos que maneje datos sensibles o configuración -> **ERROR CRÍTICO**.
- **DENY-FIRST**: Recuerda que en Guardian V2, la ausencia de permiso = Denegado. No asumas permisos implícitos.
- **SLA**: Las auditorías de seguridad deben ser precisas y no dejar lugar a ambigüedad.

## Output (formato exacto)
1. **Status de Seguridad**: `[PROTEGIDO | VULNERABLE | PARCIAL]`.
2. **Hallazgos**: Tabla con "Localización (Línea)", "Tipo (Permisos/Tenant Isolation)" y "Gravedad".
3. **Corrección Sugerida**: Código necesario para cerrar la brecha detectada.

## Manejo de Errores
- Si el archivo no es una API o componente sensible, informa al usuario que la auditoría no aplica.
- Si faltan constantes de recursos, sugiere su creación en `lib/schemas.ts`.
