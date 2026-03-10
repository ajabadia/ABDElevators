import { Metadata } from 'next';
import { ContractTable } from '@/components/admin/billing/ContractTable';
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
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
        <PageContainer>
            <PageHeader
                title={t('title')}
                subtitle={t('subtitle')}
            />
            <ContractTable />
        </PageContainer>
    );
}
