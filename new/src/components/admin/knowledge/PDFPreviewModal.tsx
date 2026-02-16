"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, X } from "lucide-react";

interface PDFPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    id: string;
    filename: string;
}

export function PDFPreviewModal({ isOpen, onClose, id, filename }: PDFPreviewModalProps) {
    const previewUrl = `/api/admin/knowledge-assets/${id}/preview`;
    const downloadUrl = `/api/admin/knowledge-assets/${id}/download`;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl w-[90vw] h-[90vh] flex flex-col p-0 overflow-hidden border-slate-200">
                <DialogHeader className="p-4 border-b border-slate-100 flex-row items-center justify-between space-y-0">
                    <div>
                        <DialogTitle className="text-lg font-bold text-slate-900 truncate max-w-[60vw]">
                            {filename}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500 uppercase font-semibold tracking-wider">
                            Previsualización Segura
                        </DialogDescription>
                    </div>
                    <div className="flex items-center gap-2 pr-6">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-2 border-slate-200 text-slate-600 hover:bg-slate-50"
                            onClick={() => window.open(downloadUrl, '_blank')}
                        >
                            <Download size={14} />
                            Descargar
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-slate-600"
                            onClick={onClose}
                        >
                            <X size={18} />
                        </Button>
                    </div>
                </DialogHeader>

                <div className="flex-1 bg-slate-50 relative">
                    <iframe
                        src={previewUrl}
                        className="w-full h-full border-0"
                        title={filename}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
