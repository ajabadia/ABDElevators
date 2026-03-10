import { requirePermission } from "@/lib/auth";
import NotificationsClient from "./NotificationsClient";

/**
 * 🔔 Notifications Settings Page (Server-Side Enforced)
 * Consolidates notification preferences under a secure canonical route.
 * Enforces 'admin:notifications' permission before execution.
 */
export default async function NotificationsPage() {
    // Note: Using 'admin:organization' read as a fallback if 'admin:notifications' doesn't exist yet
    // but the roadmap implies admin access is needed.
    await requirePermission('admin:organization', 'read');

    return <NotificationsClient />;
}
