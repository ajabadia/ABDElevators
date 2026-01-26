# 📋 GUÍA IMPLEMENTACIÓN: Qué hacer (sin código)

**Para:** Programadores  
**Objetivo:** Pasar de RAG básico → Agentic multilingual en 3 semanas  
**Formato:** Tareas concretas, no código

---

## 🎯 PROBLEMA ACTUAL

App está 60% lista:
- ✅ Plataforma SaaS funciona (auth, multi-tenant, billing)
- ✅ RAG básico ES funciona
- ❌ **NO es agentic** (falta LangGraph)
- ❌ **NO es multilingual** (falta BGE-M3)
- ❌ **Workflows son placeholder** (sin lógica)
- ❌ **Admin UI incompleta** (falta 40%)

**Resultado:** Prototipo, no producto vendible.

---

## 📅 SEMANA 1: LangGraph + BGE-M3 (Lunes-Viernes)

### **LUNES: Setup + Instalaciones**
- [ ] Instalar dependencias LangGraph (langchain, langgraph, langsmith)
- [ ] Instalar dependencias embedding (transformers, chromadb)
- [ ] Crear carpetas estructura: `/lib/agents`, `/lib/embeddings`, `/lib/workflows`
- [ ] Crear endpoints base: `/api/agents`, `/api/workflows`
- [ ] Verificar `npm run dev` sin errores

