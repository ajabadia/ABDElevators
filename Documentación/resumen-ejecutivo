# RESUMEN EJECUTIVO
## Sistema RAG de Documentación Técnica para Ascensores
### Propuesta de Valor & Implementación

---

## 1. PROBLEMA Y OPORTUNIDAD

**Contexto Actual:**
- Técnicos de taller consultan documentación técnica de forma manual (buscando en archivos PDF, emails, manuales impresos).
- Tiempo promedio de consulta: **15-30 minutos por pedido**.
- Riesgos: ambigüedad en protocolos, interpretaciones inconsistentes, errores de montaje, retrabajos.
- Trazabilidad limitada: imposible auditar qué documentación se usó en cada decisión técnica.

**Oportunidad:**
Implementar un **asistente de IA (RAG)** que:
- **Analiza automáticamente** las especificaciones del pedido.
- **Recupera documentación técnica relevante** en tiempo real.
- **Genera informes estructurados** listos para el técnico.
- **Registra auditoría completa** de cada decisión (trazabilidad 100%).
- **Reduce tiempo de consulta** de 15-30min a <2 min.
- **Mejora calidad** y consistencia de montaje.

---

## 2. SOLUCIÓN PROPUESTA

### 2.1 Concepto
Un **sistema web cloud-native** que:

1. **Ingesta**: Admin sube documentación técnica (PDFs manuales, protocolos, esquemas).
2. **Análisis**: Técnico carga especificación de pedido (PDF o texto).
3. **RAG**: Sistema busca automáticamente documentación relevante usando IA.
4. **Informe**: Genera reporte estructurado con documentos, fragmentos clave, checklists.
5. **Auditoría**: Todo queda registrado, trazable, auditado.

### 2.2 Diferenciadores Clave

| Aspecto | Beneficio |
|--------|----------|
| **Velocidad** | <2 seg análisis, <300ms informe |
| **Precisión** | Vector search semántico (no simple keyword matching) |
| **Trazabilidad** | 100% auditable: qué documento, cuándo, quién, por qué |
| **Integrable** | API REST ready para conectar con ERP/MES existentes |
| **Escalable** | Desde MVP a 10k+ pedidos/mes sin reescritura arquitectónica |
| **Profesional** | Enterprise-ready: logs, alertas, backups, DR, GDPR-compliant |

---

## 3. STACK TECNOLÓGICO

**Elegido para máxima simpleza + mínimo costo operacional:**

```
Frontend:        Next.js 15 + React 19 + TypeScript
Backend:         Next.js API Routes + Server Actions
Base de Datos:   MongoDB Atlas (M10+) con Vector Search nativo
IA/ML:           Gemini API (embeddings + LLM)
RAG Framework:   LangChain.js
PDF:             pdf-parse (ingesta) + jsPDF (exportación)
Hosting:         Vercel (frontend) + Atlas (BD)
Monitoring:      Axiom / Datadog (logs) + Sentry (errores)
Testing:         Vitest (unit) + Playwright (E2E)
```

**Ventajas de esta pila:**
- Monolito serverless: sin ops, auto-scaling, pay-as-you-go.
- Vector search nativo en MongoDB: no requiere servicio externo (Pinecone, Weaviate).
- Gemini API gratuita para demo, pricing transparente para producción.
- Total cost ownership: **<$500/mes** (Vercel + Atlas M10 + APIs).

---

## 4. MODELO DE DATOS (SIMPLIFICADO)

**9 colecciones MongoDB:**

1. **documentos_tecnicos** – Catálogo de manuales con ciclo de vida (vigente → obsoleto → archivado).
2. **document_chunks** – Fragmentos indexados para búsqueda RAG.
3. **pedidos** – Registro de análisis realizados (auditoría).
4. **checklists_templates** – Plantillas de verificación por componente.
5. **checklists_pedido** – Ejecuciones de checklists con firma técnico.
6. **logs_aplicacion** – Logs estructurados de toda actividad.
7. **auditoria_rag** – Trazas completas de ejecuciones RAG (prompts, respuestas, chunks).
8. **incidencias_taller** – Problemas reportados desde taller (feedback loop).
9. **estadisticas_diarias** – Pre-agregadas para dashboards de uso.

