---
name: roadmap-manager
description: Gestiona de forma integral el ROADMAP_MASTER.md y sincroniza los avances con la Landing Page (i18n), README.md y el mapa de arquitectura (map.md).
---
# Roadmap Manager Skill (v3.0 - Unified Sync)

## Cuándo usar este skill
- Cuando se finalice una fase de desarrollo (al terminar un `walkthrough.md`).
- Cuando se completen funcionalidades críticas ("Killer Features") que aporten valor comercial.
- Cuando se creen, modifiquen o eliminen rutas de la aplicación.
- Al actualizar versiones del sistema o cambiar la visión estratégica.

## Inputs necesarios
- `ROADMAP_MASTER.md`: Fuente de verdad del progreso técnico.
- `walkthrough.md`: Detalle de lo último implementado.
- `messages/[locale]/landing.json`: Diccionario de la Landing Page.
- `README.md`: Documentación técnica de bienvenida.
- `map.md`: Registro de rutas y funcionalidades.

## Workflow

### 1. Actualización del Roadmap
1. Lee `ROADMAP_MASTER.md` y marca como completado lo verificado en el `walkthrough.md`.
2. Actualiza métricas de progreso global y la sección de "Recent Ship".

### 2. Sincronización de Marketing & Landing (Killer Features)
1. Evalúa si el avance es una funcionalidad visible para el usuario final.
2. Si lo es:
    - Actualiza `messages/es/landing.json` y `messages/en/landing.json` (u otros namespaces relevantes).
    - Traduce fielmente manteniendo el tono profesional y premium.

### 3. Actualización Técnica (README.md)
1. Si hay un salto de versión o nuevas capacidades core:
    - Actualiza el título y la descripción inicial del `README.md`.
    - Añade los nuevos hitos a la sección "Características Clave".
    - Verifica que los "Usuarios de Prueba" o "Estructura del Proyecto" sigan siendo correctos.

### 4. Sincronización Arquitectónica (map.md)
1. Si el desarrollo implicó nuevas rutas (`/app/.../page.tsx`) o APIs (`/api/.../route.ts`):
    - Añade la nueva entrada al `map.md` relacionándola con su funcionalidad.
    - Si una ruta fue eliminada o deprecada, refléjalo en el mapa.

### 5. Despliegue y Persistencia (Git Push)
1. Una vez finalizada la sincronización de todos los archivos:
    - Realiza un `git commit` con un mensaje descriptivo (ej: `docs: sync roadmap and landing for Phase X`).
    - **OBLIGATORIO**: Ejecuta un `git push` para asegurar que los cambios estén disponibles en el repositorio remoto inmediatamente.

## Instrucciones y Reglas
- **REGLA DE ORO**: La sincronización debe ser atómica. Si actualizas el Roadmap, revisa el resto de archivos.
- **TONO**: Mantén un lenguaje de "Grado Industrial" y "Vanguardia Agéntica".
- **DEPRECACIÓN**: Sigue la regla de no borrar historial en el Roadmap; usa la sección `🗑️ DEPRECATED & ARCHIVED`.

## Output (formato exacto)
1. **Informe de Sincronización**: Lista de archivos modificados.
2. **Resumen de Cambios**: Breve descripción de qué se ha actualizado en cada lugar (ej: "Añadida Feature X a la Landing en ES/EN").
3. **Persistencia**: Actualización efectiva de todos los archivos involucrados.

## Manejo de Errores
- Si no encuentras alguno de los archivos secundarios (`map.md` o `README.md`), pregunta al usuario si debe ser creado o si hay una ruta alternativa.
