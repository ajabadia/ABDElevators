"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link2, Trash2, Search, Plus, AlertCircle } from "lucide-react";
import { useApiList } from "@/hooks/useApiList";
import { useApiMutation } from "@/hooks/useApiMutation";
import { toast } from "sonner";
import { KnowledgeAsset } from "@/types/knowledge";

interface RelationshipManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    asset: KnowledgeAsset;
}

const RELATIONSHIP_TYPES = [
    { value: 'SUPERSEDES', label: 'Anula/Sustituye a' },
    { value: 'COMPLEMENTS', label: 'Complementa a' },
    { value: 'DEPENDS_ON', label: 'Depende de' },
    { value: 'AMENDS', label: 'Enmienda a' },
    { value: 'RELATED_TO', label: 'Relacionado con' },
];

export function RelationshipManagerModal({ isOpen, onClose, asset }: RelationshipManagerModalProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedType, setSelectedType] = useState<string>('RELATED_TO');
    const [description, setDescription] = useState("");

    // Fetch other assets for selection
    const { data: otherAssets, isLoading } = useApiList<KnowledgeAsset>({
        endpoint: '/api/admin/knowledge-assets',
        filters: { search: searchTerm },
        dataKey: 'assets'
    });

    const mutation = useApiMutation({
        endpoint: `/api/admin/knowledge-assets/${asset?._id}/relationships`,
        method: 'PATCH',
        onSuccess: () => {
            toast.success("Vínculos actualizados", { description: "Los cambios se han guardado correctamente." });
            onClose();
        }
    });

    const handleAdd = (targetId: string) => {
        if (asset._id === targetId) return;
        const current = asset.relatedAssets || [];
        if (current.find(r => r.targetId === targetId)) return;

        const updated = [...current, { targetId, type: selectedType as any, description }];
        mutation.mutate(updated);
    };

    const handleRemove = (targetId: string) => {
        const current = asset.relatedAssets || [];
        const updated = current.filter(r => r.targetId !== targetId);
        mutation.mutate(updated);
    };

    // Filter out the current asset from the search results
    const filteredResults = otherAssets.filter(a => a._id !== asset?._id);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl border-slate-200">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-teal-100 rounded-lg text-teal-600">
                            <Link2 size={20} />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold">Relaciones del Documento</DialogTitle>
                            <DialogDescription className="text-slate-500">
                                Gestiona los vínculos lógicos entre este documento y el resto del corpus.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {/* Current Relationships */}
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Vínculos Existentes</h4>
                        <div className="space-y-2">
                            {(!asset?.relatedAssets || asset.relatedAssets.length === 0) ? (
                                <div className="text-sm text-slate-400 bg-slate-50 rounded-lg p-4 text-center border-2 border-dashed border-slate-100">
                                    No hay documentos vinculados todavía.
                                </div>
                            ) : (
                                asset.relatedAssets.map((rel: any) => (
                                    <div key={rel.targetId} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-teal-200 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <Badge variant="secondary" className="bg-teal-50 text-teal-700 hover:bg-teal-100">
                                                {RELATIONSHIP_TYPES.find(t => t.value === rel.type)?.label || rel.type}
                                            </Badge>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900">ID: {rel.targetId}</p>
                                                {rel.description && <p className="text-[11px] text-slate-400 italic">{rel.description}</p>}
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                            onClick={() => handleRemove(rel.targetId)}
                                        >
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Add New Relationship */}
                    <div className="pt-4 border-t border-slate-100">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Añadir Nuevo Vínculo</h4>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Tipo de Relación</label>
                                <Select value={selectedType} onValueChange={setSelectedType}>
                                    <SelectTrigger className="border-slate-200">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {RELATIONSHIP_TYPES.map(t => (
                                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Notas (Opcional)</label>
                                <Input
                                    placeholder="Ej: Ver página 23"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="border-slate-200"
                                />
                            </div>
                        </div>

                        <div className="relative mb-2">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <Input
                                placeholder="Buscar documento por nombre o modelo..."
                                className="pl-9 border-slate-200 h-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <ScrollArea className="h-[200px] border border-slate-100 rounded-lg p-2 bg-slate-50/50">
                            {isLoading ? (
                                <div className="text-center py-8 text-slate-400 text-sm">Buscando documentos...</div>
                            ) : filteredResults.length === 0 ? (
                                <div className="text-center py-8 text-slate-400 text-sm">No se encontraron resultados</div>
                            ) : (
                                <div className="space-y-1">
                                    {filteredResults.map((target) => (
                                        <div key={target._id} className="flex items-center justify-between p-2 hover:bg-white hover:shadow-sm rounded-md transition-all group">
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-slate-700 truncate">{target.filename}</p>
                                                <p className="text-[10px] text-slate-400 uppercase font-bold">{target.model} | {target.componentType}</p>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-7 gap-1 border-teal-200 text-teal-600 hover:bg-teal-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => handleAdd(target._id)}
                                            >
                                                <Plus size={12} /> Vincular
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </div>

                {selectedType === 'SUPERSEDES' && (
                    <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100 text-amber-700 text-xs mt-2">
                        <AlertCircle size={14} className="shrink-0" />
                        <p><strong>Nota:</strong> Los vínculos tipo "Anula/Sustituye a" generarán advertencias automáticas en el RAG cuando se consulte el documento antiguo.</p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
