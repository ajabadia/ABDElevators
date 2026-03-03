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
        const taxonomies = db.collection('taxonomias');

        const defaultTaxonomies = [
            {
                tenantId: 'default_tenant',
                industry: 'ELEVATORS',
                name: 'Ubicación Geográfica',
                key: 'geography',
                description: 'Regionalización de los activos',
                multiple: false,
                required: true,
                active: true,
                options: [
                    { id: 'north', label: 'Zona Norte', color: 'blue' },
                    { id: 'south', label: 'Zona Sur', color: 'emerald' },
                    { id: 'center', label: 'Zona Centro', color: 'amber' },
                    { id: 'east', label: 'Levante', color: 'orange' }
                ],
                creado: new Date()
            },
            {
                tenantId: 'default_tenant',
                industry: 'ELEVATORS',
                name: 'Tipo de Activo',
                key: 'asset_type',
                description: 'Categoría técnica del equipo',
                multiple: false,
                required: true,
                active: true,
                options: [
                    { id: 'elevator', label: 'Ascensor', color: 'slate' },
                    { id: 'escalator', label: 'Escalera Mecánica', color: 'slate' },
                    { id: 'moving_walk', label: 'Pasillo Rodante', color: 'slate' }
                ],
                creado: new Date()
            },
            {
                tenantId: 'default_tenant',
                industry: 'ELEVATORS',
                name: 'Criticidad Operativa',
                key: 'criticality',
                description: 'Prioridad de mantenimiento',
                multiple: false,
                required: false,
                active: true,
                options: [
                    { id: 'high', label: 'Alta', color: 'red' },
                    { id: 'medium', label: 'Media', color: 'orange' },
                    { id: 'low', label: 'Baja', color: 'green' }
                ],
                creado: new Date()
            }
        ];

        for (const tax of defaultTaxonomies) {
            await taxonomies.updateOne(
                { tenantId: tax.tenantId, industry: tax.industry, key: tax.key },
                { $set: tax },
                { upsert: true }
            );
        }

        console.log('✅ Taxonomías de Ascensores cargadas correctamente');

    } catch (error: any) {
        console.error('❌ Error en seed:', error.message);
    } finally {
        await client.close();
        process.exit(0);
    }
}

seed();
