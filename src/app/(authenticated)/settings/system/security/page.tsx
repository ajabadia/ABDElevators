import { requirePermission } from '@/lib/auth';
import { SecurityHubClient } from "./SecurityHubClient";

/**
 * 🛡️ Security Hub Page (Server-Side Enforced)
 * Enforces Guardian policy 'admin:security' before rendering.
 */
export default async function SecurityHubPage() {
    await requirePermission('admin:security', 'access');

    return <SecurityHubClient />;
}
