import { enforcePermission } from "@/lib/guardian-guard";
import { SecurityHubClient } from "./SecurityHubClient";

/**
 * 🛡️ Security Hub Page (Server-Side Enforced)
 * Enforces Guardian policy 'admin:security' before rendering.
 */
export default async function SecurityHubPage() {
    await enforcePermission('admin:security', 'access');

    return <SecurityHubClient />;
}
