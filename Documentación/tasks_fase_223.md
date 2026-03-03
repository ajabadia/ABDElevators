# Tareas Fase 223 - AI Governance y Compliance

- [ ] **223.1: Configuración**: Cargar y entender los rulesets del contexto y el roadmap de Era 8.
- [x] **223.2: Detección Automática**: Ejecutar scan de hardcodes en `/admin/ai/governance`, `/admin/audit`, `/admin/settings` y `/admin/compliance`.
- [x] **223.3: Migración Governance**: Extraer ~361 líneas hardcodeadas de `admin/ai/governance` hacia `messages/es/admin.json` (y `en`).
- [x] **223.4: Migración Compliance / Audit**: Mover textos regulatorios y de políticas (incluido aviso legal) al diccionario común.
- [x] **223.5: Navegación Principal**: Sustituir layouts de sidebar, breadcrumbs y selectores de idiomas para usar traducciones dinámicas.
- [x] **223.6: Sincronización JSON**: Ejecutar comparador/script para confirmar paridad `es` -> `en`.
- [x] **223.7: Deuda**: Aislación de textos profundos (secundarios) no obligatorios para compilar la documentación `docs/i18n-debt.md`.
- [x] **223.8: Validación Build**: Generar un run completo `npm run build` para asegurar la compilación tipográfica sin Next Intl fallos.
