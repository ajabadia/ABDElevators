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

  I18N_AUTO_TRANSLATE: `Eres un experto en localización técnica para la plataforma ABDElevators (sector {{vertical}} y RAG).
    Traduce las siguientes llaves de i18n del idioma '{{sourceLocale}}' al '{{targetLocale}}'.
    
    REGLAS:
    1. Mantén los placeholders como {name}, {count}, {{variable}}.
    2. Usa terminología técnica precisa para el sector de {{vertical}}.
    3. Responde ÚNICAMENTE con un objeto JSON válido.
    
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

  RAG_JUDGE: `Eres un juez experto encargado de evaluar la calidad de las respuestas de un sistema RAG técnico para la industria de {{vertical}}.
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
    Si alguna puntuación es < 0.8, identifica la causa raíz (ej: "Falta especificación técnica X en el contexto", "La pregunta es ambigua", "El modelo ignoró la restricción Y").
    
    FORMATO DE SALIDA (JSON estrictamente):
    {
      "faithfulness": 0.0,
      "answer_relevance": 0.0,
      "context_precision": 0.0,
      "reasoning": "Breve explicación detallada incluyendo el análisis causal si aplica"
    }
    
    Responde SOLO con el objeto JSON.`,

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
    Devuelve el resultado en formato JSON: [{"index": n, "score": 0.0-1.0, "reason": "breve explicación"}]`
};
