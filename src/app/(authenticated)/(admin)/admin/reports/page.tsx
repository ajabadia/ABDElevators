import { useState, useEffect, Suspense, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    FileText,
    Download,
    Plus,
    Loader2,
    Sparkles,
    Calendar,
    Search,
    History,
    Send,
    Clock,
    ShieldCheck,
    CloudDownload
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ReportTemplateSelector } from '@/components/admin/reports/ReportTemplateSelector';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSession } from 'next-auth/react';
import { UserRole } from '@/types/roles';

interface ReportRecord {
    _id: string;
    type: string;
    title: string;
    status: string;
    generatedBy: string;
    metadata: {
        generatedAt: string;
        sectionsCount: number;
    };
}

interface ReportSchedule {
    _id: string;
    name: string;
    templateType: string;
    recipients: string[];
    enabled: boolean;
    nextRunAt?: string;
}

/**
 * ReportHubPage — ERA 10 Consolidation
 * Unified interface for Admin (Manual/Schedules) and Ops (Quick Exports).
 */
function ReportHubContent() {
    const t = useTranslations('admin_reports');
    const tOps = useTranslations('operations_hub.reports');
    const { data: session } = useSession();
    const isSuperAdmin = session?.user?.role === UserRole.SUPER_ADMIN;

    const searchParams = useSearchParams();

    // State
    const [reports, setReports] = useState<ReportRecord[]>([]);
    const [schedules, setSchedules] = useState<ReportSchedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isExporting, setIsExporting] = useState<string | null>(null);

    // Generation Form State
    const [selectedTemplate, setSelectedTemplate] = useState('inspection');
    const [reportTitle, setReportTitle] = useState('');

    const fetchReports = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/reports?limit=20');
            if (res.ok) {
                const data = await res.json();
                setReports(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch reports', error);
        }
    }, []);

    const fetchSchedules = useCallback(async () => {
        if (!isSuperAdmin) return;
        try {
            const res = await fetch('/api/admin/reports/schedules');
            if (res.ok) {
                const data = await res.json();
                setSchedules(data);
            }
        } catch (error) {
            console.error('Failed to fetch schedules', error);
        }
    }, [isSuperAdmin]);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            await Promise.all([fetchReports(), fetchSchedules()]);
            setLoading(false);
        };
        load();
    }, [fetchReports, fetchSchedules]);

    // Pre-fill logic
    useEffect(() => {
        if (!searchParams) return;
        const sourceDoc = searchParams.get('sourceDoc');
        const autoOpen = searchParams.get('new') === 'true';

        if (sourceDoc) setReportTitle(`Análisis: ${sourceDoc.replace(/_/g, ' ')}`);
        if (autoOpen) setIsDialogOpen(true);
    }, [searchParams]);

    const handleGenerate = async (formatType: 'pdf' | 'email' = 'pdf') => {
        setGenerating(true);
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const res = await fetch('/api/admin/reports/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    templateType: selectedTemplate,
                    dateRange: { from: thirtyDaysAgo.toISOString(), to: new Date().toISOString() },
                    config: { title: reportTitle || undefined },
                    locale: 'es'
                })
            });

            if (!res.ok) throw new Error('Generation failed');

            if (formatType === 'pdf') {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${reportTitle || 'informe'}-${Date.now()}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                toast.success("Informe descargado con éxito");
            } else {
                toast.success("Informe enviado por email");
            }
            setIsDialogOpen(false);
            fetchReports();
        } catch (error) {
            toast.error(t('reports.generate.error'));
        } finally {
            setGenerating(false);
        }
    };

    const handleExport = async (type: string, formatId: 'csv' | 'json') => {
        setIsExporting(type);
        try {
            const params = new URLSearchParams({ type, format: formatId });
            window.location.href = `/api/ops/export?${params.toString()}`;
            toast.success(`Exportando ${type}...`);
        } finally {
            setTimeout(() => setIsExporting(null), 2000);
        }
    };

    return (
        <PageContainer>
            <PageHeader
                title={t('reports.hub.title')}
                subtitle="Central de informes inteligentes, auditoría y exportaciones"
                icon={<Sparkles className="w-6 h-6 text-primary" />}
                actions={
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="font-black uppercase tracking-widest px-6 rounded-xl shadow-lg border-none">
                                <Plus className="mr-2 h-5 w-5" />
                                {t('reports.hub.generateNew')}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden border-none rounded-3xl">
                            <div className="bg-slate-900 p-8 text-white">
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                                        <Sparkles size={24} className="text-primary" />
                                        {t('reports.generate.title')}
                                    </DialogTitle>
                                    <DialogDescription className="text-slate-400">Configura el informe inteligente.</DialogDescription>
                                </DialogHeader>
                            </div>
                            <div className="p-8 space-y-6 bg-white dark:bg-slate-950">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">1. Inteligencia</Label>
                                    <ReportTemplateSelector selectedId={selectedTemplate} onSelect={setSelectedTemplate} />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">2. Título</Label>
                                    <Input value={reportTitle} onChange={(e) => setReportTitle(e.target.value)} placeholder="Ej: Auditoría Q1 2026" className="h-12 rounded-xl px-4" />
                                </div>
                            </div>
                            <DialogFooter className="p-8 bg-slate-50 dark:bg-slate-900 border-t flex sm:justify-between items-center gap-4">
                                <Button variant="ghost" disabled={generating} onClick={() => handleGenerate('email')} className="font-bold text-[10px] uppercase gap-2">
                                    <Send size={14} /> Email
                                </Button>
                                <Button onClick={() => handleGenerate('pdf')} disabled={generating} className="font-black uppercase px-8 rounded-xl h-11">
                                    {generating ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Download size={18} className="mr-2" />} PDF
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                }
            />

            <Tabs defaultValue="history" className="mt-6">
                <TabsList className="bg-muted/50 p-1 rounded-2xl mb-6">
                    <TabsTrigger value="history" className="rounded-xl flex items-center gap-2 px-6">
                        <History size={16} /> {t('reports.hub.historyTab') || 'Historial'}
                    </TabsTrigger>
                    {isSuperAdmin && (
                        <TabsTrigger value="schedules" className="rounded-xl flex items-center gap-2 px-6">
                            <Clock size={16} /> {t('reports.hub.schedulesTab') || 'Programados'}
                        </TabsTrigger>
                    )}
                    <TabsTrigger value="exports" className="rounded-xl flex items-center gap-2 px-6">
                        <CloudDownload size={16} /> {tOps('quickExport.title') || 'Exportaciones'}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="history">
                    <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
                        <CardHeader className="border-b px-8 py-6">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <History className="w-5 h-5 text-primary" /> Historial de Auditorías
                                </CardTitle>
                                <div className="relative w-72">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input placeholder="Filtrar informes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 h-10 rounded-xl" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {loading ? (
                                <div className="flex flex-col items-center py-20 gap-4"><Loader2 className="animate-spin text-primary" /><p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Cargando...</p></div>
                            ) : (
                                <Table>
                                    <TableHeader className="bg-muted/30"><TableRow className="border-none">
                                        <TableHead className="px-8 font-black uppercase text-[10px] tracking-widest">Informe</TableHead>
                                        <TableHead className="font-black uppercase text-[10px] tracking-widest">Plantilla</TableHead>
                                        <TableHead className="font-black uppercase text-[10px] tracking-widest">Generado</TableHead>
                                        <TableHead className="text-right px-8 font-black uppercase text-[10px] tracking-widest">Acción</TableHead>
                                    </TableRow></TableHeader>
                                    <TableBody>
                                        {reports.filter(r => r.title.toLowerCase().includes(searchQuery.toLowerCase())).map((report) => (
                                            <TableRow key={report._id} className="hover:bg-muted/50 border-border/50 group">
                                                <TableCell className="px-8 py-4 font-bold">{report.title}</TableCell>
                                                <TableCell><Badge variant="secondary" className="text-[9px] uppercase">{report.type}</Badge></TableCell>
                                                <TableCell className="text-xs text-muted-foreground">{report.metadata?.generatedAt ? format(new Date(report.metadata.generatedAt), 'dd/MM/yyyy HH:mm') : '-'}</TableCell>
                                                <TableCell className="text-right px-8"><Button variant="ghost" size="sm" onClick={() => toast.info("No disponible")}><Download size={16} /></Button></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="schedules">
                    <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
                        <CardHeader className="border-b px-8 py-6">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Clock className="w-5 h-5 text-primary" /> Programación de Informes
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-muted/30"><TableRow className="border-none">
                                    <TableHead className="px-8 font-black uppercase text-[10px] tracking-widest">Nombre</TableHead>
                                    <TableHead className="font-black uppercase text-[10px] tracking-widest">Tipo</TableHead>
                                    <TableHead className="font-black uppercase text-[10px] tracking-widest">Próxima Ejecución</TableHead>
                                    <TableHead className="text-right px-8 font-black uppercase text-[10px] tracking-widest">Estado</TableHead>
                                </TableRow></TableHeader>
                                <TableBody>
                                    {schedules.map(s => (
                                        <TableRow key={s._id} className="border-border/50">
                                            <TableCell className="px-8 py-4 font-bold">{s.name}</TableCell>
                                            <TableCell><Badge variant="outline" className="text-[9px] uppercase">{s.templateType}</Badge></TableCell>
                                            <TableCell className="text-xs">{s.nextRunAt ? format(new Date(s.nextRunAt), 'dd/MM/yyyy HH:mm') : '-'}</TableCell>
                                            <TableCell className="text-right px-8">
                                                <Badge variant={s.enabled ? "success" : "secondary"}>{s.enabled ? 'Activo' : 'Pausado'}</Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="exports">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
                            <CardHeader className="border-b px-8 py-6">
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5 text-primary" /> Auditoría SOC2 / Seguridad
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 space-y-4">
                                <div className="flex items-center justify-between p-4 bg-muted/40 rounded-2xl border">
                                    <div className="space-y-1">
                                        <p className="font-bold">Audit Trail (Actividad)</p>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Formato CSV / JSON</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" onClick={() => handleExport('audit_logs', 'csv')}>CSV</Button>
                                        <Button size="sm" variant="outline" onClick={() => handleExport('audit_logs', 'json')}>JSON</Button>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-muted/40 rounded-2xl border">
                                    <div className="space-y-1">
                                        <p className="font-bold">Acceso a PII / Datos Sensibles</p>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Trazabilidad completa</p>
                                    </div>
                                    <Button size="sm" variant="outline" onClick={() => handleExport('pii_logs', 'csv')}>Exportar</Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
                            <CardHeader className="border-b px-8 py-6">
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-primary" /> Datos de Operación
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 space-y-4">
                                <div className="flex items-center justify-between p-4 bg-muted/40 rounded-2xl border">
                                    <div className="space-y-1">
                                        <p className="font-bold">Métricas de Uso</p>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Análisis de consumo RAG</p>
                                    </div>
                                    <Button size="sm" variant="outline" onClick={() => handleExport('usage_logs', 'csv')}>CSV</Button>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-muted/40 rounded-2xl border">
                                    <div className="space-y-1">
                                        <p className="font-bold">Activos de Conocimiento</p>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Catálogo de manuales indexados</p>
                                    </div>
                                    <Button size="sm" variant="outline" onClick={() => handleExport('knowledge_assets', 'csv')}>CSV</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </PageContainer>
    );
}

export default function ReportHubPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center p-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
            <ReportHubContent />
        </Suspense>
    );
}
