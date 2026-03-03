import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function seed() {
    console.log('🌱 Seed: Iniciando carga de empresas sintéticas y usuarios...');

    try {
        const AUTH_URI = process.env.MONGODB_AUTH_URI || process.env.MONGODB_URI;
        if (!AUTH_URI) throw new Error('MONGODB_AUTH_URI or MONGODB_URI not found');

        const client = new MongoClient(AUTH_URI);
        await client.connect();
        const db = client.db('ABDElevators-Auth');

        const tenants = db.collection('tenants');
        const users = db.collection('users');

        // 1. Definir Tenants
        const tenantsToSeed = [
            {
                tenantId: 'ascensores-pro',
                name: 'Ascensores Rápidos y Seguros S.A.',
                industry: 'ELEVATORS',
                active: true,
                subscription: { tier: 'PRO', status: 'ACTIVE' },
                creado: new Date()
            },
            {
                tenantId: 'garcia-legales',
                name: 'García & Asociados Consultores Legales',
                industry: 'LEGAL',
                active: true,
                subscription: { tier: 'PRO', status: 'ACTIVE' },
                creado: new Date()
            },
            {
                tenantId: 'banco-parque',
                name: 'Banco del Parque - División Corporativa',
                industry: 'GENERIC',
                active: true,
                subscription: { tier: 'ENTERPRISE', status: 'ACTIVE' },
                creado: new Date()
            }
        ];

        for (const t of tenantsToSeed) {
            await tenants.updateOne({ tenantId: t.tenantId }, { $set: t }, { upsert: true });
        }
        console.log('✅ Tenants creados');

        // 2. Definir Usuarios
        const passwordHash = await bcrypt.hash('pass123', 10);

        const usersToSeed = [
            // Usuarios para Ascensores
            {
                email: 'admin@ascensores.com',
                password: passwordHash,
                nombre: 'Carlos',
                apellidos: 'Ascensorista',
                rol: 'ADMIN',
                tenantId: 'ascensores-pro',
                activeModules: ['TECHNICAL', 'RAG'],
                activo: true,
                creado: new Date(),
                modificado: new Date()
            },
            {
                email: 'tecnico@ascensores.com',
                password: passwordHash,
                nombre: 'Roberto',
                apellidos: 'Mantenimiento',
                rol: 'TECNICO',
                tenantId: 'ascensores-pro',
                activo: true,
                creado: new Date(),
                modificado: new Date()
            },
            // Usuarios para Abogados
            {
                email: 'socio@garcia.com',
                password: passwordHash,
                nombre: 'María',
                apellidos: 'García',
                rol: 'ADMIN',
                tenantId: 'garcia-legales',
                activeModules: ['LEGAL', 'RAG'],
                activo: true,
                creado: new Date(),
                modificado: new Date()
            },
            // Usuarios para Banco
            {
                email: 'gerente@bancoparque.com',
                password: passwordHash,
                nombre: 'Antonio',
                apellidos: 'Banquero',
                rol: 'ADMIN',
                tenantId: 'banco-parque',
                activo: true,
                creado: new Date(),
                modificado: new Date()
            },
            // USUARIO COMPARTIDO (Abogados y Banco)
            {
                email: 'consultor.externo@gmail.com',
                password: passwordHash,
                nombre: 'Lucía',
                apellidos: 'Multidisciplinar',
                rol: 'TECNICO',
                tenantId: 'garcia-legales', // Default
                tenantAccess: [
                    { tenantId: 'garcia-legales', name: 'García & Asociados', role: 'TECNICO', industry: 'LEGAL' },
                    { tenantId: 'banco-parque', name: 'Banco del Parque', role: 'INGENIERIA', industry: 'GENERIC' }
                ],
                activo: true,
                creado: new Date(),
                modificado: new Date()
            }
        ];

        for (const u of usersToSeed) {
            await users.updateOne({ email: u.email }, { $set: u }, { upsert: true });
        }
        console.log('✅ Usuarios creados (incluyendo compartido)');

        await client.close();
        console.log('🚀 Seed completado correctamente');
    } catch (error) {
        console.error('❌ Error en seed:', error);
        process.exit(1);
    }
}

seed();
