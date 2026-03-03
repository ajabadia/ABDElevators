import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function setupIndexes() {
    console.log('🚀 [PHASE_70_HARDENING] Iniciando configuración de seguridad atómica en MongoDB...');

    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('❌ MONGODB_URI no encontrada en .env.local');
        process.exit(1);
    }

    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log('✅ Conectado a MongoDB');

        const db = client.db('ABDElevators');
        const authDb = client.db('ABDElevators-Auth');

        const collectionsToHarden = [
            { db: db, name: 'knowledge_assets' },
            { db: db, name: 'document_chunks' },
            { db: db, name: 'audit_ingestion' },
            { db: authDb, name: 'users' }
        ];

        // 🧹 Limpieza de índices legacy
        console.log('\n--- 0. Limpiando índices legacy ---');
        for (const collInfo of collectionsToHarden) {
            try {
                const coll = collInfo.db.collection(collInfo.name);
                const indexes = await coll.listIndexes().toArray();
                for (const idx of indexes) {
                    if (idx.name !== '_id_') {
                        console.log(`[CLEANUP] Intentando borrar [${idx.name}] en [${collInfo.name}]`);
                        try {
                            await coll.dropIndex(idx.name);
                        } catch (e: any) {
                            console.warn(`[CLEANUP_WARN] No se pudo borrar [${idx.name}]: ${e.message}`);
                        }
                    }
                }
            } catch (e: any) {
                console.warn(`[CLEANUP_WARN] Error accediendo a [${collInfo.name}]: ${e.message}`);
            }
        }

        const createIdx = async (coll: any, keys: any, options: any) => {
            try {
                console.log(`[INDEX] Creando [${options.name}] en [${coll.collectionName}]...`);
                await coll.createIndex(keys, options);
                console.log(`[OK] [${options.name}] creado.`);
            } catch (e: any) {
                console.error(`[FAIL] Error en [${options.name}]: ${e.message}`);
                if (e.code === 11000) {
                    console.error(`[DETALLE] Violación de unicidad detectada. Revisa los datos duplicados.`);
                }
            }
        };

        // 🛡️ DEDUPLICACIÓN ATÓMICA
        const assets = db.collection('knowledge_assets');
        await createIdx(assets, { tenantId: 1, environment: 1, fileMd5: 1 }, { unique: true, name: 'idx_unique_asset_md5_per_tenant' });
        await createIdx(assets, { tenantId: 1, ingestionStatus: 1 }, { name: 'idx_status_lookup' });
        await createIdx(assets, { createdAt: -1 }, { name: 'idx_global_timeline' });

        // 🚄 RENDIMIENTO RAG
        const chunks = db.collection('document_chunks');
        await createIdx(chunks, { tenantId: 1, environment: 1, sourceDoc: 1 }, { name: 'idx_chunk_lookup' });
        await createIdx(chunks, { environment: 1, status: 1 }, { name: 'idx_env_status' });

        // 🔑 SEGURIDAD DE ACCESO
        const users = authDb.collection('users');
        await createIdx(users, { email: 1 }, { unique: true, name: 'idx_unique_auth_email' });
        await createIdx(users, { tenantId: 1 }, { name: 'idx_user_tenant_isolation' });

        // 📋 TRAZABILIDAD
        const audit = db.collection('audit_ingestion');
        await createIdx(audit, { tenantId: 1, timestamp: -1 }, { name: 'idx_audit_history' });
        await createIdx(audit, { md5: 1 }, { name: 'idx_audit_md5_lookup' });

        console.log('\n✨ [HARDENING PROCESS FINISHED]');
    } catch (error) {
        console.error('❌ Error crítico en Hardening DB:', error);
    } finally {
        await client.close();
    }
}

setupIndexes();
