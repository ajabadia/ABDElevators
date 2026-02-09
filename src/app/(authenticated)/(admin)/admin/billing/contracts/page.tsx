
import { Metadata } from 'next';
import { ContractTable } from '@/components/admin/billing/ContractTable';
import { Separator } from '@/components/ui/separator';
import { useTranslations } from 'next-intl';

export const metadata: Metadata = {
    title: 'Gestión de Contratos y Casos | Admin',
    description: 'Administración de planes, límites y overrides por tenant.',
};



export default function BillingContractsPage() {
    const t = useTranslations('admin.billing.contracts');

    return (
        <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{t('title')}</h2>
                    <p className="text-muted-foreground">
                        {t('subtitle')}
                    </p>
                </div>
            </div>

            <Separator />

            <ContractTable />
        </div>
    );
}
