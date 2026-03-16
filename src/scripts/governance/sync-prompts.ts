import { PromptService } from '@/services/llm/prompt-service';
import { connectDB } from '@/lib/db';
import { logEvento } from '@/lib/logger';
import * as dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno desde .env.local si existe, si no .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

/**
 * Script de Sincronización de Prompts (Era 16)
 * 
 * Este script automatiza la hidratación de la base de datos con los prompts 
 * definidos en src/lib/prompts.ts, permitiendo despliegues consistentes.
 */
async function syncPrompts() {
  const correlationId = `sync-prompts-${Date.now()}`;
  console.log(`[SYNC_PROMPTS] Iniciando sincronización... (Correlation: ${correlationId})`);

  try {
    await connectDB();
    
    // Sincronización para el tenant global
    const result = await PromptService.syncFallbacks('abd_global');
    
    console.log(`[SYNC_PROMPTS] Resultado:
    - Creados: ${result.created}
    - Actualizados: ${result.updated}
    - Errores: ${result.errors}`);

    await logEvento({
      level: result.errors > 0 ? 'WARN' : 'INFO',
      source: 'CLI_GOVERNANCE',
      action: 'SYNC_PROMPTS',
      message: `Sincronización de prompts completada. Creados: ${result.created}, Actualizados: ${result.updated}`,
      correlationId,
      details: result
    });

    if (result.errors > 0) {
      process.exit(1);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('[SYNC_PROMPTS] Error crítico:', error);
    await logEvento({
      level: 'ERROR',
      source: 'CLI_GOVERNANCE',
      action: 'SYNC_PROMPTS',
      message: 'Fallo crítico en el script de sincronización',
      correlationId,
      details: { error: error instanceof Error ? error.message : String(error) }
    });
    process.exit(1);
  }
}

syncPrompts();