**Diseño:** *no se borra nada, solo se marca como archivado* (auditoría histórica permanente).

---

## 5. FLUJO DE USUARIO (TÉCNICO)

```
1. INICIO
   Técnico accede a app: /pedidos/nuevo

2. UPLOAD
   "Arrastra PDF de especificación"
   ↓
   Validación (tamaño, tipo MIME)
   ↓
   
3. ANÁLISIS (Backend)
   Sistema extrae modelos detectados (Gemini LLM)
   → Log auditoría: prompt, respuesta, modelos
   ↓
   Tiempo total: <2 segundos
   
4. REDIRECCIÓN
   Técnico ve: "Procesado. Viendo informe..."
   ↓
   
5. INFORME VISUAL (/pedidos/[id])
   Header: Nº pedido, fecha, 3 componentes detectados
   ↓
   Por cada componente:
   - Código + tipo
   - Documentación vigente (verde) vs histórica (gris)
   - Fragmentos clave con contexto
   - Indicador de relevancia (barra)
   - Checklist integrada: "Verificar tensión 24V ±0.8%"
   - Botón "Reportar incidencia" si hay dudas
   ↓
   
6. ACCIONES
   - "Exportar a PDF" (informe completo, 1 seg)
   - "Marcar checklist completada" (firma técnico + timestamp)
   - "Reportar incidencia" (describe problema, vinculado a doc)
   - "Volver" (histórico de pedidos)
```

**Tiempo total para técnico: 3-5 minutos** (vs 15-30 min manual).

---

## 6. FLUJO ADMIN (INGESTA DE DOCUMENTACIÓN)

```
1. Admin accede: /admin/documentos

2. Upload nuevo documento
   - Selecciona PDF
   - Rellena: tipo_componente, versión, comentarios
   - "Procesar e indexar"
   
3. Backend procesa (batch)
   - Extrae texto PDF
   - Trocea en ~500 fragmentos
   - Calcula embeddings (vectores semánticos)
   - Indexa en MongoDB Vector Search
   - Log INFO: "127 chunks creados en 12 seg"
   
4. Admin ve
   - Estado: "vigente" (listo para búsqueda)
   - Nº chunks, fecha ingesta
   - Si hay doc previo: "Reemplaza v2.0 ✓"
   - Opción: marcar v2.0 como "obsoleto"
   
5. Auditoría
   - Documento está versionado
   - Nunca se borra (auditoría histórica)
   - Cambio de estado = log con usuario + motivo
```

---

## 7. CASOS DE ÉXITO ESPERADOS

### Caso 1: Botonera Estándar
- Técnico sube especificación: "Botonera 4 paradas, inox, 24V DC"
- Sistema detecta: `BTN-1234`
- RAG busca documentación vigente de botoneras
- Muestra: manual v2.1 (enero 2025), fragmentos de montaje + esquema conexión
- Técnico ve checklist: "Verificar tensión 24V", "Comprobar aislamiento", "Testear botones"
- Completa checklist, exporta PDF
- **Tiempo: 4 minutos** (vs 20-30 manual)

### Caso 2: Discrepancia / Documento Ambiguo
- Técnico detecta: manual dice "conectar en paralelo" pero esquema sugiere "serie"
- Reporta incidencia: "Doc ambigua, conexionado confuso"
- Sistema vincula a documento: `Manual_Botoneras_v2.1.pdf`, página 5
- Admin revisa, crea "anotación pública" o marca documento para revisión
- Próxima semana: ingesta v2.2 con esquema mejorado
- **Feedback loop cerrado** → mejora continua

### Caso 3: Auditoría / Inspección Externa
- Inspector pregunta: "¿Cuál documentación usaste para este montaje?"
- Técnico/Admin accede a histórico: `/admin/auditoria`
- Ve: qué documento vigente existía en fecha montaje, qué fragmentos se mostraron, qué checklist se completó
- **100% trazabilidad** → cumplimiento normativo

---

## 8. BENEFICIOS CUANTIFICABLES

| Métrica | Baseline | Target (6 meses) | Impacto |
|---------|----------|------------------|--------|
| **Tiempo consulta doc** | 25 min | 3 min | -88% |
| **Errores conexionado** | 5% | 1% | -80% |
| **Retrabajos** | 3 horas/semana | 1 hora/semana | -67% |
| **Satisfacción técnico** | 60% | 90% | +50% |
| **Trazabilidad** | 30% auditable | 100% auditable | +233% |
| **Adopción interna** | 0% | >80% | +∞ |

