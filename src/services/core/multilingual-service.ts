import type { pipeline as PipelineType } from '@xenova/transformers';

/**
 * ❄️ Snowflake Arctic-Embed (M-v2.0)
 * Proporciona embeddings unificados de alta precisión (~68 MTEB).
 * Optimizado para RAG jerárquico.
 */
class MultilingualService {
    private static instance: MultilingualService;
    private model: any = null;
    private pipelineFunc: typeof PipelineType | null = null;

    private constructor() { }

    public static getInstance(): MultilingualService {
        if (!MultilingualService.instance) {
            MultilingualService.instance = new MultilingualService();
        }
        return MultilingualService.instance;
    }

    private async init() {
        if (this.model) return;

        try {
            console.log("📥 [MULTILINGUAL] Cargando dependencias de Transformers...");
            // Usar importación dinámica para evitar errores de carga de módulos (ej: sharp en Windows o Vercel)
            const { pipeline, env } = await import('@xenova/transformers');
            this.pipelineFunc = pipeline;

            // Configuración dinámica
            env.allowLocalModels = false;
            if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
                env.cacheDir = '/tmp/transformers_cache';
            }

            console.log("📥 [MULTILINGUAL] Cargando Arctic-Embed-m-v2.0 (INT8)...");
            // Usamos INT8 para no exceder los límites de RAM (~1.5GB total)
            this.model = await this.pipelineFunc('feature-extraction', 'Snowflake/snowflake-arctic-embed-m-v2.0', {
                quantized: true,
                progress_callback: (p: any) => {
                    if (p.status === 'progress' && p.loaded === p.total) {
                        console.log(`✅ [MULTILINGUAL] Descarga completa: ${p.file}`);
                    }
                }
            });
            console.log("✅ [MULTILINGUAL] Modelo cargado con éxito.");
        } catch (error) {
            console.error("❌ [MULTILINGUAL] Error crítico inicializando Transformers:", error);
            throw error; // Re-lanzar para que el consumidor lo maneje
        }
    }

    public async generateEmbedding(text: string): Promise<number[]> {
        if (process.env.ENABLE_LOCAL_EMBEDDINGS !== 'true' && process.env.NODE_ENV === 'production') {
            console.warn("⚠️ [MULTILINGUAL] Local embeddings disabled (ENABLE_LOCAL_EMBEDDINGS).");
            return [];
        }

        try {
            await this.init();
            
            if (!this.model) throw new Error("Model not initialized after init()");

            // Arctic-Embed usa pooling 'mean' y normalización para máxima precisión en RAG
            const output = await this.model(text, { 
                pooling: 'mean', 
                normalize: true 
            });
            
            return Array.from(output.data);
        } catch (error) {
            console.error("❌ [MULTILINGUAL] Error generando embedding:", error);
            // Retornamos fallback vacío para no romper el pipeline, pero el error queda logueado
            return [];
        }
    }
}

export const multilingualService = MultilingualService.getInstance();
