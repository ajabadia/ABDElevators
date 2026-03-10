import { requireRole } from "@/lib/auth";
import { UserRole } from "@/types/roles";
import { SystemHubClient } from "./SystemHubClient";

/**
 * 🛠️ System Settings Hub Page
 * Server-side entry point for /settings/system.
 * Enforces ADMIN/SUPER_ADMIN roles before rendering the client hub.
 */
export default async function SystemSettingsPage() {
    // Requires general system administration access
    await requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);

    return <SystemHubClient />;
}