### **MARTES: BGE-M3 Embeddings**
- [ ] Crear módulo embeddings que:
  - Carga modelo BGE-M3 (multilingual #1 MTEB)
  - Inicializa Chroma Cloud (vector DB gratis)
  - Define función `indexDocument(tenantId, doc)` que:
    - Toma doc con contenido + metadata (idioma, materia, frecuencia)
    - Crea embedding BGE-M3 (1024 dimensiones)
    - Indexa en Chroma
    - Si es high-frequency (>50 queries): dual-index (original + traducción ES)
- [ ] Crear datos de prueba: 20 docs FATCA/CRS ES/EN/FR
- [ ] Test: Buscar "TIN España" → recupera docs ES/EN/FR relevantes

### **MIÉRCOLES: LangGraph Core**
- [ ] Crear workflow base con nodos:
  - **Parser**: toma input usuario, detecta idioma, extrae contexto
  - **Retriever**: BGE-M3 busca documentos relevantes (multiidioma)
  - **Generator**: Gemini 1.5 Pro analiza + responde
  - **Validator**: Comprueba confidence, decide si retry o finish
- [ ] Implementar transiciones entre nodos (edges)
- [ ] Test: Ejecutar workflow → ver trace pasos 1→2→3→4

### **JUEVES: Workflow BANCO (TIN/CRS)**
- [ ] Crear workflow específico "BANCO" que:
  - **Node 1 (Extract):** Parsea PDF, extrae TIN, residencia
  - **Node 2 (Validate TIN):** Revisa formato TIN España (12345678Z)
  - **Node 3 (Check CRS):** Valida residencia fiscal
  - **Node 4 (Generate):** Crea informe JSON:
    ```
    {
      tin_valid: boolean,
      crs_ok: boolean,
      flags: [{type, severity}],
      confidence: 0.95,
      pdf_report_url: string,
      next_actions: ["action1", "action2"]
    }
    ```
  - Incluye retries si confidence baja
- [ ] Test: Upload PDF → retorna JSON con resultado

### **VIERNES: API + UI**
- [ ] Crear endpoint POST `/api/workflows/banco/execute`
  - Input: `{input: string, tenant_id: string}`
  - Output: JSON workflow result + trace pasos
- [ ] Actualizar `/chat` UI:
  - Selector workflow: [Banco ▼] [Abogado ▼] [Ascensor ▼]
  - Mostrar live trace: "🔍 Parser OK", "📚 Retriever 5 docs", etc.
  - Mostrar resultado final
- [ ] Test E2E: Enviar query → ver trace completo

**FIN SEMANA 1 CHECKPOINT:**
- [ ] `npm run build` sin errores
- [ ] POST `/api/workflows/banco/execute` retorna JSON
- [ ] `/chat` carga y funciona
- [ ] Query ES → retorna citas EN/FR + respuesta ES

---

## 📅 SEMANA 2: Workflows Sectoriales + Dual-Index (Lunes-Viernes)

### **LUNES: Dual-Index FATCA/CRS**
- [ ] Crear herramienta que identifique docs high-frequency:
  - FATCA Chapter 1-3 (regulación oficial EN)
  - CRS Handbook (oficial EN)
  - Documentar en Mongo: `doc.frequency` = count queries
- [ ] Para cada doc high-freq:
  - Traducir a ES (usar Gemini translate)
  - Indexar AMBAS versiones en Chroma (dual)
  - Marcar en Mongo: `dual_index: true`
- [ ] Crear estrategia retrieval:
  - Priorizar dual-indexed docs
  - Si query ES + doc dual → devuelve ambas versiones
  - Mantener track de cuál es original vs traducción

### **MARTES-MIÉRCOLES: Workflow ABOGADO (Contratos)**
- [ ] Crear workflow específico "ABOGADO" que:
  - **Node 1:** Parsea contrato PDF
  - **Node 2:** Busca cláusulas riesgosas (via BGE-M3 retrieval)
  - **Node 3:** Detecta conflictos legales (cruzar con jurisprudencia)
  - **Node 4:** Genera informe:
    ```
    {
      riesgos: [{clause, severidad, recomendacion}],
      conflictos_legales: [{tipo, referencia}],
      confidence: number,
      next_actions: []
    }
    ```
- [ ] Test: Upload contrato → detecta riesgos reales

### **JUEVES-VIERNES: Workflow ASCENSOR + Chroma Cloud**
- [ ] Crear workflow "ASCENSOR" que:
  - **Node 1:** Parsea manual mantenimiento
  - **Node 2:** Chequea compliance normativas EU (EN 81-2050)
  - **Node 3:** Genera checklist mantenimiento
  - **Node 4:** Output:
    ```
    {
      compliance_ok: boolean,
      missing_items: [],
      maintenance_schedule: {},
      confidence: number
    }
    ```
- [ ] Completar Chroma Cloud integration:
  - Migrate todos los embeddings de memoria → Chroma Cloud free tier
  - Test: Persistencia entre redeploys
  - Verify: Namespaces por tenant funcionan

**FIN SEMANA 2 CHECKPOINT:**
- [ ] 3 workflows sectoriales retornan lógica real (no placeholder)
- [ ] BGE-M3 busca EN/FR → retorna EN/FR + respuesta ES
- [ ] Dual-index FATCA/CRS activo
- [ ] Chroma Cloud funcionando (10GB free OK)
- [ ] **RESULTADO:** Producto VENDIBLE

---

## 📅 SEMANA 3: Admin UI + Production (Lunes-Viernes)

### **LUNES-MIÉRCOLES: Admin UI Features**
- [ ] **Knowledge Base Management** (`/admin/knowledge-base`):
  - Árbol visual: FATCA → Ch1/Ch2/Ch3, CRS → Handbook, etc.
  - Por cada doc:
    - [Ver original PDF]
    - [Dual-index ES toggle]
    - [Stats: X consultas este mes]
    - [Indexar si no está]
  - Bulk upload ZIP con auto-extract
  
- [ ] **Workflow Visual Editor** (`/admin/workflows`):
  - Mostrar cada workflow como diagrama:
    - Nodos: Parser → Retriever → Validator → Generator
    - Edges: flechas transiciones
    - Poder editar parámetros (umbrales confidence, etc.)
  
- [ ] **Agent Trace Viewer** (`/admin/agents`):
  - Dashboard tiempo real con:
    - Queries en progreso (live)
    - Tiempo por nodo (Parser 0.5s, Retriever 1.2s, etc.)
    - Cost tokens reales (Gemini API)
    - Errores/retries
  
- [ ] **Metrics Dashboard** (`/admin/metrics`):
  - RAG accuracy: % respuestas >90% confidence
  - Latencia: P50, P95, P99
  - Cost evolution: €/día, tendencias

### **JUEVES: Security Audit**
- [ ] RBAC verify:
  - SuperAdmin → todo
  - TenantAdmin → su tenant + su users
  - User → solo analyse (no admin)
- [ ] Data isolation:
  - User1 de Tenant A no ve Tenant B
  - Documents filtradas por tenant_id
  - Workflows filtrados por tenant permisos
- [ ] API security:
  - Rate limiting activo
  - Input validation Zod
  - CORS configurado
  - No data leaks en errors

### **VIERNES: Deploy Production**
- [ ] Vercel:
  - Build optimizado
  - Environment vars configuradas
  - Redeploy test OK
- [ ] MongoDB:
  - Schema migrations ejecutadas
  - Índices creados (tenant_id, language, etc.)
  - Backup configured
- [ ] Chroma Cloud:
  - API key segura (env var)
  - Persistencia verificada
- [ ] Monitoring:
  - Sentry para errors
  - LangSmith para traces agentic

**FIN SEMANA 3 CHECKPOINT:**
- [ ] Vercel deploy sin errores
- [ ] Admin UI completa y funcional
- [ ] RBAC + data isolation verified
- [ ] Métricas en tiempo real
- [ ] **LISTO PARA CLIENTES**

---

## 📅 SEMANA 4+: Go-to-Market

### **Actividades (paralelo a development)**
- [ ] Landing page: demo video 2min de workflows
- [ ] Email outreach: Bancos, abogados, empresas ascensores
- [ ] Pricing:
  - Free: 100 docs/mes
  - Pro: 10k docs/mes + workflows
  - Enterprise: unlimited + custom
- [ ] Setup Stripe/Resend (ya existe, solo configurar)
- [ ] Onboarding docs para clientes

---

## ✅ CHECKLIST VERIFICACIÓN (Test cada semana)

### **SEMANA 1 FINAL:**
```
[ ] npm run build → sin errores
[ ] POST /api/workflows/banco {"input":"TIN 12345678Z"} → JSON válido
[ ] /chat carga sin console errors
[ ] Mensajes incluyen trace: [Parser] [Retriever] [Generator]
[ ] Response time <5s
```

### **SEMANA 2 FINAL:**
```
[ ] 3 workflows ejecutan sin errores (banco, abogado, ascensor)
[ ] Dual-index FATCA/CRS: Query ES → cita EN traducida + respuesta ES
[ ] Chroma Cloud persist: redeploy no pierde datos
[ ] BGE-M3 accuracy: 95%+ recall multiidioma
[ ] Confidence scores > 0.9
```

### **SEMANA 3 FINAL:**
```
[ ] /admin/knowledge-base cargue y lista docs
[ ] /admin/workflows muestre diagramas
[ ] /admin/agents muestre traces en vivo
[ ] /admin/metrics tenga gráficos
[ ] RBAC: User no accede a /admin
[ ] Vercel deploy OK sin downtime
```

---

## 🚨 ERRORES COMUNES A EVITAR

```
❌ Instalar LangGraph pero no usar StateGraph (overhead sin beneficio)
❌ Usar Gemini embedding en lugar de BGE-M3 (pierdes multiidioma)
❌ Workflows con lógica dummy (if random return OK) → test fallará
❌ No implementar dual-index → clientes EU sin valor
❌ Admin UI sin métricas reales → no vendible enterprise
❌ Deploy sin RBAC tested → data leak de seguridad
❌ Workflow traces no visible → no sabes qué pasa
```

---

## 📊 DEFINICIONES (para programadores desconocedores RAG)

| Término | Significa | Para qué |
|---------|-----------|----------|
| **LangGraph** | Orquestador de flujos multi-paso con IA | Pasos: Parser→Retriever→Validator→Generate en orden |
| **BGE-M3** | Embedding model #1 MTEB (multiidioma) | Convertir textos ES/EN/FR/DE/IT a vectores comparables |
| **Chroma Cloud** | Vector DB gratis en cloud | Almacenar 10GB embeddings (documentos indexados) |
| **Dual-index** | Indexar doc original + traducción | Query ES busca en índice EN/FR/DE también |
| **Confidence score** | Métrica 0-1 de cuán seguro es resultado | 0.95 = muy seguro, 0.5 = incierto, retry |
| **Trace** | Registro de cada paso del workflow | Ver: Parser 0.2s, Retriever 1.1s, Generator 2.3s |
| **Workflow** | Nodos conectados (grafo acíclico dirigido) | Flujo: [Input] → [Node1] → [Node2] → [Output] |
| **RBAC** | Role-based access control | Diferentes permisos por rol (SuperAdmin/TenantAdmin/User) |

---

## 📞 DUDAS FRECUENTES PROGRAMADOR

**P: ¿Por qué Chroma Cloud en vez de Pinecone?**  
R: Gratis (10GB), open-source, migración fácil después. Pinecone cuesta $70/mes.

**P: ¿BGE-M3 necesita GPU?**  
R: No, corre CPU. Vercel CPU OK. Latencia <200ms con quantization.

**P: ¿Cuántos tokens gasto en Gemini con workflows?**  
R: ~2000 tokens/query (retrieval + generation). A $0.001/1k = $0.002/query.

**P: ¿Chroma vs MongoDB vector search?**  
R: Chroma: especializado, simple, gratis. MongoDB: integrado, caro ($20+).

**P: ¿Puedo hacer esto en 3 semanas solo?**  
R: Sí, si eres full-stack. Sino, necesitas 1 más en UI/Admin.

---

**Listo. Esto es todo lo que necesita saber un programador para implementar.**

