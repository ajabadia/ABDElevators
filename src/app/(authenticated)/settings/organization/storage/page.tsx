import { requirePermission } from "@/lib/auth";
import StorageClient from "./StorageClient";
import { FeatureShell } from "@/components/shared/FeatureShell";
import { getTranslations } from "next-intl/server";
import { Database, Save } from "lucide-react";
import { SaveConfigAction } from "@/components/admin/organizations/SaveConfigAction";

/**
 * 💾 Storage Page (Server Component)
 * Standardized with FeatureShell.
 */
export default async function StoragePage() {
    await requirePermission('admin:storage', 'manage');
    const t = await getTranslations("admin.organizations.storage_page");

    return (
        <FeatureShell
            title={t('title')}
            subtitle={t('subtitle')}
            icon={<Database className="w-6 h-6 text-primary" />}
            backHref="/settings/organization"
            actions={<SaveConfigAction formId="storage-form" />}
        >
            <StorageClient />
        </FeatureShell>
    );
}
