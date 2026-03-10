/**
 * 🧪 Phase 350: Schema Integrity Tests (Era 12)
 * Ensuring strict relational integrity across observability collections.
 */
import { RAGQueryLogSchema } from '../src/services/observability/schemas/RAGQueryLogSchema';
import { WorkflowExecutionSchema } from '../src/services/observability/schemas/WorkflowExecutionSchema';

console.log("🧪 Starting Schema Integrity Tests (Era 12)...");

// Mocks behaving like EntityId (Branded Type)
const mockId = "60d5b2f2d9b2e2d9a8c12345" as any; // Standard MongoDB 24-char hex

const validRAGLog = {
    tenantId: mockId,
    spaceId: mockId,
    query: "How to fix elevator?",
    correlationId: "e9b5a1b0-7b1a-4b1a-9c1a-1a2b3c4d5e6f",
    timestamp: new Date()
};

const invalidRAGLog = {
    tenantId: mockId,
    // Missing spaceId (Era 12 requirement for relational integrity)
    query: "How to fix elevator?",
    correlationId: "invalid-uuid"
};

try {
    RAGQueryLogSchema.parse(validRAGLog);
    console.log("✅ RAGQueryLogSchema: Valid log passed.");
} catch (e: any) {
    console.error("❌ RAGQueryLogSchema: Valid log failed!", e.errors || e);
}

try {
    RAGQueryLogSchema.parse(invalidRAGLog);
    console.log("❌ RAGQueryLogSchema: Invalid log passed! (Should have failed)");
} catch (e) {
    console.log("✅ RAGQueryLogSchema: Invalid log failed as expected (Missing spaceId & invalid UUID).");
}

const validWorkflow = {
    tenantId: mockId,
    workflowId: mockId,
    executionId: "e9b5a1b0-7b1a-4b1a-9c1a-1a2b3c4d5e6f",
    status: "RUNNING",
    correlationId: "e9b5a1b0-7b1a-4b1a-9c1a-1a2b3c4d5e6f",
    startedAt: new Date()
};

try {
    WorkflowExecutionSchema.parse(validWorkflow);
    console.log("✅ WorkflowExecutionSchema: Valid execution passed.");
} catch (e: any) {
    console.error("❌ WorkflowExecutionSchema: Valid execution failed!", e.errors || e);
}

console.log("🧪 Tests Completed.");
