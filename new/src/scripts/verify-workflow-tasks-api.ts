import * as dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { WorkflowTaskService } from '../lib/workflow-task-service';
import { connectDB } from '../lib/db';
import { getTenantCollection } from '../lib/db-tenant';
import { UserRole } from '../../src/types/roles';
import { ObjectId } from 'mongodb';

const TEST_TENANT = process.env.SINGLE_TENANT_ID || 'tenant_test_123';

async function verifyWorkflowTasksAPI() {
    console.log('🚀 Invocando Verificación de APIs de WorkflowTask...');

    const correlationId = `test-api-${Date.now()}`;

    try {
        await connectDB();

        // Simular un contexto de session
        const session = {
            user: {
                id: 'system_test',
                email: 'system@test.com',
                tenantId: TEST_TENANT,
                role: UserRole.SUPER_ADMIN
            }
        };

        const tasksCollection = await getTenantCollection('workflow_tasks', session);

        // 1. Limpiar y crear tarea de prueba
        console.log('🧹 Limpiando tareas previas...');
        await tasksCollection.deleteMany({ tenantId: TEST_TENANT });

        console.log('📝 Creando tarea de prueba...');
        const taskData = {
            tenantId: TEST_TENANT,
            caseId: 'case_api_test_001',
            type: 'DOCUMENT_REVIEW',
            title: 'Tarea de Pruebas API',
            description: 'Verificación de endpoints de gestión',
            assignedRole: UserRole.COMPLIANCE,
            status: 'PENDING',
            priority: 'HIGH',
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const insertResult = await tasksCollection.insertOne(taskData as any);
        const taskId = insertResult.insertedId.toString();
        console.log(`✅ Tarea creada con ID: ${taskId}`);

        // 2. Probar listado via Service
        console.log('\n🔍 Probando listado de tareas...');
        const tasks = await WorkflowTaskService.listTasks(TEST_TENANT, { status: 'PENDING' });
        console.log(`✅ Listado exitoso: ${tasks.length} tareas encontradas`);

        // 3. Probar actualización de estado via Service
        console.log('\n🔄 Probando actualización de estado (COMPLETED)...');
        const updateResult = await WorkflowTaskService.updateStatus({
            id: taskId,
            tenantId: TEST_TENANT,
            userId: 'user_tester_99',
            userName: 'Test Auditor',
            status: 'COMPLETED',
            notes: 'Aprobado mediante script de verificación API',
            correlationId
        });

        if (updateResult.success && updateResult.status === 'COMPLETED') {
            console.log('✅ Estado actualizado correctamente');
        }

        console.log('\n✨ VERIFICACIÓN DE CORE API EXITOSA');

    } catch (error: any) {
        console.error('\n❌ ERROR EN VERIFICACIÓN:');
        if (error.code) {
            console.error(`Código: ${error.code}`);
            console.error(`Status: ${error.status}`);
            console.error(`Mensaje: ${error.message}`);
            if (error.details) console.error(`Detalles:`, error.details);
        } else {
            console.error(error);
        }
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

verifyWorkflowTasksAPI();
