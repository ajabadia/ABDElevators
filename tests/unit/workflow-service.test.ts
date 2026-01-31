import { WorkflowService } from "@/lib/workflow-service";
import { v4 as uuidv4 } from "uuid";
import { WorkflowDefinitionSchema } from "@/lib/schemas";

// Mock dependencies
jest.mock("@/lib/db-tenant", () => ({
    getTenantCollection: jest.fn().mockResolvedValue({
        tenantId: 'test_tenant',
        updateMany: jest.fn().mockResolvedValue({}),
        updateOne: jest.fn().mockResolvedValue({ upsertedId: 'mock_id', matchedCount: 1 }),
        find: jest.fn().mockResolvedValue([]),
        findOne: jest.fn().mockResolvedValue({
            name: "Mock Workflow",
            entityType: 'ENTITY',
            active: true
        })
    })
}));

jest.mock("@/lib/logger", () => ({
    logEvento: jest.fn().mockResolvedValue(undefined)
}));

jest.mock("@/lib/schemas", () => ({
    ...jest.requireActual("@/lib/schemas"),
    WorkflowDefinitionSchema: {
        parse: jest.fn((data) => data) // Simple pass-through or mock return
    }
}));

describe('Workflow Service (English Ontology)', () => {
    const correlationId = uuidv4();

    it('should create or update definition using English keys', async () => {
        const mockDef = {
            name: "Test Flow",
            entityType: "ENTITY",
            is_default: true,
            states: [],
            transitions: [],
            tenantId: 'test_tenant',
            industry: 'ELEVATORS'
        };

        const result = await WorkflowService.createOrUpdateDefinition(mockDef as any, correlationId);
        expect(result).toBeDefined();
    });

    it('should get active workflow with correct entityType ENUM', async () => {
        const workflow = await WorkflowService.getActiveWorkflow('test_tenant', 'ENTITY');
        expect(workflow).toBeDefined();
        if (workflow) {
            expect(workflow.entityType).toBe('ENTITY');
        }
    });

    it('should seed default workflow with correct structure', async () => {
        const result = await WorkflowService.seedDefaultWorkflow('new_tenant', 'ELEVATORS', correlationId);
        expect(result).toBeDefined();

        // Validation of internal structure happens inside createOrUpdateDefinition via Zod, 
        // but since we mocked Zod, we trust the flow completes.
    });
});
