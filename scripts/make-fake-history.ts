import { connectDB } from '../src/lib/db';
import { ObjectId } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function createFakeHistory() {
    console.log('🧪 Creando historial ficticio para pruebas...');

    try {
        const db = await connectDB();
        const prompts = db.collection('prompts');
        const versions = db.collection('prompt_versions');

        const prompt = await prompts.findOne({ key: 'RISK_AUDITOR' });

        if (!prompt) {
            console.error('❌ No se encontró el prompt RISK_AUDITOR. Ejecuta el seed primero.');
            process.exit(1);
        }

        console.log(`Found prompt: ${prompt._id}`);

        // Crear Versión 1 (Snapshot)
        const v1 = {
            promptId: prompt._id,
            tenantId: prompt.tenantId,
            version: 1,
            template: "VERSIÓN ANTIGUA: Analiza riesgos básicos.\nVariables: {{industry}}, {{caseContent}}, {{ragContext}}",
            variables: prompt.variables,
            changedBy: 'sistema@test.com',
            changeReason: 'Configuración inicial de la plataforma',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2) // Hace 2 días
        };

        // Crear Versión 2 (Snapshot)
        const v2 = {
            promptId: prompt._id,
            tenantId: prompt.tenantId,
            version: 2,
            template: "VERSIÓN EXPERIMENTAL: Detección profunda de normativa EN 81-20.\nVariables: {{industry}}, {{caseContent}}, {{ragContext}}",
            variables: prompt.variables,
            changedBy: 'admin@abd.com',
            changeReason: 'Mejora de precisión en normativa europea',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2) // Hace 2 horas
        };

        await versions.deleteMany({ promptId: prompt._id });
        await versions.insertMany([v1, v2]);

        // Actualizar el prompt principal a V3
        await prompts.updateOne(
            { _id: prompt._id },
            { $set: { version: 3, updatedAt: new Date() } }
        );

        console.log('✅ Historial creado. Ahora RISK_AUDITOR debería tener 2 entradas en el historial y estar en V3.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

createFakeHistory();
