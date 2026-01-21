"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { generatePDFReport, downloadPDF } from "@/lib/pdf-export";

interface ExportButtonProps {
    reportData: {
        numeroPedido: string;
        modelos: any[];
        correlacionId: string;
    };
}

export function ExportButton({ reportData }: ExportButtonProps) {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const pdfBlob = await generatePDFReport({
                ...reportData,
                fechaAnalisis: new Date(),
            });

            const filename = `Informe_${reportData.numeroPedido}_${new Date().toISOString().split('T')[0]}.pdf`;
            downloadPDF(pdfBlob, filename);
        } catch (error) {
            console.error('Error exportando PDF:', error);
            alert('Error al generar el PDF');
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
