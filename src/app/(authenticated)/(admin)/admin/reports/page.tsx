'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Download, Plus, Loader2, Calendar, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ReportTemplateSelector } from '@/components/admin/reports/ReportTemplateSelector';
import { Badge } from '@/components/ui/badge';

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

export default function ReportHubPage() {
    const t = useTranslations('admin');
    const [reports, setReports] = useState<ReportRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Generation Form State
    const [selectedTemplate, setSelectedTemplate] = useState('inspection');
    const [reportTitle, setReportTitle] = useState('');

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

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const res = await fetch('/api/admin/reports/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    templateId: selectedTemplate,
                    config: {
                        title: reportTitle || undefined
                    },
                    filters: {
                        dateRange: { start: new Date().toISOString(), end: new Date().toISOString() } // Dummy range for now
                    },
                    format: 'pdf'
                })
            });

            if (!res.ok) throw new Error('Generation failed');

            // Handle PDF download
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `report-${selectedTemplate}-${Date.now()}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success(t('reports.generate.success'));
            setIsDialogOpen(false);
            fetchReports(); // Refresh list to show new record
        } catch (error) {
            console.error(error);
            toast.error(t('reports.generate.error'));
        } finally {
            setGenerating(false);
        }
    };

    const getTemplateLabel = (type: string) => {
        // @ts-ignore - Dynamic access to translations based on type
        return t.has(`reports.templates.${type}`) ? t(`reports.templates.${type}`) : type;
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{t('reports.hub.title')}</h2>
                    <p className="text-muted-foreground">
                        {t('reports.hub.subtitle')}
                    </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            {t('reports.hub.generateNew')}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>{t('reports.generate.title')}</DialogTitle>
                            <DialogDescription>
                                Configure the parameters for your new report.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-6 py-4">
                            <div className="space-y-3">
                                <Label htmlFor="template" className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    Selecciona una Plantilla
                                </Label>
                                <ReportTemplateSelector
                                    selectedId={selectedTemplate}
                                    onSelect={setSelectedTemplate}
                                />
                            </div>
                            <div className="space-y-3">
                                <Label htmlFor="title" className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    Título Personalizado
                                </Label>
                                <Input
                                    id="title"
                                    value={reportTitle}
                                    onChange={(e) => setReportTitle(e.target.value)}
                                    placeholder="Ej: Análisis Schindler 3300 - Q1 2026"
                                    className="border-slate-200 focus:ring-primary shadow-sm h-11"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleGenerate} disabled={generating}>
                                {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {generating ? t('reports.generate.generating') : 'Generate PDF'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t('reports.hub.title')}</CardTitle>
                    <CardDescription>
                        Recent generated reports in your organization.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : reports.length === 0 ? (
                        <div className="text-center p-8 text-muted-foreground">
                            {t('reports.hub.noReports')}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('reports.hub.tableHeaders.name')}</TableHead>
                                    <TableHead>{t('reports.hub.tableHeaders.type')}</TableHead>
                                    <TableHead>{t('reports.hub.tableHeaders.date')}</TableHead>
                                    <TableHead className="text-right">{t('reports.hub.tableHeaders.actions')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reports.map((report) => (
                                    <TableRow key={report._id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center">
                                                <FileText className="mr-2 h-4 w-4 text-blue-500" />
                                                {report.title}
                                            </div>
                                        </TableCell>
                                        <TableCell>{getTemplateLabel(report.type)}</TableCell>
                                        <TableCell>
                                            {report.metadata?.generatedAt ? format(new Date(report.metadata.generatedAt), 'PPT') : '-'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm">
                                                <Download className="h-4 w-4" />
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
    );
}
