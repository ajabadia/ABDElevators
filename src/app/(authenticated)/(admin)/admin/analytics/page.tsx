import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PlatformAnalytics } from '@/components/admin/PlatformAnalytics';
import { TrendingUp } from 'lucide-react';

export default async function AnalyticsPage() {
    const session = await auth();

    if (session?.user?.role !== 'SUPER_ADMIN') {
        redirect('/dashboard');
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <span className="bg-teal-600 w-1.5 h-8 rounded-full" />
                        Métricas <span className="text-teal-600">Globales</span>
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Perspectiva analítica del rendimiento de la plataforma y el ecosistema RAG.
                    </p>
                </div>
            </div>
            <PlatformAnalytics />
        </div>
    );
}
