import { requirePermission } from '@/lib/auth';
import { SuperAdminHubClient } from "./SuperAdminHubClient";

/**
 * 🏰 SuperAdmin Global Dashboard (Server-Side Enforced)
 * Enforces Guardian policy 'admin:superadmin' before rendering.
 */
export default async function GlobalDashboardPage() {
    await requirePermission('admin:superadmin', 'access');

    return <SuperAdminHubClient />;
}
