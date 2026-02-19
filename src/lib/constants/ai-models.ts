/**
 * 🤖 Registro Centralizado de Modelos de IA
 * Fuente de verdad única para modelos LLM en la plataforma.
 * Sincronizado con el Editor de Prompts (Phase 172.1).
 */

export interface AIModel {
    id: string;
    name: string;
    description: string;
    isEnabled: boolean;
    provider: 'google' | 'openai' | 'anthropic';
}

export const AI_MODELS: AIModel[] = [
    {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash (OK)',
        description: 'Modelo estable por defecto con alto rendimiento.',
        isEnabled: true,
        provider: 'google'
    },
    {
        id: 'gemini-2.5-pro',
        name: 'Gemini 2.5 Pro',
        description: 'Capacidad de razonamiento avanzada.',
        isEnabled: true,
        provider: 'google'
    },
    {
        id: 'gemini-flash-latest',
        name: 'Gemini Flash Latest',
        description: 'Versión más reciente optimizada para velocidad.',
        isEnabled: true,
        provider: 'google'
    },
    {
        id: 'gemini-pro-latest',
        name: 'Gemini Pro Latest',
        description: 'Versión más reciente con inteligencia máxima.',
        isEnabled: true,
        provider: 'google'
    },
    {
        id: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        description: 'Modelo equilibrado de la serie 1.5.',
        isEnabled: false,
        provider: 'google'
    },
    {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        description: 'Razonamiento profundo con gran ventana de contexto.',
        isEnabled: false,
        provider: 'google'
    },
    {
        id: 'gemini-2.0-flash',
        name: 'Gemini 2.0 Flash',
        description: 'Nueva arquitectura de baja latencia.',
        isEnabled: false,
        provider: 'google'
    },
    {
        id: 'gemini-3-pro-preview',
        name: 'Gemini 3 Pro (Preview)',
        description: 'Acceso anticipado a la próxima generación de modelos.',
        isEnabled: true,
        provider: 'google'
    }
];

export const DEFAULT_MODEL = 'gemini-2.5-flash';

/**
 * Helper para obtener solo los IDs de los modelos habilitados
 */
export const getEnabledModelIds = () => AI_MODELS.filter(m => m.isEnabled).map(m => m.id);
