import { PromptRunner } from './src/lib/llm-core/PromptRunner';
import { z } from 'zod';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function test() {
  try {
    console.log("Iniciando prueba de PromptRunner...");
    const result = await PromptRunner.runJson({
      key: 'EXTRACT_MODELS',
      variables: { text: 'Test manual ARCA II' },
      schema: z.array(z.any()),
      tenantId: 'abd_global',
      correlationId: 'debug-test'
    });
    console.log("Resultado:", result);
  } catch (err) {
    console.error("Error en prueba:", err);
  }
}

test();
