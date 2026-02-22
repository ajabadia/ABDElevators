/**
 * 🤖 Registro Centralizado de Modelos de IA
 * Fuente de verdad única para modelos LLM en la plataforma.
 */

export const AI_MODEL_IDS = {
    GEMINI_2_5_FLASH: 'gemini-2.5-flash',
    GEMINI_2_5_PRO: 'gemini-2.5-pro',
    GEMINI_3_PRO_PREVIEW: 'gemini-3-pro-preview',
    GEMINI_1_5_FLASH: 'gemini-1.5-flash',
    GEMINI_1_5_PRO: 'gemini-1.5-pro',
    GEMINI_2_0_FLASH: 'gemini-2.0-flash',
    EMBEDDING_1_0: 'gemini-embedding-001'
} as const;

export type ModelName = typeof AI_MODEL_IDS[keyof typeof AI_MODEL_IDS];

export interface AIModel {
    id: string;
    name: string;
    description: string;
    isEnabled: boolean;
    provider: 'google' | 'openai' | 'anthropic';
}

export const AI_MODELS: AIModel[] = [
    {
        id: AI_MODEL_IDS.GEMINI_2_5_FLASH,
        name: 'Gemini 2.5 Flash (OK)',
        description: 'Modelo estable por contrato - 1M TPM.',
        isEnabled: true,
        provider: 'google'
    },
    {
        id: AI_MODEL_IDS.GEMINI_2_5_PRO,
        name: 'Gemini 2.5 Pro',
        description: 'Capacidad de razonamiento avanzada por contrato.',
        isEnabled: true,
        provider: 'google'
    },
    {
        id: AI_MODEL_IDS.GEMINI_3_PRO_PREVIEW,
        name: 'Gemini 3 Pro (Preview)',
        description: 'Acceso anticipado por contrato.',
        isEnabled: true,
        provider: 'google'
    },
    {
        id: AI_MODEL_IDS.GEMINI_1_5_FLASH,
        name: 'Gemini 1.5 Flash (Disabled)',
        description: 'No permitido por contrato.',
        isEnabled: false,
        provider: 'google'
    },
    {
        id: AI_MODEL_IDS.GEMINI_1_5_PRO,
        name: 'Gemini 1.5 Pro (Disabled)',
        description: 'No permitido por contrato.',
        isEnabled: false,
        provider: 'google'
    },
    {
        id: AI_MODEL_IDS.GEMINI_2_0_FLASH,
        name: 'Gemini 2.0 Flash (Disabled)',
        description: 'No permitido por contrato.',
        isEnabled: false,
        provider: 'google'
    }
];

export const DEFAULT_MODEL = AI_MODEL_IDS.GEMINI_2_5_FLASH;

export const MODEL_COSTS: Record<ModelName, { input: number; output: number }> = {
    [AI_MODEL_IDS.GEMINI_2_5_FLASH]: { input: 0.1, output: 0.4 },
    [AI_MODEL_IDS.GEMINI_2_5_PRO]: { input: 1.25, output: 5.0 },
    [AI_MODEL_IDS.GEMINI_3_PRO_PREVIEW]: { input: 1.25, output: 5.0 },
    [AI_MODEL_IDS.GEMINI_1_5_FLASH]: { input: 0.1, output: 0.4 },
    [AI_MODEL_IDS.GEMINI_1_5_PRO]: { input: 1.25, output: 5.0 },
    [AI_MODEL_IDS.GEMINI_2_0_FLASH]: { input: 0.1, output: 0.4 },
    [AI_MODEL_IDS.EMBEDDING_1_0]: { input: 0.025, output: 0.0 }
};

export const getEnabledModelIds = () => AI_MODELS.filter(m => m.isEnabled).map(m => m.id);
