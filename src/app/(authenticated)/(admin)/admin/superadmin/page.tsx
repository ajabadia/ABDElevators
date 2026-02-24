import { enforcePermission } from "@/lib/guardian-guard";
import { SuperAdminHubClient } from "./SuperAdminHubClient";

/**
 * 🏰 SuperAdmin Global Dashboard (Server-Side Enforced)
 * Enforces Guardian policy 'admin:superadmin' before rendering.
 */
export default async function GlobalDashboardPage() {
    await enforcePermission('admin:superadmin', 'access');

    return <SuperAdminHubClient />;
}
