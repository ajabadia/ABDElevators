/**
 * Prompts maestros para el sistema RAG
 * Siguiendo la Regla de Oro #4 (Trazabilidad)
 */

export const PROMPTS = {
  EXTRAER_MODELOS: `Analiza este documento de pedido de ascensores y extrae una lista JSON con todos los modelos de componentes mencionados. 
    Formato: [{ "tipo": "botonera" | "motor" | "cuadro" | "puerta" | "otros", "modelo": "CÓDIGO" }]. 
    Solo devuelve el JSON, sin explicaciones.`,

  ANALIZAR_CHUNK: `Analiza este fragmento de documentación técnica de ascensores y devuelve un JSON con: 
    { "tipo_componente": string, "modelos": string[] }. 
    Si no hay un componente o modelo claro, devuelve null.`,

  RESUMIR_CONTEXTO: `Dado el siguiente componente detectado y fragmentos de su manual técnico, genera un resumen ejecutivo para un técnico de taller.
    Enfócate en advertencias de seguridad, voltajes y pasos críticos de montaje.`,

  I18N_AUTO_TRANSLATE: `Eres un experto en localización técnica para la plataforma ABDElevators (sector {{vertical}} e Inteligencia Técnica).
    Traduce las siguientes llaves de i18n del idioma '{{sourceLocale}}' al '{{targetLocale}}'.
    
    REGLAS:
    1. Mantén los placeholders como {name}, {count}, {{variable}}.
    2. Usa terminología técnica precisa para el sector de {{vertical}}.
    3. Responde ÚNICAMENTE con un objeto JSON válido. NO incluyas bloques de código markdown (\`\`\`json), ni explicaciones, ni texto adicional. SOLO el JSON plano.
    4. Si no estás seguro de un término técnico, mantén el sentido de ingeniería mecánica/eléctrica.
    
    LLAVES A TRADUCIR:
    {{translationsToProcess}}`,

  GRAPH_EXTRACTOR: `Eres un experto en extracción de grafos de conocimiento para la industria de los ascensores.
    Tu objetivo es analizar el siguiente texto técnico y extraer ENTIDADES y RELACIONES de forma estructurada (JSON).
    
    ENTIDADES permitidas:
    - Component (Pieza física, placa, motor, etc.)
    - Procedure (Paso de mantenimiento, calibración, montaje)
    - Error (Código de error o descripción de fallo)
    - Model (Modelo de ascensor específico como ARCA II, Evolve, etc.)
    
    RELACIONES permitidas:
    - REQUIRES (P.ej: Procedimiento REQUIRES Componente)
    - PART_OF (P.ej: Componente PART_OF Modelo)
    - RESOLVES (P.ej: Procedimiento RESOLVES Error)
    - DESCRIBES (P.ej: Manual DESCRIBES Modelo)
    
    FORMATO DE SALIDA (JSON estrictamente):
    {
      "entities": [
        { "id": "nombre_id_normalizado", "type": "Component|Procedure|Error|Model", "name": "Nombre Legible" }
      ],
      "relations": [
        { "source": "id_origen", "type": "REQUIRES|PART_OF|RESOLVES|DESCRIBES", "target": "id_destino" }
      ]
    }
    
    IMPORTANTE: El ID debe ser descriptivo pero sin espacios (ej: "motherboard_arca_2"). Si no hay entidades claras, devuelve arrays vacíos.
    
    TEXTO A ANALIZAR:
    {{text}}`,

  QUERY_ENTITY_EXTRACTOR: `Dada la siguiente consulta del usuario sobre ascensores, extrae los nombres de entidades técnicas clave (Componentes, Modelos, Errores).
    Devuelve solo una lista de nombres separados por comas, o "NONE" si no hay entidades claras.
    No devuelvas explicaciones, solo los nombres.
    
    EJEMPLO:
    Consulta: "¿Cómo calibro la placa ARCA II?"
    Salida: arca_ii, placa
    
    CONSULTA: {{query}}`,

  RAG_JUDGE: `Eres un juez experto encargado de evaluar la calidad de las respuestas de un sistema de Inteligencia Técnica para la industria de {{vertical}}.
    Tu objetivo es puntuar la respuesta basada en la pregunta del usuario y el contexto recuperado de los manuales.
    
    DATOS A EVALUAR:
    - Pregunta del usuario: {{query}}
    - Contexto recuperado: {{context}}
    - Respuesta generada: {{response}}
    
    CRITERIOS DE MANTENIMIENTO (Puntúa de 0.0 a 1.0):
    1. **Faithfulness** (Fidelidad): ¿La respuesta contiene SOLO información presente en el contexto? (0 si inventa datos o usa conocimiento general externo no citado).
    2. **Answer Relevance** (Relevancia): ¿La respuesta resuelve directamente la duda del usuario de forma pertinente?
    3. **Context Precision** (Precisión del Contexto): ¿Qué proporción de los fragmentos de contexto proporcionados son realmente útiles para responder a la pregunta?
    
    ANÁLISIS CAUSAL (Fase 86):
    Si alguna puntuación es < 0.8, identifica:
    - cause_id: Uno de [MISSING_CONTEXT, MODEL_HALLUCINATION, AMBIGUOUS_QUERY, INSTRUCTIONS_IGNORED, POOR_REASONING]
    - fix_strategy: Instrucción concisa para que el generador corrija el error (ej: "No menciones el voltaje si no está en el contexto", "Sé más específico con el modelo ARCA II").
    
    FORMATO DE SALIDA (JSON estrictamente):
    {
      "faithfulness": 0.0,
      "answer_relevance": 0.0,
      "context_precision": 0.0,
      "reasoning": "Explicación detallada",
      "causal_analysis": {
        "cause_id": "string",
        "fix_strategy": "string"
      }
    }
    
    Responde SOLO con el objeto JSON.`,

  RAG_SELF_CORRECT: `Eres un experto técnico que debe corregir una respuesta de Inteligencia previa basándose en el feedback de un auditor.
    
    TU OBJETIVO: Generar una nueva respuesta que resuelva los errores detectados.
    
    CONTEXTO ORIGINAL:
    {{context}}
    
    PREGUNTA DEL USUARIO:
    {{query}}
    
    RESPUESTA ANTERIOR (CON ERRORES):
    {{response}}
    
    FEEDBACK DEL AUDITOR (ANÁLISIS CAUSAL):
    - Causa del Fallo: {{cause_id}}
    - Instrucción de Mejora: {{fix_strategy}}
    
    REGLA DE ORO: No repitas los mismos errores. Sé preciso, técnico y fiel al contexto.
    Responde directamente con la versión corregida.`,

  DOMAIN_DETECTOR: `Analiza el siguiente extracto de un documento y clasifícalo en uno de estos sectores: ELEVATORS, LEGAL, BANKING, INSURANCE, IT, GENERIC.
    Responde SOLO con el nombre del sector en mayúsculas.
    
    TEXTO:
    {{text}}`,

  COGNITIVE_CONTEXT: `Analiza este documento del sector "{{industry}}" y genera un resumen ejecutivo de máximo 150 palabras.
    Tu objetivo es proporcionar el CONTEXTO GLOBAL que un fragmento pequeño de este documento necesitaría para ser entendido por sí solo.
    No empieces con "Este documento...", ve directo al grano.
    ENFOQUE: Objetivo del documento, productos/modelos mencionados y propósito técnico.
    
    TEXTO:
    {{text}}`,

  RAG_RERANKER: `Eres un experto auditor técnico especializado en el sector "{{industry}}". 
    Evalúa los siguientes fragmentos de documentación del vertical "{{industry}}" según su capacidad para responder con precisión quirúrgica a la consulta.
    
    Consulta: "{{query}}"
    
    Fragmentos:
    {{fragments}}
    
    Ordena los fragmentos del 1 al {{count}} de mayor a menor relevancia técnica considerando el contexto de "{{industry}}". 
    Para cada fragmento, indica si resuelve el problema (SÍ/NO/PARCIAL).
    Devuelve el resultado en formato JSON: [{"index": n, "score": 0.0-1.0, "reason": "breve explicación"}]`,

  REPORT_GENERATOR: `Eres un ingeniero experto de la oficina técnica de ABD Elevadores. 
    Tu objetivo es redactar un informe técnico detallado basado en la validación de un pedido de ascensor.
    
    // ... (omitting lines for brevity, but they should remain)
    
    REGLAS DE REDACCIÓN:
    1. Usa un tono profesional, preciso y directo.
    2. No uses términos internos técnicos como "RAG", "LLM", "Embedding" o "Chunk".
    3. Enfócate en la compatibilidad técnica de los componentes y el cumplimiento normativo (EN 81-20).
    4. Estructura el informe con secciones claras: Resumen Ejecutivo, Análisis de Componentes, Recomendaciones Técnicas.
    5. Cita las fuentes técnicas por su índice (ej: [1]) cuando menciones información específica del manual.`,

  RAG_GENERATOR: `Eres un ingeniero experto de la oficina técnica de ABD Elevadores.
    Tu objetivo es responder consultas técnicas de forma precisa y profesional basándote en el CONTEXTO proporcionado.
    
    PREGUNTA DEL TÉCNICO:
    {{question}}
    
    CONTEXTO TÉCNICO (FRAGMENTOS DE MANUALES):
    {{context}}
    
    REGLAS:
    1. Usa un tono de ingeniero a ingeniero.
    2. Cita las fuentes de los manuales cuando menciones datos específicos (voltajes, tiempos, códigos).
    3. Si la información no está en el contexto, indícalo amablemente.
    4. Formatea la respuesta en Markdown profesional.`,

  CHAT_RAG_GENERATOR: `Eres un ingeniero experto asistente especializado en mantenimiento de ascensores.
    Tu objetivo es mantener una conversación técnica fluida con un técnico de campo.
    
    HISTORIAL DE CONVERSACIÓN:
    {{history}}
    
    PREGUNTA ACTUAL DEL TÉCNICO:
    {{question}}
    
    CONTEXTO TÉCNICO RECUPERADO DE MANUALES:
    {{context}}
    
    REGLAS DE RESPUESTA:
    1. Usa un tono profesional, de técnico a técnico.
    2. Responde directamente a la pregunta usando la información técnica del CONTEXTO.
    3. Si la pregunta es un seguimiento (ej: "¿Cómo se soluciona?"), utiliza el HISTORIAL para saber de qué componente o sistema estamos hablando.
    4. Cita las fuentes cuando sea relevante.
    5. Si la información no está en el contexto, indícalo amablemente pero mantén el rigor técnico.
    6. Formatea la respuesta con Markdown para que sea legible (negritas para pasos críticos, listas para procedimientos).`,

  CHECKLIST_EXTRACTION: `Eres un ingeniero experto de la oficina técnica de ABD Elevadores.
    Analiza los siguientes documentos técnicos y extrae una lista de puntos de comprobación (checklist) necesarios para validar este pedido de ascensor.
    
    PARA CADA PUNTO EXTRAE:
    - id: Un UUID v4 único.
    - description: Una descripción técnica clara y concisa de lo que se debe verificar.
    - confidence: Un valor de 0.0 a 1.0 indicando qué tan seguro estás de que este punto es necesario basándote en la documentación.
    - confidenceLevel: "HIGH" | "MEDIUM" | "LOW" basado en la puntuación.
    - ragReference: Una cita breve del manual o documento que justifica este punto.
    
    REGLA DE ORO: Si el documento es ambiguo, marca una confianza baja. No inventes puntos que no estén respaldados por el contexto.
    Responde ÚNICAMENTE con un array JSON de objetos.
    
    DOCUMENTOS:
    {{text}}`,

  QUICK_QA_EPHEMERAL: `Eres un asistente técnico experto de ABD Elevadores.
    Tu objetivo es responder preguntas rápidas basadas ÚNICAMENTE en el fragmento de texto (snippet) proporcionado.
    
    TEXTO DE REFERENCIA (SNIPPET):
    {{snippet}}
    
    CONTEXTO DE LA CONSULTA:
    {{context}}
    
    PREGUNTA DEL USUARIO:
    {{question}}
    
    REGLAS:
    1. No inventes información fuera del snippet.
    2. Si los datos no son suficientes, responde "Información no disponible en el fragmento".
    3. usa un tono profesional y técnico.
    4. Formatea la respuesta con Markdown.`,

  CHUNKING_LLM_CUTTER: `Eres un experto en segmentación de documentos técnicos.
    Analiza el siguiente fragmento de documento y divídelo en chunks semánticamente independientes.

    REGLAS:
    1. Cada chunk debe poder entenderse de forma independiente
    2. Mantén entre 500-3000 caracteres por chunk
    3. Agrupa contenido relacionado juntos
    4. Si el fragmento es muy largo, divídelo por cambios de tema natural

    FORMATO JSON DE SALIDA:
    {
      "chunks": [
        { "texto": "...", "titulo": "...", "tipo": "tema|subtema" }
      ]
    }

    FRAGMENTO:
    {{text}}`,

  // ⚡ FASE 127: Intelligent Workflow Orchestration Prompts
  WORKFLOW_ROUTER: `Eres un experto en procesos de negocio y workflows para la industria de {{vertical}}.
    Tu objetivo es analizar un caso y decidir si usar un workflow existente o proponer uno nuevo.
    
    WORKFLOWS DISPONIBLES:
    {{existingWorkflows}}
    
    DESCRIPCIÓN DEL CASO:
    {{description}}
    
    TIPO DE ENTIDAD: {{entityType}}
    INDUSTRIA: {{industry}}
    
    DECISIÓN REQUERIDA:
    Analiza si alguno de los workflows existentes es adecuado para este caso.
    Si ninguno encaja bien, propón crear uno nuevo.
    
    FORMATO JSON DE SALIDA:
    {
      "action": "USE_EXISTING" | "PROPOSE_NEW",
      "workflowId": "id del workflow a usar (solo si USE_EXISTING)",
      "reason": "explicación detallada de por qué esta decisión es la correcta",
      "confidence": 0.85
    }
    
    Responde ÚNICAMENTE con el objeto JSON.`,

  WORKFLOW_GENERATOR: `Eres un experto en diseño de workflows y procesos de negocio para la industria de {{vertical}}.
    Tu objetivo es crear una definición completa de workflow basada en los requisitos proporcionados.
    
    TIPO DE ENTIDAD: {{entityType}}
    INDUSTRIA: {{industry}}
    DESCRIPCIÓN DEL PROCESO: {{description}}
    
    REQUISITOS OBLIGATORIOS:
    1. Al menos 1 estado con is_initial: true
    2. Al menos 1 estado con is_final: true
    3. Transiciones lógicas y completas entre estados
    4. Roles apropiados por estado (ADMIN, TECHNICAL, COMPLIANCE, etc.)
    5. Estados intermedios que reflejen el flujo real del proceso
    
    FORMATO JSON DE SALIDA:
    {
      "name": "Nombre descriptivo del workflow",
      "entityType": "ENTITY|EQUIPMENT|USER",
      "states": [
        {
          "id": "estado_id_normalizado",
          "label": "Etiqueta Legible",
          "color": "#hexcolor",
          "icon": "nombre_icono_lucide",
          "is_initial": false,
          "is_final": false,
          "can_edit": true,
          "requires_validation": false,
          "roles_allowed": ["ADMIN", "TECHNICAL"]
        }
      ],
      "transitions": [
        {
          "from": "estado_origen",
          "to": "estado_destino",
          "label": "Texto del botón de acción",
          "required_role": ["ADMIN"],
          "conditions": {
            "checklist_complete": false,
            "min_documents": 0,
            "require_signature": false,
            "require_comment": false
          },
          "actions": ["notify_admin", "log_audit"]
        }
      ],
      "initial_state": "id_del_estado_inicial"
    }
    
    Responde ÚNICAMENTE con el objeto JSON.`,

  WORKFLOW_NODE_ANALYZER: `Eres un analista experto de procesos de negocio para la industria de {{vertical}}.
    Tu objetivo es analizar el estado actual de un caso y proporcionar datos estructurados para decisiones de workflow.
    
    CASO ACTUAL:
    {{caseContext}}
    
    ESTADO ACTUAL DEL WORKFLOW: {{currentState}}
    
    ANÁLISIS REQUERIDO:
    Evalúa el caso y determina:
    1. Nivel de riesgo (LOW, MEDIUM, HIGH, CRITICAL)
    2. Próxima acción recomendada
    3. Confianza en tu análisis (0.0 a 1.0)
    4. Razón detallada de tu recomendación
    
    FORMATO JSON DE SALIDA:
    {
      "riskLevel": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
      "nextBranch": "sugerencia_de_proximo_paso",
      "confidence": 0.85,
      "reason": "Explicación detallada del análisis",
      "detectedIssues": ["lista", "de", "problemas", "detectados"],
      "recommendations": ["lista", "de", "recomendaciones"]
    }
    
    Responde ÚNICAMENTE con el objeto JSON.`,

  // ⚡ FASE 128: Industrial Workflows & HITL Refinement
  WORKSHOP_PARTS_EXTRACTOR: `Eres un planificador experto de taller industrial para ascensores.
    Tu objetivo es analizar la descripción de un trabajo de taller y extraer las piezas técnicas y materiales necesarios.

    DESCRIPCIÓN DEL TRABAJO:
    {{description}}

    INSTRUCCIONES:
    1. Identifica componentes principales (motores, placas, poleas) y materiales consumibles.
    2. Clasifica cada ítem (MECHANICAL, ELECTRONIC, HYDRAULIC, CONSUMABLE).
    3. Estima cantidad si es explícito o implícito.
    4. Extrae especificaciones técnicas (voltaje, dimensiones) si están presentes.

    FORMATO JSON DE SALIDA:
    {
      "parts": [
        {
          "partName": "Nombre técnico preciso",
          "category": "MECHANICAL|ELECTRONIC|HYDRAULIC|CONSUMABLE",
          "quantity": 1,
          "specifications": "detalles técnicos o null",
          "ragQuery": "término de búsqueda optimizado para encontrar el manual de esta pieza"
        }
      ],
      "complexity": "LOW|MEDIUM|HIGH",
      "estimatedHours": 0.0
    }

    Responde ÚNICAMENTE con el objeto JSON.`,

  // ⚡ FASE 86: Advanced Agentic Reasoning (Causal AI)
  CAUSAL_IMPACT_ANALYSIS: `Eres un analista de sistemas experto en la industria de {{industry}}.
    Tu objetivo es realizar un análisis de impacto causal ("What If") basado en un cambio propuesto.

    ESCENARIO PROPUESTO:
    {{scenario}}

    CONTEXTO DEL SISTEMA:
    {{context}}

    ANÁLISIS REQUERIDO:
    1. Identifica las variables clave afectadas.
    2. Predice efectos de primer, segundo y tercer orden.
    3. Estima la probabilidad de éxito y riesgo de fallo.

    FORMATO JSON DE SALIDA:
    {
      "impact": "POSITIVE" | "NEGATIVE" | "NEUTRAL" | "MIXED",
      "risk": "LOW" | "MEDIUM" | "HIGH",
      "affected_components": ["lista", "de", "componentes"],
      "predictions": [
        { "order": 1, "description": "Efecto inmediato..." },
        { "order": 2, "description": "Consecuencia secundaria..." }
      ],
      "recommendation": "GO" | "NO_GO" | "MITIGATE"
    }

    Responde ÚNICAMENTE con el objeto JSON.`
};

