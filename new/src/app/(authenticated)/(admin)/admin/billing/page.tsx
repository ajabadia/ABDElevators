import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { ConsumptionDashboard } from '@/components/admin/ConsumptionDashboard';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Facturación y Consumo | ABD RAG Platform',
    description: 'Gestión de recursos y facturación SaaS.',
};

export default function BillingPage() {
    return (
        <PageContainer>
            <PageHeader
                title="Facturación & Consumo"
                highlight="& Consumo"
                subtitle="Control centralizado de recursos industriales y métricas de plataforma."
            />
            <ConsumptionDashboard />
        </PageContainer>
    );
}
