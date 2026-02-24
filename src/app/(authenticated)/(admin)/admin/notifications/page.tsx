import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { MetricCard } from '@/components/ui/metric-card';
import { NotificationService } from '@/services/admin/NotificationService';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, FileText, Settings, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';

export default async function NotificationsDashboardPage() {
    const session = await auth();

    if (session?.user?.role !== 'SUPER_ADMIN') {
        redirect('/dashboard');
    }

    const t = await getTranslations('admin.notifications.page');
    const tKpi = await getTranslations('admin.notifications.kpi');
    const tTable = await getTranslations('admin.notifications.table');
    const tStatus = await getTranslations('admin.notifications.status');
    const tValidation = await getTranslations('admin.notifications.validation');

    // Fetch data via Service (Rule 11/12 Alignment)
    const stats = await NotificationService.getStats();
    const recentLogs = await NotificationService.getRecentLogs(10);

    return (
        <PageContainer>
            <PageHeader
                title={t('title')}
                subtitle={t('subtitle')}
                actions={
                    <div className="flex gap-4">
                        <Link href="/admin/notifications/templates">
                            <Button variant="outline" className="gap-2">
                                <FileText className="h-4 w-4" />
                                {t('manageTemplates')}
                            </Button>
                        </Link>
                        <Link href="/admin/notifications/settings">
                            <Button className="gap-2 bg-slate-900 text-white hover:bg-slate-800">
                                <Settings className="h-4 w-4" />
                                {t('channelSettings')}
                            </Button>
                        </Link>
                    </div>
                }
            />

            <div className="space-y-8 mt-6">
                {/* Stats Cards - Unified via MetricCard */}
                <div className="grid gap-6 md:grid-cols-3">
                    <MetricCard
                        title={tKpi('totalSent')}
                        value={stats.totalSent}
                        icon={<Bell className="h-5 w-5" />}
                        variant="primary"
                        description={tKpi('totalSentDesc')}
                    />
                    <MetricCard
                        title={tKpi('billing')}
                        value={stats.totalBilling}
                        icon={<AlertTriangle className="h-5 w-5" />}
                        variant="warning"
                        description={tKpi('billingDesc')}
                    />
                    <MetricCard
                        title={tKpi('errors')}
                        value={stats.totalErrors}
                        icon={<AlertTriangle className="h-5 w-5" />}
                        variant="secondary"
                        description={tKpi('errorsDesc')}
                        className={stats.totalErrors > 0 ? "ring-1 ring-rose-500/20 shadow-rose-500/5 transition-all" : ""}
                    />
                </div>

                {/* Logs Recientes - Styled via Hub Pattern */}
                <Card className="border-none shadow-sm bg-card rounded-3xl overflow-hidden">
                    <CardHeader className="px-6 py-4 border-b border-border/50">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <span className="bg-primary w-1 h-5 rounded-full" />
                            {tTable('recent')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow className="hover:bg-transparent border-border/50">
                                    <TableHead className="pl-6 font-bold uppercase text-[10px] tracking-widest h-10">{tTable('status')}</TableHead>
                                    <TableHead className="font-bold uppercase text-[10px] tracking-widest h-10">{tTable('type')}</TableHead>
                                    <TableHead className="font-bold uppercase text-[10px] tracking-widest h-10">{tTable('title')}</TableHead>
                                    <TableHead className="font-bold uppercase text-[10px] tracking-widest h-10">{tTable('recipient')}</TableHead>
                                    <TableHead className="pr-6 font-bold uppercase text-[10px] tracking-widest h-10">{tTable('ago')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentLogs.map((log: any) => (
                                    <TableRow key={log._id.toString()} className="hover:bg-muted/30 transition-colors border-border/50">
                                        <TableCell className="pl-6">
                                            {log.level === 'ERROR' ? (
                                                <Badge variant="destructive" className="gap-1 font-bold text-[10px] py-0.5"><AlertTriangle className="h-3 w-3" /> {tStatus('error')}</Badge>
                                            ) : log.emailSent ? (
                                                <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 gap-1 font-bold text-[10px] py-0.5">
                                                    <CheckCircle className="h-3 w-3" /> {tStatus('sent')}
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="gap-1 font-bold text-[10px] py-0.5"><Info className="h-3 w-3" /> {tStatus('inApp')}</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-mono text-[10px] text-muted-foreground/70">{log.type}</TableCell>
                                        <TableCell className="font-bold text-sm">{log.title}</TableCell>
                                        <TableCell className="text-muted-foreground text-[13px]">
                                            {log.emailRecipient || log.userId || 'Broadcast'}
                                        </TableCell>
                                        <TableCell className="pr-6 text-muted-foreground text-[13px]">
                                            {log.createdAt ? (
                                                (() => {
                                                    try {
                                                        return formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: es });
                                                    } catch (e) {
                                                        return tValidation('invalidDate');
                                                    }
                                                })()
                                            ) : 'N/A'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {recentLogs.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-20 text-muted-foreground/50 italic text-sm">
                                            No recent notifications found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </PageContainer>
    );
}
