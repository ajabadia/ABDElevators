import { enforcePermission } from "@/lib/guardian-guard";
import { OrganizationsHubClient } from "./OrganizationsHubClient";

/**
 * 🏢 Organizations Hub Page (Server-Side Enforced)
 * Enforces Guardian policy 'admin:organizations' before rendering.
 */
export default async function OrganizationsHubPage() {
    await enforcePermission('admin:organizations', 'manage');

    return <OrganizationsHubClient />;
}
