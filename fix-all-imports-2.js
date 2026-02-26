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

fixFile('src/services/admin/billing-engine.ts', [
    ['from \'@/core/application/billing/BillingPolicy\'', "from '@/lib/billing/BillingPolicy'"] // Fixed back
]);

fixFile('packages/workflow-engine/src/orchestrator.ts', [
    ['from \'@/services/ops/workflow-definition-validator\'', "from '@/services/ops/WorkflowDefinitionValidator'"] // Upper case W for case sens
]);
