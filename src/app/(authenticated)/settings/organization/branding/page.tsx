import { requirePermission } from "@/lib/auth";
import BrandingClient from "./BrandingClient";
import { FeatureShell } from "@/components/shared/FeatureShell";
import { getTranslations } from "next-intl/server";
import { Palette } from "lucide-react";
import { SaveConfigAction } from "@/components/admin/organizations/SaveConfigAction";

/**
 * 🎨 Branding Page (Server Component)
 * Standardized with FeatureShell.
 */
export default async function BrandingPage() {
    await requirePermission('admin:branding', 'manage');
    const t = await getTranslations("admin.organizations.branding_page");

    return (
        <FeatureShell
            title={t('title')}
            subtitle={t('subtitle')}
            icon={<Palette className="w-6 h-6 text-primary" />}
            backHref="/settings/organization"
            actions={<SaveConfigAction formId="branding-form" />}
        >
            <BrandingClient />
        </FeatureShell>
    );
}
