import { PageContainer } from "@/components/ui/page-container";
import { enforcePermission } from "@/lib/guardian-guard";
import { InvitationsClient } from "@/components/admin/users/InvitationsClient";

/**
 * 📨 Invitations Module (Phase 233)
 * Management of user invitations.
 * Refactored to Server Component for Security Rule #12.
 * Renamed from 'pending' to 'invitations' for semantic clarity.
 */
export default async function UsersInvitationsPage() {
    await enforcePermission('admin:users', 'read');

    return <InvitationsClient />;
}
