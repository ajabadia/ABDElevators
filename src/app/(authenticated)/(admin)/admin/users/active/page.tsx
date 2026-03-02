import { enforcePermission } from "@/lib/guardian-guard";
import { ActiveUsersClient } from "@/components/admin/users/ActiveUsersClient";
import { auth } from "@/lib/auth";
import { UserRole } from "@/types/roles";

/**
 * 👥 Active Users Module (Phase 233)
 * Management of active registered users.
 * Refactored to Server Component for Security Rule #12.
 */
export default async function UsersActivePage() {
    // Requires users:read permission
    await enforcePermission('admin:users', 'read');

    // Fetch session securely on server to determine if SuperAdmin
    const session = await auth();
    const isSuperAdmin = session?.user?.role === UserRole.SUPER_ADMIN;

    return <ActiveUsersClient isSuperAdmin={isSuperAdmin} />;
}
