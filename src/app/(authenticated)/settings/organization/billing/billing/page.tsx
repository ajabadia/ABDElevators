import { requirePermission } from '@/lib/auth';
import { BillingHubClient } from "./BillingHubClient";

/**
 * 💳 Billing Hub Page (Server-Side Enforced)
 * Enforces Guardian policy 'admin:billing' before rendering.
 */
export default async function BillingPage() {
    await requirePermission('admin:billing', 'manage');

    return <BillingHubClient />;
}
