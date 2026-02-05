import { callGeminiMini } from '@/lib/llm';
import { AppError } from '@/lib/errors';

/**
 * 🧠 Cognitive Retrieval Service (Phase 102)
 * Generates document-level context to enrich individual chunks.
 */
export class CognitiveRetrievalService {
    /**
     * Generates a concise context header for the entire document.
     */
    static async generateDocumentContext(
        text: string,
        industry: string,
        tenantId: string,
        correlationId?: string
    ): Promise<string> {
        try {
            const prompt = `Analiza este documento del sector "${industry.toLowerCase()}" y genera un resumen ejecutivo de máximo 150 palabras.
            
            Tu objetivo es proporcionar el CONTEXTO GLOBAL que un fragmento pequeño de este documento necesitaría para ser entendido por sí solo.
            No empieces con "Este documento...", ve directo al grano.
            
            ENFOQUE: Objetivo del documento, productos/modelos mencionados y propósito técnico.
            
            TEXTO:
            ${text.substring(0, 5000)}`;

            const response = await callGeminiMini(prompt, tenantId, {
                correlationId: correlationId || 'cognitive-router',
                model: 'gemini-1.5-flash'
            });

            return response.trim();
        } catch (error: any) {
            console.error('[COGNITIVE RETRIEVAL ERROR]', error);
            return 'Documento técnico general sin contexto específico detectado.';
        }
    }
}
