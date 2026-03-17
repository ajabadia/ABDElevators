# Política de Espacios y Links de Conocimiento

Define la arquitectura jerárquica de la información y las reglas de visibilidad para el conocimiento RAG.

## 1. Jerarquía de Espacios (SpaceType)
- **GLOBAL / INDUSTRY**: Gestionados por plataforma. Contenido base (normativas, leyes).
- **TENANT**: Gestionado por el Tenant Admin.
- **TEAM / PERSONAL**: Espacios de trabajo colaborativo o privado.

## 2. Visibilidad y search
- **PUBLIC**: Visible a todo el tenant.
- **INTERNAL**: Visible solo a usuarios autenticados.
- **PRIVATE**: Solo owner y colaboradores.
- **RESTRICTED**: Filtros adicionales (roles de cumplimiento).

## 3. AssetSpaceLink: El Enlace de Conocimiento
- Un `KnowledgeAsset` puede existir en varios espacios.
- **isPrimary**: Marca la ubicación canónica y define la metadata por defecto.
- Los links secundarios permiten compartir sin duplicar binarios.

## 4. Reglas de RAG y Search
- El RAG solo debe indexar y recuperar activos de espacios a los que el usuario tiene acceso explícito.
- **Prohibición**: No incluir contenido de espacios `PRIVATE` o `RESTRICTED` en análisis globales o patrones federados sin anonimización.

## 5. Auditoría de Movimientos
Mover un activo entre espacios o cambiar su visibilidad se considera una acción sensible y debe registrarse en el `AuditTrail` con los estados `before/after`.
