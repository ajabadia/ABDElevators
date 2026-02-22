/**
 * 🤖 Mapeo Funcional de Modelos de IA
 * Centraliza la selección de modelos por propósito para facilitar migraciones y pruebas.
 * Siguiendo la recomendación del usuario para des-hardcodear Gemini 1.5.
 */

import { AI_MODEL_IDS } from '@abd/platform-core';

export const AIMODELIDS = {
    // RAG / Búsqueda con documentos
    RAG_GENERATOR: process.env.RAG_GENERATOR_MODEL ?? AI_MODEL_IDS.GEMINI_2_5_FLASH,
    RAG_QUERY_REWRITER: process.env.RAG_QUERY_REWRITER_MODEL ?? AI_MODEL_IDS.GEMINI_2_5_FLASH,
    RAG_RELEVANCE_GRADER: process.env.RAG_RELEVANCE_GRADER_MODEL ?? AI_MODEL_IDS.GEMINI_2_5_FLASH,
    RAG_HALLUCINATION_GRADER: process.env.RAG_HALLUCINATION_MODEL ?? AI_MODEL_IDS.GEMINI_2_5_FLASH,
    RAG_ANSWER_GRADER: process.env.RAG_ANSWER_GRADER_MODEL ?? AI_MODEL_IDS.GEMINI_2_5_FLASH,

    // Workflows / Orquestación
    WORKFLOW_ROUTER: process.env.WORKFLOW_ROUTER_MODEL ?? AI_MODEL_IDS.GEMINI_2_5_FLASH,
    WORKFLOW_NODE_ANALYZER: process.env.WORKFLOW_NODE_ANALYZER_MODEL ?? AI_MODEL_IDS.GEMINI_2_5_FLASH,
    WORKFLOW_GENERATOR: process.env.WORKFLOW_GENERATOR_MODEL ?? AI_MODEL_IDS.GEMINI_2_5_PRO,

    // Ontología y grafo
    ONTOLOGY_REFINER: process.env.ONTOLOGY_REFINER_MODEL ?? AI_MODEL_IDS.GEMINI_2_5_PRO,
    GRAPH_EXTRACTOR: process.env.GRAPH_EXTRACTOR_MODEL ?? AI_MODEL_IDS.GEMINI_2_5_FLASH,
    QUERY_ENTITY_EXTRACTOR: process.env.QUERY_ENTITY_EXTRACTOR_MODEL ?? AI_MODEL_IDS.GEMINI_2_5_FLASH,

    // Chunking avanzado
    CHUNKING_LLM_CUTTER: process.env.CHUNKING_LLM_CUTTER_MODEL ?? AI_MODEL_IDS.GEMINI_2_5_PRO,

    // Informes y QA genérico
    REPORT_GENERATOR: process.env.REPORT_GENERATOR_MODEL ?? AI_MODEL_IDS.GEMINI_2_5_FLASH,
    QUICK_QA: process.env.QUICK_QA_MODEL ?? AI_MODEL_IDS.GEMINI_2_5_FLASH,
} as const;
