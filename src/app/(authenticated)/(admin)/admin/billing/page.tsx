import { ConsumptionDashboard } from '@/components/admin/ConsumptionDashboard';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Facturación y Consumo | ABD RAG Platform',
    description: 'Gestión de recursos y facturación SaaS.',
};

export default function BillingPage() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <span className="bg-teal-600 w-1.5 h-8 rounded-full" />
                        Facturación <span className="text-teal-600">& Consumo</span>
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Control centralizado de recursos industriales y métricas de plataforma.
                    </p>
                </div>
            </div>

            <ConsumptionDashboard />
        </div>
    );
}
