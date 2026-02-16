import { NotificationSettingsForm } from '@/components/admin/notifications/NotificationSettingsForm';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function NotificationSettingsPage() {
    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <Link href="/admin/notifications">
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Configuración de Notificaciones
                    </h1>
                    <p className="text-slate-500 mt-2">
                        Gestiona los canales, destinatarios y reglas de comunicación de tu organización.
                    </p>
                </div>
            </div>

            <NotificationSettingsForm />
        </div>
    );
}
