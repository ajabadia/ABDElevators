export * from '@abd/platform-core';

/**
 * Helper para obtener solo los IDs de los modelos habilitados
 */
import { AI_MODELS } from '@abd/platform-core';
export const getEnabledModelIds = () => AI_MODELS.filter(m => m.isEnabled).map(m => m.id);
