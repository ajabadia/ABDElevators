# Plan de Implementación: Motor de Riesgos y Cumplimiento (Fase 7.5)

Este documento detalla la arquitectura para transformar la plataforma de una herramienta de extracción a un **Asistente de Cumplimiento Inteligente**. 

El sistema dejará de ser exclusivo para ascensores; ahora evaluará riesgos en cualquier industria comparando el "Caso Actual" contra la "Memoria Corporativa" (RAG).

## Conceptos Clave

1. **Memoria de Riesgos**: El RAG actuará como el "Manual de Referencia". Si un técnico sube un pedido o un abogado un contrato, Gemini buscará en el RAG los manuales de seguridad o política pertinentes.
2. **Evaluación Comparativa**: No usamos reglas `if-else` fijas. Gemini recibirá el caso y el contexto RAG, y se le pedirá: *"¿Ves algo en este documento que viole el manual o que haya causado problemas en el pasado?"*.
3. **Escalado por Severidad**: Los riesgos se categorizarán automáticamente como Informativos, Advertencias o Bloqueantes.

## Cambios Propuestos

### 1. Infraestructura de Datos

#### [NEW] [RiskSchema](file:///d:/desarrollos/ABDElevators/src/lib/schemas.ts)
Añadiremos el soporte para almacenar los "hallazgos" de riesgo:
```typescript
export const RiskFindingSchema = z.object({
    id: z.string(),
    tipo: z.enum(['SEGURIDAD', 'COMPATIBILIDAD', 'LEGAL', 'NORMATIVA', 'GENERAL']),
    severidad: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    mensaje: z.string(),               // Descripción clara del riesgo
    referencia_rag: z.string(),        // Cita al documento/página del RAG que justifica el riesgo
    sugerencia: z.string().optional()  // Cómo mitigar el problema
});
```

### 2. Motor de Evaluación (Intelligence Layer)

#### [NEW] [risk-engine.ts](file:///d:/desarrollos/ABDElevators/src/lib/risk-engine.ts)
Crearemos un servicio `RiskEngine` que orqueste la llamada a Gemini 2.0 Flash con un prompt de auditoría:
- **Input**: `caseData` + `ragContext`.
- **Logic**: Pide a la IA que actúe como "Auditor Externo" para la {Industry} del tenant.
- **Output**: Lista de `RiskFindings`.

#### [MODIFY] [pedidos/analyze/route.ts](file:///d:/desarrollos/ABDElevators/src/app/api/tecnico/pedidos/analyze/route.ts)
Actualizaremos el flujo para que, tras el análisis RAG, se invoque al `RiskEngine` antes de devolver la respuesta definitiva.

### 3. Interfaz de Usuario (Visualización de Alertas)

#### [NEW] [RiskAlerter.tsx](file:///d:/desarrollos/ABDElevators/src/components/shared/RiskAlerter.tsx)
Un componente genérico tipo "Dashboard de Salud" que muestre los riesgos encontrados con colores según severidad.

## Ejemplo de Uso Genérico

| Si la industria es... | El manual RAG dice... | El caso actual tiene... | **Resultado del Riesgo** |
| :--- | :--- | :--- | :--- |
| **Ascensores** | "El motor X no admite puertas de cristal" | Motor X + Puerta Cristal | ⚠️ **CRITICAL**: Incompatibilidad física detectada. |
| **Legal** | "No firmar cláusulas de exclusividad > 2 años" | Cláusula de 5 años | ⚠️ **HIGH**: Violación de política de contratación. |
| **IT** | "El puerto 80 debe estar cerrado en servidores DB" | Configuración con Port 80 | ⚠️ **CRITICAL**: Vulnerabilidad de seguridad. |

## Plan de Verificación

1. **Prueba de Incompatibilidad**: Subir un pedido de ascensor con componentes conocidos como incompatibles y verificar que la IA detecta el riesgo citando el manual.
2. **Prueba Multi-Industria**: Simular un tenant de IT, subir una política de seguridad, luego un archivo de configuración, y verificar que detecta el riesgo de seguridad.
