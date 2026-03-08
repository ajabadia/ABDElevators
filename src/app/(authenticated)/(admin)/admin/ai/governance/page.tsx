import { requirePermission } from '@/lib/auth';
import { AiGovernanceClient } from "./AiGovernanceClient";

/**
 * 🏛️ AI Governance & Model Management (Server-Side Enforced)
 * Enforces Guardian policy 'admin:ai:governance' before rendering.
 */
export default async function AiGovernancePage() {
    await requirePermission('admin:ai:governance', 'manage');

    return <AiGovernanceClient />;
}
