
import { pipeline } from '@xenova/transformers';

/**
 * Servicio Multilingüe basado en BGE-M3.
 * Proporciona embeddings unificados para ES/EN/DE/IT/FR.
 */
class MultilingualService {
    private static instance: MultilingualService;
    private model: any = null;

    private constructor() { }

    public static getInstance(): MultilingualService {
        if (!MultilingualService.instance) {
            MultilingualService.instance = new MultilingualService();
        }
        return MultilingualService.instance;
    }

    private async init() {
        if (!this.model) {
            console.log("📥 [MULTILINGUAL] Cargando modelo BGE-M3...");
            this.model = await pipeline('feature-extraction', 'Xenova/bge-m3');
            console.log("✅ [MULTILINGUAL] Modelo cargado.");
        }
    }

    public async generateEmbedding(text: string): Promise<number[]> {
        if (process.env.ENABLE_LOCAL_EMBEDDINGS !== 'true') {
            return [];
        }
        await this.init();
        const output = await this.model(text, { pooling: 'cls', normalize: true });
        return Array.from(output.data);
    }
}

export const multilingualService = MultilingualService.getInstance();
