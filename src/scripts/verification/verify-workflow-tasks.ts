import * as dotenv from 'dotenv';
import path from 'path';
import { connectDB, getMongoClient } from '../../lib/db';
import { UserRole } from '../../types/roles';
import { WorkflowEngine } from '../../lib/workflow-engine';
import { WorkflowTaskService } from '../../services/ops/WorkflowTaskService';
import { getTenantCollection } from '../../lib/db-tenant';
import { ObjectId } from 'mongodb';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function verify() {
    console.log('🕵️ Verification Phase: Guardian V3 & Tasks');

    const tenantId = process.env.SINGLE_TENANT_ID || 'default_tenant';

    try {
        const db = await connectDB();
        console.log(`📡 Connected to: ${db.databaseName}`);

        // 1. Roles Check
        console.log('Roles:', Object.values(UserRole));

        // 2. Setup mock data
        const casesColl = await getTenantCollection('cases', { user: { tenantId } });
        const definitionsColl = await getTenantCollection('workflow_definitions', { user: { tenantId } });
        const tasksColl = await getTenantCollection('workflow_tasks', { user: { tenantId } });

        const mockCaseId = new ObjectId();
        await casesColl.insertOne({
            _id: mockCaseId,
            tenantId,
            status: 'received',
            identifier: 'V3-TEST-001',
            createdAt: new Date()
        } as any);

        const definition = {
            tenantId,
            name: 'V3 Test Workflow',
            entityType: 'ENTITY',
            active: true,
            environment: 'PRODUCTION',
            initial_state: 'received',
            states: [
                { id: 'received', label: 'Received', is_initial: true, roles_allowed: ['ADMIN'] },
                { id: 'review', label: 'Compliance Review', requires_validation: true, roles_allowed: ['COMPLIANCE'] }
            ],
            transitions: [
                { from: 'received', to: 'review', label: 'Send to Compliance', required_role: ['ADMIN'] }
            ]
        };

        await definitionsColl.updateOne(
            { name: definition.name, tenantId },
            { $set: definition },
            { upsert: true }
        );

        console.log('🚀 Triggering transition to COMPLIANCE state...');

        const result = await WorkflowEngine.executeTransition({
            caseId: mockCaseId.toString(),
            toState: 'review',
            role: 'ADMIN',
            correlationId: 'v3-verify-corr'
        });

        console.log('Result:', result);

        // 3. Verify Task
        const task = await tasksColl.findOne({ caseId: mockCaseId.toString() });
        if (task) {
            console.log('✅ Task Generated Successfully:', task.title);
            console.log('Target Role:', task.assignedRole);

            // --- NEW: Test WorkflowTaskService ---
            console.log('\n🧪 Testing WorkflowTaskService...');
            const { WorkflowTaskService } = await import('../../services/ops/WorkflowTaskService');

            // List tasks
            const tasks = await WorkflowTaskService.listTasks(tenantId, { caseId: mockCaseId.toString() });
            console.log(`✅ Service listTasks found ${tasks.length} tasks`);

            // Update status
            console.log('🔄 Updating task status via Service...');
            const updateResult = await WorkflowTaskService.updateStatus({
                id: task._id.toString(),
                tenantId,
                userId: 'tester_001',
                userName: 'Admin Tester',
                status: 'IN_PROGRESS',
                correlationId: 'v3-verify-update'
            });
            console.log('✅ Update Status Result:', updateResult);

            const updatedTask = await WorkflowTaskService.getTaskById(task._id.toString(), tenantId);
            console.log('✅ Verifying status is now:', updatedTask.status);

        } else {
            throw new Error('Task was not generated');
        }

        // Cleanup
        await casesColl.deleteOne({ _id: mockCaseId });
        await tasksColl.deleteMany({ caseId: mockCaseId.toString() });
        console.log('🧹 Cleanup done.');

    } catch (e: any) {
        console.error('❌ Verification Error:', e.message);
        if (e.stack) console.error(e.stack);
        process.exit(1);
    } finally {
        const client = await getMongoClient();
        if (client) await client.close();
        process.exit(0);
    }
}

verify();
