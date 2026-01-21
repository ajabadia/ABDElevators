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
};
