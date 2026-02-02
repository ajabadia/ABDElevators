1. Landing & Marketing Público
Definición: Frente de captación y conversión. Explica el valor del RAG técnico industrial.
Mejoras UX/UI:
Demo interactiva: Simulador "Sube tu PDF de prueba" (sandbox limitado) antes de registrarse. Gap actual: Solo texto estático.
Calculadora de ROI: Input simple (nº técnicos, pedidos/mes) → estimación de horas ahorradas. Aumentaría conversión.
Video de 60s: Hero section actual es muy textual. Auto-play muted explicando el flujo "PDF → Análisis → Reporte".
2. Sistema de Autenticación
Definición: Puerta de entrada con seguridad multinivel (MFA, invitaciones, recuperación).
Gap Crítico:
Onboarding guiado vacío: Tras aceptar invitación, el usuario llega a un dashboard vacío sin contexto.
Solución: Wizard de 3 pasos (1. Subir primer documento, 2. Ver demo análisis, 3. Invitar equipo).
Mejoras UX/UI:
Magic Links: Opción "Enviar enlace mágico" vs contraseña. Reduce fricción en móviles.
Previews de permisos: Al invitar, mostrar visualmente qué puede hacer cada rol (iconos de acceso/bloqueo) antes de enviar.
3. Dashboard Administrativo (Home)
Definición: Centro de control operativo. Métricas de salud del sistema y consumo.
Gap Funcional:
Alertas proactivas ausentes: Muestra datos pero no acciones pendientes.
Falta: "3 documentos próximos a caducar", "Límite de tokens al 80%", "2 pedidos sin analizar desde hace 48h".
Mejoras UX/UI:
Modo "War Room": Vista compacta para monitoreo en pantallas grandes (TVs de oficina) con actualización realtime.
Comparativa temporal: Gráficas ahora son estáticas. Necesitan toggle 7d/30d/90d para ver tendencias.
Atajos rápidos: Cards de "Acciones frecuentes" (Subir doc, Nuevo usuario, Ver último pedido).
4. Gestión del Corpus Técnico (Documentos)
Definición: Biblioteca técnica indexada. Control de versiones de manuales y modelos.
Gap Funcional:
Relaciones entre documentos: No existe vinculación "Este manual anula a este otro" o "Compatibilidad: Modelo X necesita Doc Y".
Caducidad programada: Solo estados (vigente/obsoleto). Falta fecha de revisión obligatoria con aviso previo.
Mejoras UX/UI:
Vista previa inline: Doble click para preview PDF sin descargar (iframe seguro).
Tags visuales: Colores por tipo de componente (Motores=azul, Botoneras=verde) para escaneo rápido.
Drag & Drop masivo: Actualmente es uno a uno. Necesario upload de carpetas completas (zip).
Conflictos de versión: Alerta visual si se sube un manual que contradice otro vigente (basado en análisis IA de metadatos).
5. Análisis de Pedidos (Core Técnico)
Definición: Motor de trabajo diario del técnico. Procesa solicitudes de compra/clientes y cruza con documentación.
Gap Funcional:
Comparador de versiones: No puede comparar "Pedido A vs Pedido B" para ver diferencias entre proyectos similares.
Historial de consultas: El técnico no ve sus análisis previos fácilmente (buscador local sin filtros avanzados).
Exportación limitada: Solo reporte estático. Falta exportar a Excel/ERP con campos específicos.
Mejoras UX/UI:
Sidebar contextual: Mientras analiza, panel lateral mostrando documentos relacionados arrastrables al reporte.
Modo "Checklist interactivo": Items detectados por IA deben ser checkables manualmente por el técnico (feedback loop visual).
Colaboración: Permitir anotaciones/threads sobre puntos específicos del pedido (como Google Docs comments).
Confianza visual: Mostrar score de confianza del IA por cada detección (tag "Alta/Media/Baja") para que el técnico sepa qué revisar primero.
6. Gestión de Usuarios y Roles
Definición: Control de acceso y delegación de permisos dentro del tenant.
Gap Funcional:
Delegación temporal: No se pueden asignar permisos de ADMIN por tiempo limitado (ej: "Admin esta semana mientras estoy de vacaciones").
Grupos/Equipos: Solo roles individuales. Falta "Equipo de Valencia" vs "Equipo Madrid" con documentación regional distinta.
Mejoras UX/UI:
Vista de matriz permisos: Tabla cruzada Usuarios x Funcionalidades con toggles visuales.
Actividad reciente por usuario: Quién subió qué y cuándo (timeline visual).
Simulador de sesión: "Ver como Juán (Técnico)" para validar qué ve exactamente cada rol sin cambiar de cuenta.
7. Configuración de Organización (Tenants)
Definición: Personalización de marca, limites técnicos y datos fiscales.
Gap Funcional:
Entornos múltiples: No hay separación Producción/Testing dentro del mismo tenant.
Backup/Export: No puede exportar toda su configuración/documentos para migración o backup local.
Mejoras UX/UI:
Branding live preview: El preview de colores actual es estático. Necesita mostrar capturas reales de la app con esos colores aplicados.
Validación fiscal: Integración con API de validación de CIF/VAT (VIES) para datos de facturación automáticos.
Plantillas de configuración: "Modo Elevadores", "Modo Legal", "Modo Médico" que pre-configuran todo el sistema.
8. Sistema de Facturación
Definición: Control de consumo, planes y pagos. Self-service de upgrade/downgrade.
Gap Crítico:
Simulador de cambio: No puede ver cuánto costará cambiar de plan antes de confirmar (muestra precio nuevo pero no diferencia ni prorrateo exacto).
Alertas de gasto: Solo bloquea cuando supera. Falta "Estás al 80%, ¿quieres comprar pack adicional?"
Mejoras UX/UI:
Termómetro visual: Widget siempre visible en sidebar mostrando uso % de cada límite (tokens, storage, usuarios).
Descarga de facturas: Portal simplificado (actualmente requiere ir a Stripe). Mini-facturador inline.
Equipo de compras: Rol "CONTABILIDAD" que solo ve facturación, no datos técnicos.
9. Centro de Soporte (Tickets)
Definición: Comunicación técnica entre usuarios y equipo de soporte de la plataforma.
Gap Funcional:
Base de conocimiento interna: Tickets resueltos no se convierten automáticamente en KB searchable.
Escalamiento inteligente: No hay reglas "Si ticket técnico sin respuesta en 4h → escalar a supervisor".
Mejoras UX/UI:
Buscador AI previo: Antes de crear ticket, busca en KB y sugiere "¿Quizás esto responde tu duda?" (reduce tickets duplicados).
Adjuntos ricos: Permitir grabar pantalla/video directo desde navegador (Loom integrado).
Estados emocionales: Tags de urgencia real (bloqueo total) vs perceived urgency (consulta). Priorización visual.
10. Motor de Prompts (Administración IA)
Definición: Configuración del comportamiento del modelo Gemini para cada tenant/industria.
Gap Funcional:
A/B Testing: No puede comparar qué prompt funciona mejor (version A vs B).
Variables de contexto: No hay documentación inline de qué variables puede usar {{cliente}}, {{modelo}}, etc.
Mejoras UX/UI:
Editor colaborativo: Como VS Code/Notion para edición de prompts con syntax highlighting.
Test inline: Botón "Probar con ejemplo" junto al editor sin guardar cambios (dry-run).
Diff visual: Al ver historial, highlight de qué cambió entre versiones.
11. Workflows
Definición: Automatización de estados de pedidos/casos (Kanban inteligente).
Gap Funcional:
Condiciones complejas: Solo estados lineales. Falta "Si tipo=X y importe>Y → saltar a revisión directa".
Acciones automáticas: Cambiar estado no dispara acciones (webhooks, emails, asignaciones automáticas).
Mejoras UX/UI:
Constructor visual: Drag & drop de nodos (estados) y flechas (transiciones) tipo Draw.io.
Debug mode: Ver por qué un pedido no puede avanzar (qué condición bloquea).
12. Perfil de Usuario y Preferencias
Definición: Configuración personal, seguridad (MFA) y eficiencia individual.
Gap Funcional:
Preferencias de análisis: No puede configurar "Siempre mostrar modelo X primero" o "Ignorar advertencias tipo Y".
Accesos directos personales: Dashboard personalizable (widgets) vs dashboard genérico.
Mejoras UX/UI:
Actividad de sesiones: Mapa visual de dónde está logueado (geomapa) con opción de kill remoto.
Modo focus: Toggle para ocultar notificaciones durante análisis profundo.
13. Knowledge Explorer (Base de Conocimiento)
Definición: Búsqueda forense de chunks vectoriales para debugging del RAG.
Utilidad actual: Solo técnica/admin. Propuesta de expansión:
Modo "Biblioteca técnica": Para técnicos, buscador semántico de documentos (no solo chunks) con resumen IA automático de cada doc.
Resumen de Prioridades (Impacto/Esfuerzo)
Alto Impacto, Bajo Esfuerzo:
Simulador ROI en landing
Widget de uso (termómetro) en sidebar
Demo sandbox pre-registro
Alto Impacto, Alto Esfuerzo:
Constructor visual de workflows
Sistema de relaciones entre documentos
Modo colaborativo en análisis (comments)
Bajo Impacto Técnico, Alto Valor UX:
Wizard onboarding post-registro
Buscador AI preventivo en soporte
Previews inline de PDFs