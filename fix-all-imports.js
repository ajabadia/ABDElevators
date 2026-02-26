const fs = require('fs');

const fixFile = (path, replacements) => {
    try {
        let content = fs.readFileSync(path, 'utf8');
        let changed = false;
        for (const [search, replace] of replacements) {
            if (content.includes(search)) {
                content = content.replace(new RegExp(search, 'g'), replace);
                changed = true;
            }
        }
        if (changed) {
            fs.writeFileSync(path, content, 'utf8');
            console.log('Fixed', path);
        }
    } catch (e) {
        console.error('Failed to fix', path, e);
    }
};

fixFile('src/services/ingest/knowledge-review-service.ts', [
    ['from \'../db-tenant\'', "from '@/lib/db-tenant'"],
    ['from \'../schemas/knowledge\'', "from '@/lib/schemas/knowledge'"],
    ['from \'../errors\'', "from '@/lib/errors'"],
    ['from \'../logger\'', "from '@/lib/logger'"]
]);

fixFile('src/lib/access-control.ts', [
    ['from "./db"', 'from "@/lib/db"'],
    ['from "./errors"', 'from "@/lib/errors"'],
    ['from "./billing-service"', 'from "@/services/admin/BillingService"'],
    ['from "./logger"', 'from "@/lib/logger"']
]);

fixFile('src/services/admin/billing-engine.ts', [
    ['from \'./billing/BillingPolicy\'', "from '@/core/application/billing/BillingPolicy'"]
]);

fixFile('src/services/auth/UserService.ts', [
    ['from \'./db\'', "from '@/lib/db'"],
    ['from \'./errors\'', "from '@/lib/errors'"]
]);

fixFile('src/services/support/ContactService.ts', [
    ['from \'./db-tenant\'', "from '@/lib/db-tenant'"],
    ['from \'./logger\'', "from '@/lib/logger'"]
]);

fixFile('src/services/security/security-service.ts', [
    ['from \'./errors\'', "from '@/lib/errors'"]
]);

fixFile('src/lib/langgraph-rag.ts', [
    ['from "./prompt-service"', 'from "@/services/llm/prompt-service"'],
    ['from "./rag/fact-checker-service"', 'from "@/services/core/rag/fact-checker-service"']
]);

fixFile('src/services/ingest/ChecklistExtractor.ts', [
    ['from "./prompt-service"', 'from "@/services/llm/prompt-service"']
]);

fixFile('packages/rag-engine/src/query-expansion.ts', [
    ['from "@/lib/prompt-service"', 'from "@/services/llm/prompt-service"']
]);

fixFile('packages/rag-engine/src/rag-service.ts', [
    ['from "@/lib/prompt-service"', 'from "@/services/llm/prompt-service"']
]);

fixFile('packages/rag-engine/src/reranking.ts', [
    ['from "@/lib/prompt-service"', 'from "@/services/llm/prompt-service"']
]);

fixFile('packages/workflow-engine/src/orchestrator.ts', [
    ['from \'@/lib/prompt-service\'', "from '@/services/llm/prompt-service'"],
    ['from \'@/lib/workflow-definition-validator\'', "from '@/services/ops/workflow-definition-validator'"]
]);

fixFile('packages/rag-engine/src/multilingual-search.ts', [
    ['from "@/lib/usage-service"', 'from "@/services/ops/usage-service"']
]);

fixFile('packages/workflow-engine/src/execution-engine.ts', [
    ['from \'@/lib/workflow-analytics-service\'', "from '@/services/ops/workflow-analytics-service'"]
]);

fixFile('packages/workflow-engine/src/case-engine.ts', [
    ['from \'@/lib/workflow-llm-node-service\'', "from '@/services/ops/WorkflowLLMNodeService'"]
]);

