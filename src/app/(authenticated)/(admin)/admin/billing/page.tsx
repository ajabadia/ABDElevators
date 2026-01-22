import { ConsumptionDashboard } from '@/components/admin/ConsumptionDashboard';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Facturación y Consumo | ABD RAG Platform',
    description: 'Gestión de recursos y facturación SaaS.',
};

export default function BillingPage() {
    return (
        <div className="container mx-auto py-8 px-4 max-w-7xl">
            <div className="mb-10">
                <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                    Facturación <span className="text-teal-600">&</span> Consumo
                </h1>
                <p className="text-slate-500 mt-2 text-lg">
                    Control centralizado de recursos industriales y métricas de plataforma.
                </p>
            </div>

            <ConsumptionDashboard />
        </div>
    );
}
