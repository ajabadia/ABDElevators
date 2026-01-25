import { connectDB } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Bell, FileText, Settings, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export const dynamic = 'force-dynamic';

export default async function NotificationsDashboardPage() {
    const db = await connectDB();

    // 1. Estadísticas Rápidas (Real-time counts)
    const totalSent = await db.collection('notifications').countDocuments({ emailSent: true });
    const totalErrors = await db.collection('notifications').countDocuments({ level: 'ERROR' });
    const totalBilling = await db.collection('notifications').countDocuments({ type: 'BILLING_EVENT' });

    // 2. Últimos Logs
    const recentLogs = await db.collection('notifications')
        .find({})
        .sort({ createdAt: -1 })
        .limit(10)
        .toArray();

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Centro de Notificaciones</h1>
                    <p className="text-slate-500 mt-2">Gestiona las comunicaciones, plantillas y monitorea el estado del sistema.</p>
                </div>
                <div className="flex gap-4">
                    <Link href="/admin/notifications/templates">
                        <Button variant="outline" className="gap-2">
                            <FileText className="h-4 w-4" />
                            Gestionar Plantillas
                        </Button>
                    </Link>
                    <Link href="/admin/notifications/settings">
                        <Button className="gap-2 bg-slate-900 text-white hover:bg-slate-800">
                            <Settings className="h-4 w-4" />
                            Configuración de Canales
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Enviados</CardTitle>
                        <Bell className="h-4 w-4 text-slate-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalSent.toLocaleString()}</div>
                        <p className="text-xs text-slate-500">Notificaciones exitosas</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Facturación</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalBilling.toLocaleString()}</div>
                        <p className="text-xs text-slate-500">Alertas de límites/pagos</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Errores</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{totalErrors.toLocaleString()}</div>
                        <p className="text-xs text-slate-500">Fallos de envío o sistema</p>
                    </CardContent>
                </Card>
            </div>

            {/* Logs Recientes */}
            <Card>
                <CardHeader>
                    <CardTitle>Últimas Notificaciones</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Estado</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Título</TableHead>
                                <TableHead>Destinatario</TableHead>
                                <TableHead>Hace</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recentLogs.map((log: any) => (
                                <TableRow key={log._id.toString()}>
                                    <TableCell>
                                        {log.level === 'ERROR' ? (
                                            <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> Error</Badge>
                                        ) : log.emailSent ? (
                                            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 gap-1">
                                                <CheckCircle className="h-3 w-3" /> Enviado
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary" className="gap-1"><Info className="h-3 w-3" /> In-App</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">{log.type}</TableCell>
                                    <TableCell>{log.title}</TableCell>
                                    <TableCell className="text-slate-500 text-sm">
                                        {log.emailRecipient || log.userId || 'Broadcast'}
                                    </TableCell>
                                    <TableCell className="text-slate-500 text-sm">
                                        {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: es })}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
