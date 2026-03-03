
import { MongoClient, ObjectId } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';
import bcrypt from 'bcryptjs';
import { UserRole } from '../types/roles';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const MAIN_DB_NAME = 'ABDElevators';
const AUTH_DB_NAME = 'ABDElevators-Auth';

async function provision() {
    console.log('🚀 Iniciando aprovisionamiento de usuarios y recuperación de permisos...');

    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('❌ MONGODB_URI no configurada.');
        process.exit(1);
    }

    const client = new MongoClient(uri);
    try {
        await client.connect();
        const mainDb = client.db(MAIN_DB_NAME);
        const authDb = client.db(AUTH_DB_NAME);

        // 1. Asegurar Tenants
        console.log('🏢 Configurando tenants...');
        const tenants = [
            { _id: 'abd_global', name: 'ABD Global Governance', domain: 'abd.com', industry: 'GOVERNANCE' },
            { _id: 'elevadores_mx', name: 'Elevadores México S.A.', domain: 'elevadores.mx', industry: 'ELEVATORS' },
            { _id: 'legal_docs', name: 'Legal & Compliance Corp', domain: 'legal.com', industry: 'LEGAL' }
        ];

        for (const tenant of tenants) {
            await mainDb.collection('tenants').updateOne(
                { _id: tenant._id as any },
                { $set: { ...tenant, updatedAt: new Date() } },
                { upsert: true }
            );
        }

        // 2. Preparar Password Standard
        const hashedSuper = await bcrypt.hash('super123', 10);
        const hashedTecnico = await bcrypt.hash('tecnico123', 10);
        const hashedIngenieria = await bcrypt.hash('ingenieria123', 10);

        // 3. Usuarios Maestros (Globales)
        console.log('👑 Configurando usuarios maestros...');
        const masterUsers = [
            {
                email: 'superadmin@abd.com',
                password: hashedSuper,
                role: UserRole.SUPER_ADMIN,
                tenantId: 'abd_global',
                firstName: 'Super',
                lastName: 'Admin',
                active: true
            },
            {
                email: 'admin@abd.com',
                password: hashedSuper,
                role: UserRole.ADMIN,
                tenantId: 'abd_global',
                firstName: 'Admin',
                lastName: 'Global',
                active: true
            }
        ];

        for (const u of masterUsers) {
            // Actualizar en AUTH DB
            await authDb.collection('users').updateOne(
                { email: u.email },
                { $set: { ...u, updatedAt: new Date() } },
                { upsert: true }
            );
            // Sync a MAIN DB (sin password por seguridad/arquitectura)
            const { password, ...uSafe } = u;
            await mainDb.collection('users').updateOne(
                { email: u.email },
                { $set: { ...uSafe, updatedAt: new Date() } },
                { upsert: true }
            );
        }

        // 4. Usuarios por Tenant
        console.log('👥 Generando usuarios sintéticos por tenant...');
        const tenantSpecifics = ['elevadores.mx', 'legal.com'];
        for (const domain of tenantSpecifics) {
            const tenantId = domain === 'elevadores.mx' ? 'elevadores_mx' : 'legal_docs';

            const users = [
                { email: `admin@${domain}`, role: UserRole.ADMIN, pwd: hashedSuper, f: 'Admin', l: domain },
                { email: `tecnico@${domain}`, role: UserRole.TECHNICAL, pwd: hashedTecnico, f: 'Tecnico', l: domain },
                { email: `ingenieria@${domain}`, role: UserRole.ENGINEERING, pwd: hashedIngenieria, f: 'Ingeniero', l: domain }
            ];

            for (const u of users) {
                const userData = {
                    email: u.email,
                    password: u.pwd,
                    role: u.role,
                    tenantId,
                    firstName: u.f,
                    lastName: u.l,
                    active: true,
                    updatedAt: new Date()
                };

                await authDb.collection('users').updateOne({ email: u.email }, { $set: userData }, { upsert: true });
                const { password, ...safe } = userData;
                await mainDb.collection('users').updateOne({ email: u.email }, { $set: safe }, { upsert: true });
            }
        }

        // 5. Inyectar Políticas Básicas (Evitar Lockout)
        console.log('📜 Inyectando políticas de seguridad base...');
        const basePolicies = [
            {
                name: 'Read All Policy',
                description: 'Permite lectura general de documentos y logs',
                effect: 'ALLOW',
                resources: ['*'],
                actions: ['read'],
                isActive: true,
                tenantId: 'abd_global'
            },
            {
                name: 'Full Admin Policy',
                description: 'Acceso total para administradores de tenant',
                effect: 'ALLOW',
                resources: ['*'],
                actions: ['*'],
                isActive: true,
                tenantId: 'abd_global'
            }
        ];

        for (const p of basePolicies) {
            await mainDb.collection('policies').updateOne(
                { name: p.name },
                { $set: { ...p, updatedAt: new Date() } },
                { upsert: true }
            );
        }

        console.log('✅ Aprovisionamiento completado con éxito.');
    } catch (err) {
        console.error('❌ Error durante el aprovisionamiento:', err);
    } finally {
        await client.close();
    }
}

provision();
