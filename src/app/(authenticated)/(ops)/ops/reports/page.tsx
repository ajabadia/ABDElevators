'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/ui/page-header';
import { PageContainer } from '@/components/ui/page-container';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download, Clock, Mail, Calendar, Server, FileText, AlertCircle, Play } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ReportSchedule {
    _id: string;
    name: string;
    templateType: string;
    cronExpression: string;
    recipients: string[];
    enabled: boolean;
    nextRunAt?: string;
    lastRunAt?: string;
}

export default function OpsReportsPage() {
    const t = useTranslations('admin.reports.schedules');
    const tOps = useTranslations('operations_hub.reports');
    const tCommon = useTranslations('common');
    const [schedules, setSchedules] = useState<ReportSchedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [isExporting, setIsExporting] = useState<string | null>(null);
    const [recentReports, setRecentReports] = useState<any[]>([]);

    const fetchSchedules = async () => {
        try {
            const res = await fetch('/api/admin/reports/schedules');
            if (!res.ok) throw new Error('Failed to fetch schedules');
            const data = await res.json();
            setSchedules(data);
        } catch (error) {
            console.error('Failed to load schedules', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRecentReports = async () => {
        try {
            const res = await fetch('/api/admin/reports?limit=5');
            if (res.ok) {
                const data = await res.json();
                setRecentReports(data.data);
            }
        } catch (error) {
            console.error('Failed to load recent reports', error);
        }
    };

    useEffect(() => {
        fetchSchedules();
        fetchRecentReports();
    }, []);

    const handleExport = async (type: string, formatId: 'csv' | 'json') => {
        setIsExporting(type);
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const params = new URLSearchParams({
                type,
                format: formatId,
                from: thirtyDaysAgo.toISOString()
            });

            // Assuming /api/ops/export exists and handles CSV streams
            window.location.href = `/api/ops/export?${params.toString()}`;
            toast.success(`Exportando ${type} en formato ${formatId.toUpperCase()}...`);
        } catch (error) {
            toast.error('Error al solicitar la exportación');
        } finally {
            setTimeout(() => setIsExporting(null), 2000);
        }
    };

    return (
        <PageContainer>
            <PageHeader
                title={tOps('title')}
                subtitle={tOps('subtitle')}
                helpId="ops-reports"
                icon={<Server className="w-6 h-6 text-primary" />}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-5 duration-700 mt-2">

                {/* Panel Exportaciones Rápidas */}
                <Card className="col-span-1 bg-card/50 backdrop-blur-sm border border-border flex flex-col">
                    <CardHeader className="border-b border-border px-8 py-6">
                        <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                            <Download className="w-5 h-5 text-primary" />
                            {tOps('quickExport.title')}
                        </CardTitle>
                        <CardDescription className="text-muted-foreground font-medium">
                            Descarga directa de datos críticos (Últimos 30 días)
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 space-y-4 flex-1">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-4 rounded-2xl bg-muted/50 border border-border">
                                <div>
                                    <p className="text-foreground font-bold">Logs de Sistema</p>
                                    <p className="text-muted-foreground text-xs">Errores, avisos y traces</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" onClick={() => handleExport('usage_logs', 'csv')} disabled={isExporting === 'usage_logs'}>CSV</Button>
                                    <Button size="sm" variant="outline" onClick={() => handleExport('usage_logs', 'json')} disabled={isExporting === 'usage_logs'}>JSON</Button>
                                </div>
                            </div>

                            <div className="flex justify-between items-center p-4 rounded-2xl bg-muted/50 border border-border">
                                <div>
                                    <p className="text-foreground font-bold">Auditoría (Audit Trail)</p>
                                    <p className="text-muted-foreground text-xs">Cambios de config y permisos</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" onClick={() => handleExport('audit_logs', 'csv')} disabled={isExporting === 'audit_logs'}>CSV</Button>
                                    <Button size="sm" variant="outline" onClick={() => handleExport('audit_logs', 'json')} disabled={isExporting === 'audit_logs'}>JSON</Button>
                                </div>
                            </div>

                            <div className="flex justify-between items-center p-4 rounded-2xl bg-muted/50 border border-border">
                                <div>
                                    <p className="text-foreground font-bold">{tOps('quickExport.knowledge.title')}</p>
                                    <p className="text-muted-foreground text-xs">{tOps('quickExport.knowledge.desc')}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" onClick={() => handleExport('knowledge_assets', 'csv')} disabled={isExporting === 'knowledge_assets'}>CSV</Button>
                                    <Button size="sm" variant="outline" onClick={() => handleExport('knowledge_assets', 'json')} disabled={isExporting === 'knowledge_assets'}>JSON</Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tabla de Programaciones */}
                <Card className="col-span-1 md:col-span-2 bg-card/50 backdrop-blur-sm border border-border">
                    <CardHeader className="border-b border-border px-8 py-6 flex flex-row justify-between items-center">
                        <div className="space-y-1">
                            <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                                <Clock className="w-5 h-5 text-primary" />
                                Informes Programados
                            </CardTitle>
                            <CardDescription className="text-muted-foreground font-medium">
                                Planificador de entregas automáticas por email
                            </CardDescription>
                        </div>
                        <Button variant="outline" className="gap-2 rounded-xl" onClick={() => window.location.href = '/admin/reports/schedules'}>
                            Gestionar Programaciones
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex justify-center py-10 text-muted-foreground">Cargando...</div>
                        ) : schedules.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-10 text-center space-y-4 text-slate-500">
                                <AlertCircle className="w-8 h-8 opacity-20" />
                                <p>{tOps('noSchedules')}</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader className="bg-muted/50 text-foreground">
                                    <TableRow className="border-none">
                                        <TableHead className="px-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nombre</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Plantilla</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Destinatarios</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Próxima Ejecución</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {schedules.map(schedule => (
                                        <TableRow key={schedule._id} className="border-b border-border/50 hover:bg-muted/50">
                                            <TableCell className="px-8 font-bold">{schedule.name}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="uppercase text-[10px]">{schedule.templateType}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 text-slate-500 text-sm">
                                                    <Mail size={14} /> {schedule.recipients.length}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {schedule.nextRunAt ? (
                                                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                                                        <Calendar size={14} />
                                                        {format(new Date(schedule.nextRunAt), 'dd MMM yyyy HH:mm', { locale: es })}
                                                    </div>
                                                ) : '-'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

            </div>

            {/* Historial de Reportes Generados */}
            <div className="mt-6 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-100">
                <Card className="bg-card/50 backdrop-blur-sm border border-border">
                    <CardHeader className="border-b border-border px-8 py-6 flex flex-row justify-between items-center">
                        <div className="space-y-1">
                            <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                                <FileText className="w-5 h-5 text-primary" />
                                Últimos Informes Generados
                            </CardTitle>
                            <CardDescription className="text-muted-foreground font-medium">
                                Historial reciente de reportes (manuales y automáticos)
                            </CardDescription>
                        </div>
                        <Button variant="outline" className="gap-2 rounded-xl" onClick={() => window.location.href = '/admin/reports'}>
                            Ver Todos
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        {recentReports.length === 0 ? (
                            <div className="p-10 text-center text-slate-500 text-sm">
                                <p>No hay informes recientes.</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader className="bg-muted/50 text-foreground">
                                    <TableRow className="border-none">
                                        <TableHead className="px-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Título del informe</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Plantilla técnica</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Fecha de generación</TableHead>
                                        <TableHead className="text-right px-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Acción</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentReports.map(report => (
                                        <TableRow key={report._id} className="border-b border-border/50 hover:bg-muted/50 group">
                                            <TableCell className="px-8">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-primary">
                                                        <FileText size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="text-foreground font-bold">{report.title}</p>
                                                        <p className="text-[10px] text-muted-foreground font-mono">ID: {report._id.slice(-8)}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="uppercase text-[10px]">{report.type}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 text-slate-500 text-sm">
                                                    <Calendar size={14} className="opacity-50" />
                                                    {report.metadata?.generatedAt ? format(new Date(report.metadata.generatedAt), 'dd/MM/yyyy HH:mm') : '-'}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right px-8">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-10 w-10 p-0 rounded-xl hover:bg-primary hover:text-white"
                                                    onClick={() => toast.info("Descargando copia histórica...")}
                                                >
                                                    <Download size={16} />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </PageContainer>
    );
}
