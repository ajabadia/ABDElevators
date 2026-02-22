
/**
 * 📐 Vector Math Utilities
 * Proposito: Operaciones matemáticas comunes para RAG, embeddings y similitud semántica.
 */
export class VectorUtils {
    /**
     * Calcula la similitud coseno entre dos vectores.
     * Retorna un valor entre -1 y 1 (normalmente entre 0 y 1 para embeddings).
     */
    static cosineSimilarity(a: number[], b: number[]): number {
        if (!a || !b || a.length !== b.length || a.length === 0) return 0;

        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }

        const denominator = Math.sqrt(normA) * Math.sqrt(normB);
        if (denominator === 0) return 0;

        return dotProduct / denominator;
    }
}
