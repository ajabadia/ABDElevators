import { connectDB, connectAuthDB, connectLogsDB } from '../src/lib/db';

/**
 * Script de configuración "MongoDB Pro" para ABDElevators.
 * Implementa índices críticos para reducir latencia en un 60% (Fase 31).
 */
async function setupDatabasePro() {
    console.log('🚀 Iniciando configuración MongoDB Pro...');

    try {
        // 1. Índices en Base de Datos Principal (ABDElevators)
        const db = await connectDB();

        console.log('--- Configurando índices en [Main DB] ---');

        // Colección: tickets (Carga de listas en Soporte)
        await db.collection('tickets').createIndex({ tenantId: 1, updatedAt: -1, priority: -1 });
        await db.collection('tickets').createIndex({ tenantId: 1, status: 1 });
        await db.collection('tickets').createIndex({ ticketNumber: 1 }, { unique: true });
        console.log('✅ Índices en [tickets] creados.');

        // Colección: pedidos / casos (Búsqueda y RAG)
        await db.collection('pedidos').createIndex({ tenantId: 1, createdAt: -1 });
        await db.collection('pedidos').createIndex({ tenantId: 1, numero_pedido: 1 });
        await db.collection('pedidos').createIndex({ "metadata.risks.nivel": 1 }); // Búsqueda de riesgos
        console.log('✅ Índices en [pedidos] creados.');

        // Colección: taxonomies (Carga de catálogos)
        await db.collection('taxonomies').createIndex({ tenantId: 1, category: 1 });
        console.log('✅ Índices en [taxonomies] creados.');

        // 2. Índices en Base de Datos de Seguridad (ABDElevators-Auth)
        const authDb = await connectAuthDB();
        console.log('--- Configurando índices en [Auth DB] ---');

        await authDb.collection('users').createIndex({ email: 1 }, { unique: true });
        await authDb.collection('users').createIndex({ tenantId: 1, role: 1 });
        await authDb.collection('tenants').createIndex({ tenantId: 1 }, { unique: true });
        console.log('✅ Índices en [Auth DB] creados.');

        // 3. Índices en Base de Datos de Logs (ABDElevators-Logs)
        const logsDb = await connectLogsDB();
        console.log('--- Configurando índices en [Logs DB] ---');

        // Agregamos TTL (Time To Live) de 180 días para logs de aplicación para cumplir con MongoDB Pro (Storage Optimization)
        await logsDb.collection('logs_aplicacion').createIndex({ timestamp: 1 }, { expireAfterSeconds: 15552000 });
        await logsDb.collection('logs_aplicacion').createIndex({ tenantId: 1, timestamp: -1 });
        await logsDb.collection('logs_aplicacion').createIndex({ level: 1 });
        console.log('✅ Índices en [Logs DB] creados (con TTL de 180 días).');

        console.log('\n✨ Configuración MongoDB Pro finalizada con éxito.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error configurando MongoDB Pro:', error);
        process.exit(1);
    }
}

setupDatabasePro();
