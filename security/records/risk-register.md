# Registro de Riesgos de Seguridad de la Información

| ID | Activo / Proceso | Riesgo (amenaza + vulnerabilidad) | Impacto (1–5) | Prob. (1–5) | Nivel (I×P) | Controles existentes | Acciones de tratamiento / Plan | Responsable | Estado | Fecha revisión |
|----|-------------------|-----------------------------------|---------------|-------------|-------------|----------------------|---------------------------------|-------------|---------|----------------|
| R1 | Plataforma SaaS | Brecha de datos por explotación de API | 5 | 3 | 15 | Auth fuerte, MFA, rate limit | Pentest anual, WAF, auto‑patch | Seguridad | Abierto | 2026-03-11 |
| R2 | Datos personales | Incumplimiento RGPD por retención logs | 4 | 3 | 12 | TTL Indexes + Masking | Auditoría periódica de purga | Seguridad | Mitigado | 2026-03-11 |
| R3 | Infraestructura Cloud | Caída prolongada del servicio | 4 | 2 | 8 | Redundancia básica | Definir RPO/RTO, pruebas DR | Operaciones | Abierto | 2026-03-11 |
| R4 | Repo de código | Fuga de secretos por commit | 5 | 2 | 10 | .env fuera de Git | Secret scanning, hooks | Desarrollo | Abierto | 2026-03-11 |
| R5 | Módulo RAG | Acceso cruzado entre tenants | 5 | 2 | 10 | SecureCollection, Pentest(Mar-11), Branded IDs (Ph 411) | Monitor de auditoría Guardian | Desarrollo | Mitigado | 2026-03-12 |
| R6 | RAG Multi-tenant | Fuga de datos vía respuesta IA | 5 | 2 | 10 | Aislamiento Repo, Pentest(Mar-11), Branded IDs (Ph 411) | Tests automatizados aislamiento | Desarrollo | Mitigado | 2026-03-12 |
| R7 | Dependencias Cloud | Interrupción por fallo de proveedor | 4 | 2 | 8 | Backups, circuit-breakers | Estrategia de salida, pruebas restauración | Operaciones | Abierto | 2026-03-11 |
| R8 | Logs y PII | Exceso de retención de datos sensibles | 4 | 3 | 12 | Masking IP/Email + TTL | Auditoría de LoggingService | Seguridad | Mitigado | 2026-03-11 |
| R9 | Vulnerabilidades | CVEs en librerías críticas (NextAuth beta) | 4 | 3 | 12 | Revisiones manuales | Activar scanning automático | Desarrollo | Abierto | 2026-03-11 |
| R10| Calidad de Código | Ausencia de tests críticos | 4 | 3 | 12 | Suite Vitest/Jest (Ph 370) | Mantener cobertura > 80% | Desarrollo | Mitigado | 2026-03-11 |
