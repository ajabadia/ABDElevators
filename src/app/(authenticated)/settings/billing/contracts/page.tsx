import { Metadata } from 'next';
import { ContractTable } from '@/components/admin/billing/ContractTable';
import { FeatureShell } from "@/components/shared/FeatureShell";
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('admin.billing.contracts.metadata');
    return {
        title: t('title'),
        description: t('description'),
    };
}

export default async function BillingContractsPage() {
    const t = await getTranslations('admin.billing.contracts');

    return (
        <FeatureShell
            title={t('title')}
            subtitle={t('subtitle')}
        >
            <ContractTable />
        </FeatureShell>
    );
}
