import { requirePermission } from "@/lib/auth";
import FeaturesClient from "./FeaturesClient";
import { FeatureShell } from "@/components/shared/FeatureShell";
import { getTranslations } from "next-intl/server";
import { Puzzle } from "lucide-react";
import { SaveConfigAction } from "@/components/admin/organizations/SaveConfigAction";

/**
 * 🧩 Features Page (Server Component)
 * Standardized with FeatureShell.
 */
export default async function FeaturesPage() {
    await requirePermission('admin:features', 'read');
    const t = await getTranslations("admin.organizations.features_page");

    return (
        <FeatureShell
            title={t('title')}
            subtitle={t('subtitle')}
            icon={<Puzzle className="w-6 h-6 text-primary" />}
            backHref="/settings/organization"
            actions={<SaveConfigAction formId="features-form" />}
        >
            <FeaturesClient />
        </FeatureShell>
    );
}
