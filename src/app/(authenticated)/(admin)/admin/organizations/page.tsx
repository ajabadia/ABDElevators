import { requirePermission } from '@/lib/auth';
import { OrganizationsHubClient } from "./OrganizationsHubClient";

/**
 * 🏢 Organizations Hub Page (Server-Side Enforced)
 * Enforces Guardian policy 'admin:organizations' before rendering.
 */
export default async function OrganizationsHubPage() {
    await requirePermission('admin:organizations', 'manage');

    return <OrganizationsHubClient />;
}
