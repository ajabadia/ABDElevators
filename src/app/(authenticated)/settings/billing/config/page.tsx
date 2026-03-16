import { requirePermission } from "@/lib/auth";
import BillingConfigClient from "./BillingConfigClient";
import { FeatureShell } from "@/components/shared/FeatureShell";
import { getTranslations } from "next-intl/server";
import { CreditCard } from "lucide-react";
import { SaveConfigAction } from "@/components/admin/organizations/SaveConfigAction";

/**
 * 💳 Billing Configuration Page (Server Component)
 * Standardized with FeatureShell.
 */
export default async function BillingConfigPage() {
    await requirePermission('admin:billing', 'manage');
    const t = await getTranslations("admin.organizations.billing_page");

    return (
        <FeatureShell
            title={t('title')}
            subtitle={t('subtitle')}
            icon={<CreditCard className="w-6 h-6 text-primary" />}
            backHref="/settings/billing"
            actions={<SaveConfigAction formId="billing-form" />}
        >
            <BillingConfigClient />
        </FeatureShell>
    );
}
