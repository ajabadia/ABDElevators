import { enforcePermission } from "@/lib/guardian-guard";
import { BillingHubClient } from "./BillingHubClient";

/**
 * 💳 Billing Hub Page (Server-Side Enforced)
 * Enforces Guardian policy 'admin:billing' before rendering.
 */
export default async function BillingPage() {
    await enforcePermission('admin:billing', 'manage');

    return <BillingHubClient />;
}
