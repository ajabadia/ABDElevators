import { connectDB } from '../src/lib/db';
import { ObjectId } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// ... imports ...

async function createUsageLogs(db: any, tenantId: string) {
    console.log('📊 Generando logs de uso sintéticos (30 días)...');
    const logsCollection = db.collection('usage_logs');

    // Limpiar logs anteriores de prueba
    await logsCollection.deleteMany({ tenantId, description: 'SYNTHETIC_DATA' });

    const logs = [];
    const now = new Date();
    const LOG_TYPES = [
        'LLM_TOKENS',
        'RAG_PRECISION',
        'SAVINGS_TOKENS',
        'REPORTS_GENERATED',
        'VECTOR_SEARCH'
    ];

    for (let i = 0; i < 30; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);

        // Simular actividad diaria variable
        const dailyActivity = Math.floor(Math.random() * 50) + 10;

        for (let j = 0; j < dailyActivity; j++) {
            const type = LOG_TYPES[Math.floor(Math.random() * LOG_TYPES.length)];
            let value = 0;
            let resource = 'system';

            switch (type) {
                case 'LLM_TOKENS':
                    value = Math.floor(Math.random() * 5000) + 100;
                    resource = Math.random() > 0.5 ? 'gemini-1.5-pro' : 'gemini-1.5-flash';
                    break;
                case 'RAG_PRECISION':
                    value = Math.random() * (1 - 0.7) + 0.7; // 0.7 to 1.0
                    resource = 'rag-engine-v2';
                    break;
                case 'SAVINGS_TOKENS':
                    value = Math.floor(Math.random() * 2000);
                    resource = 'cache-layer';
                    break;
                case 'REPORTS_GENERATED':
                    value = 1;
                    resource = 'report-service';
                    break;
                case 'VECTOR_SEARCH':
                    value = Math.floor(Math.random() * 10) + 1; // ms or ops
                    resource = 'atlas-vector';
                    break;
            }

            // Añadir variación horaria
            const specificTime = new Date(date);
            specificTime.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));

            logs.push({
                tenantId,
                type,
                value,
                resource,
                description: 'SYNTHETIC_DATA',
                correlationId: new ObjectId().toString(),
                timestamp: specificTime,
                metadata: { simulation: true }
            });
        }
    }

    if (logs.length > 0) {
        await logsCollection.insertMany(logs);
        console.log(`✅ ${logs.length} logs de uso insertados.`);
    }
}

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
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30) // Hace 30 días
        };

        // Crear Versión 2 (Snapshot)
        const v2 = {
            promptId: prompt._id,
            tenantId: prompt.tenantId,
            version: 2,
            template: "VERSIÓN INTERMEDIA: Detección normativa EN 81-20.\nVariables: {{industry}}, {{caseContent}}, {{ragContext}}",
            variables: prompt.variables,
            changedBy: 'admin@abd.com',
            changeReason: 'Mejora de precisión preliminar',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15) // Hace 15 días
        };

        // Crear Versión 3 (Snapshot)
        const v3 = {
            promptId: prompt._id,
            tenantId: prompt.tenantId,
            version: 3,
            template: "VERSIÓN EXPERIMENTAL: Detección profunda de normativa EN 81-20 + ISO.\nVariables: {{industry}}, {{caseContent}}, {{ragContext}}",
            variables: prompt.variables,
            changedBy: 'qa@abd.com',
            changeReason: 'Añadido soporte ISO',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2) // Hace 2 días
        };

        await versions.deleteMany({ promptId: prompt._id });
        await versions.insertMany([v1, v2, v3]);

        // Actualizar el prompt principal a V4
        await prompts.updateOne(
            { _id: prompt._id },
            { $set: { version: 4, updatedAt: new Date() } }
        );

        console.log('✅ Historial de prompts creado (3 versiones anteriores).');

        // Generar Usage Logs
        await createUsageLogs(db, prompt.tenantId);

        console.log('🎉 Simulación de datos completada con éxito.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

createFakeHistory();
