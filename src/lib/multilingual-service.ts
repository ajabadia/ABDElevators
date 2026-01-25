import { pipeline } from '@xenova/transformers';

/**
 * Servicio Multilingüe basado en BGE-M3.
 * Proporciona embeddings unificados para ES/EN/DE/IT/FR.
 * Phase 21.1 del Roadmap.
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

    /**
     * Inicializa el modelo BGE-M3.
     * SLA: Lazy loading en la primera petición para no penalizar el arranque.
     */
    private async init() {
        if (!this.model) {
            this.model = await pipeline('feature-extraction', 'Xenova/bge-m3');
        }
    }

    /**
     * Genera un embedding denso usando BGE-M3.
     */
    public async generateEmbedding(text: string): Promise<number[]> {
        await this.init();
        const output = await this.model(text, { pooling: 'cls', normalize: true });
        return Array.from(output.data);
    }
}

export const multilingualService = MultilingualService.getInstance();
