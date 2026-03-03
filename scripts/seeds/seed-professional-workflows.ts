
import { connectDB } from '../lib/db';
import * as dotenv from 'dotenv';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function seed() {
    console.log('🌱 Seeding Professional Workflows...');

    const tenantId = process.env.SINGLE_TENANT_ID || 'default_tenant';
    const db = await connectDB();
    const collection = db.collection('workflow_definitions');

    const workflows = [
        {
            name: "Elevator Incident Flow",
            industry: "ELEVATORS",
            entityType: "ENTITY",
            environment: "PRODUCTION",
            active: true,
            version: 1,
            initial_state: "received",
            states: [
                { id: "received", label: "Received", is_initial: true },
                { id: "analyzing", label: "Analyzing" },
                { id: "resolved", label: "Resolved", is_final: true }
            ],
            transitions: [
                { from: "received", to: "analyzing", label: "Start Analysis" },
                { from: "analyzing", to: "resolved", label: "Close Incident" }
            ],
            visual: {
                nodes: [
                    { id: "node-1", type: "trigger", data: { label: "New Incident" }, position: { x: 100, y: 100 } },
                    { id: "node-2", type: "action", data: { label: "AI Severity Check" }, position: { x: 350, y: 100 } },
                    { id: "node-3", type: "switch", data: { label: "Route by Severity" }, position: { x: 600, y: 100 } },
                    { id: "node-4", type: "action", data: { label: "Critical Alert" }, position: { x: 850, y: 50 } },
                    { id: "node-5", type: "action", data: { label: "Log Minor Issue" }, position: { x: 850, y: 150 } }
                ],
                edges: [
                    { id: "e1-2", source: "node-1", target: "node-2" },
                    { id: "e2-3", source: "node-2", target: "node-3" },
                    { id: "e3-4", source: "node-3", target: "node-4", label: "Critical" },
                    { id: "e3-5", source: "node-3", target: "node-5", label: "Low" }
                ]
            }
        },
        {
            name: "Mortgage Validation Flow",
            industry: "BANKING",
            entityType: "ENTITY",
            environment: "PRODUCTION",
            active: true,
            version: 1,
            initial_state: "pending",
            states: [
                { id: "pending", label: "Pending", is_initial: true },
                { id: "validated", label: "Validated", is_final: true }
            ],
            transitions: [
                { from: "pending", to: "validated", label: "Approve" }
            ],
            visual: {
                nodes: [
                    { id: "n1", type: "trigger", data: { label: "Loan Request" }, position: { x: 0, y: 0 } },
                    { id: "n2", type: "action", data: { label: "KYC Check" }, position: { x: 200, y: 0 } },
                    { id: "n3", type: "wait", data: { label: "Wait for Docs", duration: "24h" }, position: { x: 400, y: 0 } }
                ],
                edges: [
                    { id: "en1-2", source: "n1", target: "n2" },
                    { id: "en2-3", source: "n2", target: "n3" }
                ]
            }
        },
        {
            name: "Legal Compliance Audit",
            industry: "LEGAL",
            entityType: "ENTITY",
            environment: "PRODUCTION",
            active: true,
            version: 1,
            initial_state: "start",
            states: [
                { id: "start", label: "Audit Started", is_initial: true },
                { id: "done", label: "Compliant", is_final: true }
            ],
            transitions: [
                { from: "start", to: "done", label: "Mark Compliant" }
            ],
            visual: {
                nodes: [
                    { id: "l1", type: "trigger", data: { label: "Contract Upload" }, position: { x: 50, y: 50 } },
                    { id: "l2", type: "loop", data: { label: "Check Clauses" }, position: { x: 250, y: 50 } }
                ],
                edges: [
                    { id: "el1-2", source: "l1", target: "l2" }
                ]
            }
        }
    ];

    for (const wf of workflows) {
        const doc = {
            ...wf,
            tenantId,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: 'system-seed'
        };
        await collection.updateOne(
            { name: wf.name, tenantId, environment: wf.environment },
            { $set: doc },
            { upsert: true }
        );
        console.log(`✅ Seeded: ${wf.name}`);
    }

    console.log('🎉 Done! Workflows should now be visible in the dropdown.');
    process.exit(0);
}

seed().catch(err => {
    console.error(err);
    process.exit(1);
});
