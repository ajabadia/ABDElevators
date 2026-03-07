import { connectAuthDB } from '../src/lib/db';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import path from 'path';
import { guardProduction } from '../src/lib/maintenance';

/**
 * Script para crear o ascender un usuario a SUPER_ADMIN.
 * Actualizado para la Identity Suite (Fase 11).
 */

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPER_ADMIN_EMAIL = 'superadmin@abd.com';
const SUPER_ADMIN_PASS = 'super123';

async function createSuperAdmin() {
    guardProduction('create-super-admin');
    console.log(`🚀 Iniciando creación de SUPER_ADMIN en BD de Identidad: ${SUPER_ADMIN_EMAIL}`);

    try {
        const db = await connectAuthDB();
        const users = db.collection('users');

        const passwordHash = await bcrypt.hash(SUPER_ADMIN_PASS, 10);

        const superAdminData = {
            email: SUPER_ADMIN_EMAIL,
            password: passwordHash,
            nombre: 'Super',
            apellidos: 'Admin Global',
            puesto: 'Platform Governance Root',
            rol: 'SUPER_ADMIN',
            tenantId: 'platform_master', // Tenant especial para administración global
            industry: 'GENERIC',
            activeModules: ['TECHNICAL', 'RAG', 'BILLING', 'WORKFLOW'],
            activo: true,
            creado: new Date(),
            modificado: new Date()
        };

        const result = await users.updateOne(
            { email: SUPER_ADMIN_EMAIL },
            { $set: superAdminData },
            { upsert: true }
        );

        if (result.upsertedCount > 0) {
            console.log('✅ SUPER_ADMIN creado con éxito.');
        } else {
            console.log('✅ Usuario existente ascendido a SUPER_ADMIN con éxito.');
        }

        console.log(`
--------------------------------------------------
CREDENCIALES DE ACCESO GLOBAL:
Email: ${SUPER_ADMIN_EMAIL}
Password: ${SUPER_ADMIN_PASS}
--------------------------------------------------
Nota: Este usuario tiene visibilidad sobre TODOS los tenants.
`);

    } catch (error: any) {
        console.error('❌ Error creando SUPER_ADMIN:', error.message);
    } finally {
        process.exit(0);
    }
}

createSuperAdmin();
