"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from 'lucide-react';
import { ClientReportGenerator } from '@/lib/pdf/client-generator';
import { toast } from 'sonner';

interface ExportButtonProps {
    data: {
        identifier: string;
        analysisDate: Date;
        models: any[];
        correlationId: string;
    };
    locale?: string;
}

export function ExportButton({ data, locale = 'es' }: ExportButtonProps) {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        const t = toast.loading(locale === 'es' ? 'Generando PDF...' : 'Generating PDF...');

        try {
            const blob = await ClientReportGenerator.generateRAGReport({
                ...data,
                locale
            });

            ClientReportGenerator.download(blob, `ABD_Report_${data.identifier}.pdf`);
            toast.success(locale === 'es' ? 'PDF generado' : 'PDF generated', { id: t });
        } catch (error) {
            console.error('Export error:', error);
            toast.error(locale === 'es' ? 'Error al generar PDF' : 'Error generating PDF', { id: t });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Button
            onClick={handleExport}
            disabled={isExporting}
            className="bg-slate-900 hover:bg-slate-800 text-white gap-2"
        >
            {isExporting ? (
                <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generando PDF...
                </>
            ) : (
                <>
                    <FileDown className="h-4 w-4" />
                    Exportar PDF
                </>
            )}
        </Button>
    );
}
