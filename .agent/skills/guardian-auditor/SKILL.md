---
name: guardian-auditor
description: Evalúa si un archivo (API, Server Action o Componente) está correctamente integrado con el sistema de permisos Guardian V3 (Phase 97+ Compatible).
---

# Guardian V3 Auditor Skill

## Cuándo usar este skill
- Cuando el usuario pida revisar la seguridad de un endpoint o funcionalidad.
- Antes de dar por finalizada la creación de una nueva API administrativa, de cumplimiento o técnica.
- Para asegurar que se respeta el aislamiento por tenant, el sistema de tareas delegadas y la lógica "Deny-First".

## Inputs necesarios
- **Ruta del archivo**: El archivo `.ts` o `.tsx` a auditar.
- **Contexto de Guardian V3**: Conocimiento de los roles (`COMPLIANCE`, `REVIEWER`, `TECHNICAL`) y recursos (`workflow-task`, `compliance-audit`).

## Workflow

### 1. Detección de Protección y RBAC (Guardian V3)
1.  **Industrial Role Gatekeeping**: Verifica si el archivo utiliza los nuevos roles industriales:
    -   Uso de `requireRole([UserRole.COMPLIANCE, UserRole.REVIEWER, ...])` para flujos de validación.
    -   Uso de `enforcePermission(resource, action)` para control granular sobre recursos críticos.
2.  **Validación de Tipado (Crítico)**:
    -   ❌ **PROHIBIDO**: `session.user.role === 'admin'` o casts a `any`.
    -   ✅ **OBLIGATORIO**: Uso de `UserRole` enum y tipos de sesión extendidos.
3.  **Industrial DB Management**:
    -   Asegura el uso de `getTenantCollection(collectionName)` para aislamiento multi-tenant.
    -   ❌ **PROHIBIDO**: Acceso directo a base de datos sin contexto de tenant o sesión.
4.  Si el archivo maneja `WorkflowTasks` y no verifica la propiedad o el rol asignado -> **RAISE ERROR (CRITICAL)**.
5.  **Critical Enforcement (ERA 8)**: Verifica que módulos de Billing, Audit, Security, Governance y Settings usen `enforcePermission` en el backend.

### 2. Validación de Recursos V3
Analiza los argumentos de las funciones de protección:
- `resource`: Debe incluir los nuevos recursos V3: `workflow-task`, `compliance-audit`.
- `action`: Debe usar acciones estándar (`read`, `write`, `approve`, `reject`).
- **Workflow Integrity**: Verifica que las transiciones de estado solo sean ejecutadas por roles permitidos según el `WorkflowDefinition`.

### 3. Verificación de Tenant & Environment Isolation
- Asegura que las queries utilicen el `tenantId` de la sesión.
- **Audit Logging**: Verifica que todas las acciones protegidas llamen a `logEvento` con el `correlationId` para trazabilidad.
- **Task Delegation**: En flujos de `WorkflowTask`, asegura que el usuario que completa la tarea tiene el `assignedRole` correcto.

### 4. Integración con Rutas Públicas (Bypass)
Si el archivo es una ruta pública:
1. **No Sensitive Data**: Asegura que NO realice queries a colecciones protegidas como `usage_logs`, `workflow_tasks` o `compliance_audits`.
2. **Status**: El status debe ser `[PUBLIC_BYPASS]` si es seguro, o `[VULNERABLE]` si expone lógica interna.

## Instrucciones y Reglas
- **REGLA DE ORO**: La ausencia de chequeo explícito en un flujo de cumplimiento o técnico es un **FALLO DE SEGURIDAD**.
- **ROLES V3**: Mantén el rigor con los roles en inglés. `COMPLIANCE` y `REVIEWER` son prioritarios para auditorías de procesos.
- **DENY-FIRST**: Guardian V3 es más estricto. Si no hay una política que permita explícitamente la acción sobre el recurso, se deniega.
- **TASK ISOLATION**: Los usuarios no deben poder ver o modificar tareas (`workflow-task`) que no les corresponden por rol o tenant.

## Output (formato exacto)
1. **Status de Seguridad**: `[PROTEGIDO | VULNERABLE | PARCIAL | PUBLIC_BYPASS]`.
2. **Cumplimiento Guardian V3**: `[SI | NO | N/A]`.
3. **Hallazgos**: Tabla con "Localización (Línea)", "Tipo (Permisos/RBAC/Tenant/TaskIsolation)" y "Gravedad".
4. **Corrección Sugerida**: Código necesario para cerrar la brecha detectada siguiendo los patrones de Guardian V3.

## Manejo de Errores
- Si faltan constantes de recursos, sugiere su actualización en `lib/schemas.ts`.
- Si se detecta un bypass manual de seguridad, márcalo como `[CRITICAL_VULNERABILITY]`.