**ROI esperado:** Payback en 4–6 meses.

---

## 9. ROADMAP DE IMPLEMENTACIÓN

### Fase 1: MVP (Semanas 1–4)
**Entregar:** Prototipo funcional demostrable.
- Core: análisis, RAG, informe, PDF.
- Admin básico: corpus, logs.
- Deploy en Vercel.
- **Costo:** 160 horas dev.

### Fase 2: Robustez (Semanas 5–12)
**Enfoque:** UX profesional, seguridad, testing.
- Autenticación + roles.
- Checklists con críticos obligatorios.
- Incidencias: reporte desde app.
- Testing: 70%+ cobertura.
- **Costo:** 200 horas dev + 40 QA.

### Fase 3: Integraciones (Semanas 13–24)
**Enfoque:** ERP/MES, observabilidad, escalabilidad.
- API REST para terceros.
- Webhooks (cambios documento).
- Logging centralizado (Axiom/Datadog).
- Alertas automáticas.
- **Costo:** 180 horas dev + infra.

### Fase 4+: Iteración (Continuo)
- Multi-idioma.
- Fine-tuning modelo.
- Mobile app.
- Computer vision (OCR de PDFs scaneados).

---

## 10. RIESGOS Y MITIGACIÓN

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|--------|-----------|
| **Hallucination del LLM** | Media | Medio | Auditoría de RAG, validación chunks, human-in-the-loop |
| **Datos conforme ambiguos** | Media | Medio | Checklist obligatoria para críticos, reporte incidencias |
| **Falta adopción técnicos** | Baja | Alto | UX para taller, formación 1 hora, demostración ROI |
| **Costos cloud inesperados** | Baja | Bajo | Pricing fijo (M10 Atlas), rate limiting, caché |
| **Integración ERP compleja** | Media | Medio | API REST limpia, webhooks standar, documentación clara |

---

## 11. PRESUPUESTO ESTIMADO

### Desarrollo (Fase 1–2)
| Item | Costo |
|------|-------|
| Senior Dev (400h @ €80/h) | €32,000 |
| QA / Testing (40h @ €60/h) | €2,400 |
| Infraestructura setup | €1,500 |
| **Subtotal Dev** | **€35,900** |

### Operación (Año 1)
| Item | Costo Mensual | Anual |
|------|---------------|--------|
| Vercel (pro) | €30 | €360 |
| MongoDB Atlas (M10) | €200 | €2,400 |
| Gemini API (usage-based, est.) | €100 | €1,200 |
| Axiom logs | €50 | €600 |
| Mantenimiento dev (20h/mes) | €1,600 | €19,200 |
| **Subtotal Ops** | **€1,980** | **€23,760** |

**Total Inversión Año 1: €59,660**  
**Break-even esperado: Mes 4–6** (ROI: 150–200% anual)

---

## 12. NEXT STEPS

1. **Aprobación conceptual** (esta semana)
2. **Kick-off con equipo técnico** (inicio siguiente semana)
3. **Prototipo funcional en Vercel** (fin semana 4)
4. **Demo a stakeholders + feedback** (semana 5)
5. **Refinamiento UX + testing** (semanas 6–10)
6. **Rollout piloto en taller** (semana 12)
7. **Iteración basada en feedback real** (semanas 13+)

---

## CONCLUSIÓN

Este sistema es una **oportunidad clara de mejora operacional** con:
- ✅ **ROI demostrable** en 4–6 meses.
- ✅ **Riesgos técnicos manejables** (stack probado, no experimental).
- ✅ **Escalabilidad desde MVP a producción** sin reescrituras.
- ✅ **Posicionamiento competitivo:** trazabilidad + IA = diferenciador en el mercado.

**Recomendación:** Proceder con Fase 1 inmediatamente. MVP funcional en 4 semanas, demo a técnicos en semana 5 para validar adopción temprana.

---

**Documento preparado por:** Consultoría Senior en Ingeniería Software & IA  
**Fecha:** 21 de enero de 2026  
**Estado:** Listo para presentación ejecutiva
