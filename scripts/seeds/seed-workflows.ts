import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const uri = process.env.MONGODB_URI;

async function seed() {
    if (!uri) {
        console.error('❌ MONGODB_URI not found');
        process.exit(1);
    }

    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db('ABDElevators');
        const configs = db.collection('workflow_configs');

        const elevatorsMaintenanceWorkflow = {
            tenantId: 'default_tenant',
            industry: 'ELEVATORS',
            caseType: 'MAINTENANCE',
            active: true,
            states: [
                { id: 'PENDING', label: 'Pendiente', color: 'slate', is_initial: true },
                { id: 'ANALYZED', label: 'Analizado', color: 'teal', icon: 'zap' },
                { id: 'VALIDATED', label: 'Validado', color: 'blue', icon: 'check-circle' },
                { id: 'COMPLETED', label: 'Finalizado', color: 'green', is_final: true }
            ],
            transitions: [
                {
                    from: 'PENDING',
                    to: 'ANALYZED',
                    label: 'Analizar',
                    action: 'ANALYZE',
                    roles: ['TECNICO', 'ADMIN']
                },
                {
                    from: 'ANALYZED',
                    to: 'VALIDATED',
                    label: 'Validar Checklists',
                    action: 'VALIDATE',
                    roles: ['TECNICO', 'ADMIN']
                },
                {
                    from: 'VALIDATED',
                    to: 'COMPLETED',
                    label: 'Cerrar Caso',
                    action: 'FINALIZE',
                    roles: ['ADMIN'],
                    require_signature: true
                }
            ],
            creado: new Date()
        };

        await configs.updateOne(
            { tenantId: 'default_tenant', industry: 'ELEVATORS', caseType: 'MAINTENANCE' },
            { $set: elevatorsMaintenanceWorkflow },
            { upsert: true }
        );

        console.log('✅ Workflow de Ascensores cargado correctamente');

    } catch (error: any) {
        console.error('❌ Error en seed:', error.message);
    } finally {
        await client.close();
        process.exit(0);
    }
}

seed();
