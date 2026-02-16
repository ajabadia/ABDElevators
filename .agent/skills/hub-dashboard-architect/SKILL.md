---
name: hub-dashboard-architect
description: Audita y refactoriza rutas de administración para implementar el patrón de Hub/Dashboard basado en fichas (Cards) en lugar de navbars o listas simples, garantizando coherencia visual y navegación intuitiva.
---

# Hub Dashboard Architect Skill

Este skill guía la transformación de páginas de administración complejas o con múltiples sub-rutas en un "Hub" intuitivo basado en fichas (Cards), siguiendo el patrón de `/admin/operations`.

## Cuándo usar este skill
- Cuando una ruta de administración tenga una navbar con más de 3-4 opciones.
- Cuando se quiera limpiar una página que muestra datos directamente sin un "punto de entrada" claro.
- Cuando el usuario pida "hacer esto como la página de operaciones".
- Al centralizar accesos a sub-módulos dentro de una sección del menú lateral.

## Inputs necesarios
- **Ruta objetivo**: La página `page.tsx` a transformar.
- **Sub-rutas**: Lista de destinos, cada uno con su icono, título y descripción.
- **Diccionarios i18n**: Namespace de traducciones para las fichas.

## Workflow

### Fase 1: Análisis de Estructura
1. Identificar si la página actual tiene lógica de visualización que debería moverse a una sub-ruta "Detalle" o "Dashboard específico".
2. Listar las secciones que compondrán el Hub. Cada sección debe tener:
   - `title`: i18n key.
   - `description`: i18n key (máximo 120 caracteres).
   - `href`: Ruta de destino.
   - `icon`: Icono de `lucide-react`.
   - `color`: Estilo de borde (ej: `border-l-blue-500`).

### Fase 2: Implementación del Hub
1. Usar composiciones de `PageContainer` y `PageHeader`.
2. Implementar un grid responsivo: `grid gap-6 md:grid-cols-2 lg:grid-cols-3`.
3. Usar el componente `Card` de Shadcn UI con efectos hover y escalado: `hover:shadow-lg transition-all cursor-pointer border-l-4 group-hover:scale-[1.02]`.
4. **IMPORTANTE**: No incluya lógica de datos pesada en el Hub. Es un punto de despacho.

### Fase 3: Navegación y Retorno
1. Asegurar que cada página de destino tenga un botón o mecanismo de "Back" claro hacia el Hub.
2. Usar `Link` de Next.js para una navegación instantánea.

### Fase 4: Auditoría Cruzada (CRÍTICO)
1. **OBLIGATORIO**: Tras crear o modificar la ruta, ejecutar el skill `i18n-a11y-auditor`.
2. Verificar que no haya textos hardcodeados.
3. Asegurar que las fichas tengan `aria-label` descriptivo si es necesario, aunque el `CardTitle` suele ser suficiente.

## Instrucciones de Diseño
- **Iconografía**: Usar iconos de `lucide-react` consistentes con el dominio (Mantenimiento, IA, Seguridad).
- **Colores**: Usar la paleta de colores de estado de la plataforma (Blue, Emerald, Amber, Purple, Rose, Indigo).
- **Tipografía**: Mantener `text-xl tracking-tight` para títulos de ficha.

## Output (formato exacto)
1. **Propuesta de Hub**: Tabla con Secciones, Iconos y Rutas.
2. **Nuevas Claves i18n**: Bloques JSON para `en.json` y `es.json`.
3. **Código TSX**: Contenido para el nuevo `page.tsx`.
4. **Resultado de Auditoría**: Confirmación de ejecución de `i18n-a11y-auditor`.

## Manejo de Errores
- Si faltan iconos adecuados, pregunta al usuario por la intención del módulo.
- Si el Hub queda muy vacío (menos de 3 fichas), considera si el patrón de Tabs es más apropiado.
