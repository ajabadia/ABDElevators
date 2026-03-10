import { requirePermission } from "@/lib/auth";
import BillingConfigClient from "./BillingConfigClient";

/**
 * 💳 Billing Configuration Page (Server-Side Enforced)
 * Consolidates all billing settings under a secure canonical route.
 * Enforces 'admin:billing' permission before execution.
 */
export default async function BillingConfigPage() {
    await requirePermission('admin:billing', 'manage');

    return <BillingConfigClient />;
}
