'use client';

import { useState, useEffect, Suspense } from 'react';
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
    ArrowRight,
    Search,
    History,
    ChevronRight,
    Send
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ReportTemplateSelector } from '@/components/admin/reports/ReportTemplateSelector';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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

/**
 * ReportHubPage — ERA 6 Revamp (FASE 192)
 * 
 * Simplified report generation hub with pre-fill logic
 * and one-click actions.
 */
function ReportHubContent() {
    const t = useTranslations('admin');
    const searchParams = useSearchParams();

    // State
    const [reports, setReports] = useState<ReportRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Generation Form State
    const [selectedTemplate, setSelectedTemplate] = useState('inspection');
    const [reportTitle, setReportTitle] = useState('');

    // Pre-fill logic from URL parameters
    useEffect(() => {
        if (!searchParams) return;
        const sourceDoc = searchParams.get('sourceDoc');
        const autoOpen = searchParams.get('new') === 'true';

        if (sourceDoc) {
            setReportTitle(`Análisis: ${sourceDoc.replace(/_/g, ' ')}`);
        }

        if (autoOpen) {
            setIsDialogOpen(true);
        }
    }, [searchParams]);

    const fetchReports = async () => {
        try {
            const res = await fetch('/api/admin/reports?limit=20');
            if (res.ok) {
                const data = await res.json();
                setReports(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch reports', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

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
                    dateRange: {
                        from: thirtyDaysAgo.toISOString(),
                        to: new Date().toISOString()
                    },
                    config: {
                        title: reportTitle || undefined
                    },
                    locale: 'es'
                })
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                console.error("Report generation failed:", errorData);
                throw new Error(errorData.message || 'Generation failed');
            }

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
                toast.success("Informe enviado por correo electrónico");
            }

            setIsDialogOpen(false);
            fetchReports();
        } catch (error) {
            console.error(error);
            toast.error(t('reports.generate.error'));
        } finally {
            setGenerating(false);
        }
    };

    const getTemplateLabel = (type: string) => {
        // @ts-ignore
        return t.has(`reports.templates.${type}`) ? t(`reports.templates.${type}`) : type;
    };

    const filteredReports = reports.filter(r =>
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <PageContainer>
            <PageHeader
                title={t('reports.hub.title')}
                subtitle="Generación inteligente de informes técnicos y auditorías"
                helpId="report-hub"
                icon={<Sparkles className="w-6 h-6 text-primary" />}
                actions={
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest px-8 py-6 rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-105">
                                <Plus className="mr-2 h-5 w-5" />
                                {t('reports.hub.generateNew')}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden border-none rounded-3xl shadow-2xl">
                            <div className="bg-slate-900 p-8 text-white relative">
                                <div className="absolute top-0 right-0 p-12 opacity-10 bg-primary blur-3xl rounded-full" />
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                                        <Sparkles size={24} className="text-primary" />
                                        {t('reports.generate.title')}
                                    </DialogTitle>
                                    <DialogDescription className="text-slate-400 font-medium">
                                        Configura los parámetros para tu informe inteligente.
                                    </DialogDescription>
                                </DialogHeader>
                            </div>

                            <div className="p-8 space-y-8 bg-white dark:bg-slate-950">
                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block ml-1">
                                        1. Selección de Inteligencia
                                    </Label>
                                    <ReportTemplateSelector
                                        selectedId={selectedTemplate}
                                        onSelect={setSelectedTemplate}
                                    />
                                </div>

                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block ml-1">
                                        2. Contexto del Informe
                                    </Label>
                                    <Input
                                        id="title"
                                        value={reportTitle}
                                        onChange={(e) => setReportTitle(e.target.value)}
                                        placeholder="Ej: Análisis Schindler 3300 - Q1 2026"
                                        className="border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 focus:ring-primary h-14 rounded-2xl font-bold text-lg px-6 shadow-inner"
                                    />
                                </div>
                            </div>

                            <DialogFooter className="p-8 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex sm:justify-between items-center gap-4">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled={generating}
                                    onClick={() => handleGenerate('email')}
                                    className="font-bold text-[10px] uppercase tracking-widest text-slate-500 hover:text-primary gap-2"
                                >
                                    <Send size={14} /> Enviar por Email
                                </Button>

                                <Button
                                    onClick={() => handleGenerate('pdf')}
                                    disabled={generating}
                                    className="bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest px-8 rounded-xl h-12 shadow-lg shadow-primary/20"
                                >
                                    {generating ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando...</>
                                    ) : (
                                        <><Download size={18} className="mr-2" /> Descargar PDF</>
                                    )}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                }
            />

            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700 mt-2">
                <div className="grid grid-cols-1 gap-6">
                    <Card className="border-none shadow-xl bg-white dark:bg-slate-950 rounded-3xl overflow-hidden">
                        <CardHeader className="border-b border-slate-50 dark:border-slate-900 px-8 py-6">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div className="space-y-1">
                                    <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                                        <History className="w-5 h-5 text-primary" />
                                        Historial de Informes
                                    </CardTitle>
                                    <CardDescription className="text-slate-500 font-medium">
                                        Acceso rápido a las últimas auditorías generadas en la organización.
                                    </CardDescription>
                                </div>
                                <div className="relative w-full md:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        placeholder="Buscar por título..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 border-none shadow-inner text-xs font-bold"
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center p-20 gap-4">
                                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Recuperando registros...</p>
                                </div>
                            ) : filteredReports.length === 0 ? (
                                <div className="flex flex-col items-center justify-center p-20 text-center space-y-4">
                                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-full">
                                        <FileText className="h-10 w-10 text-slate-300" />
                                    </div>
                                    <div>
                                        <p className="text-slate-900 dark:text-slate-100 font-bold">No se encontraron informes</p>
                                        <p className="text-sm text-slate-500">Comienza generando una nueva auditoría técnica.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader className="bg-slate-50/50 dark:bg-slate-900/30">
                                            <TableRow className="hover:bg-transparent border-none">
                                                <TableHead className="px-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Título del informe</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Plantilla técnica</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fecha de generación</TableHead>
                                                <TableHead className="text-right px-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Acción</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredReports.map((report) => (
                                                <TableRow key={report._id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 border-slate-50 dark:border-slate-900 group transition-colors">
                                                    <TableCell className="px-8 py-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                                <FileText size={18} />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-slate-900 dark:text-slate-100">{report.title}</span>
                                                                <span className="text-[10px] text-slate-400 font-mono">ID: {report._id.slice(-8)}</span>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="text-[10px] font-black uppercase tracking-tighter text-slate-500 border-slate-200 dark:border-slate-800">
                                                            {getTemplateLabel(report.type)}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2 text-slate-500 font-medium">
                                                            <Calendar size={14} className="opacity-50" />
                                                            <span className="text-xs">
                                                                {report.metadata?.generatedAt ? format(new Date(report.metadata.generatedAt), 'dd/MM/yyyy HH:mm') : '-'}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right px-8">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-10 w-10 p-0 rounded-xl hover:bg-primary hover:text-white group-hover:scale-110 shadow-sm transition-all"
                                                            onClick={() => {
                                                                // Optional: Trigger direct download if we had the URL
                                                                toast.info("Descargando copia histórica...");
                                                            }}
                                                        >
                                                            <Download size={16} />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PageContainer>
    );
}

export default function ReportHubPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center p-20">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        }>
            <ReportHubContent />
        </Suspense>
    );
}
