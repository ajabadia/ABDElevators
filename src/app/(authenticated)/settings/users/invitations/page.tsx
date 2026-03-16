import { FeatureShell } from "@/components/shared/FeatureShell";
import { requirePermission } from '@/lib/auth';
import { InvitationsClient } from "@/components/admin/users/InvitationsClient";
import { Mail } from "lucide-react";

import { getTranslations } from "next-intl/server";

/**
 * 📨 Invitations Module (Phase 233)
 * Management of user invitations.
 * Refactored to Server Component for Security Rule #12.
 */
export default async function UsersInvitationsPage() {
    await requirePermission('admin:users', 'read');
    const t = await getTranslations("admin_users.invitations");

    return (
        <FeatureShell
            title={t('title')}
            subtitle={t('desc')}
            icon={<Mail className="w-6 h-6 text-primary" />}
            backHref="/settings/users"
        >
            <div className="mt-6">
                <InvitationsClient />
            </div>
        </FeatureShell>
    );
}
