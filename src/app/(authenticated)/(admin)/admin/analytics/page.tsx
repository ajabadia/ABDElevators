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
        <div className="space-y-6 h-full p-6 lg:p-10 animate-in fade-in duration-500 bg-slate-50/30 dark:bg-slate-950/30 min-h-screen">
            <PlatformAnalytics />
        </div>
    );
}
