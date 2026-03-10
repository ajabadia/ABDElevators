"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FolderPlus, Trash2, Search, Link as LinkIcon, Star, Check } from "lucide-react";
import { useApiList } from "@/hooks/useApiList";
import { useApiMutation } from "@/hooks/useApiMutation";
import { toast } from "sonner";
import { KnowledgeAsset } from "@/types/knowledge";

interface SpaceLink {
    _id: string;
    spaceId: string;
    spacePath: string;
    isPrimary: boolean;
    spaceName?: string;
}

interface DocumentSpaceManagerProps {
    isOpen: boolean;
    onClose: () => void;
    asset: KnowledgeAsset;
}

export function DocumentSpaceManager({ isOpen, onClose, asset }: DocumentSpaceManagerProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [links, setLinks] = useState<SpaceLink[]>([]);
    const [isLoadingLinks, setIsLoadingLinks] = useState(false);

    // Fetch existing links
    const fetchLinks = async () => {
        if (!asset?._id) return;
        setIsLoadingLinks(true);
        try {
            const res = await fetch(`/api/admin/knowledge-assets/${asset._id}/spaces`);
            const json = await res.json();
            if (json.success) {
                setLinks(json.links);
            }
        } catch (error) {
            console.error("Failed to fetch links", error);
        } finally {
            setIsLoadingLinks(false);
        }
    };

    useEffect(() => {
        if (isOpen && asset?._id) {
            fetchLinks();
        }
    }, [isOpen, asset?._id]);

    // Fetch all spaces for searching
    const { data: spaces, isLoading: isLoadingSpaces } = useApiList<any>({
        endpoint: '/api/admin/spaces',
        filters: { q: searchTerm, limit: 50 },
        dataKey: 'data'
    });

    const linkMutation = useApiMutation({
        endpoint: `/api/admin/knowledge-assets/${asset?._id}/spaces`,
        method: 'POST',
        onSuccess: () => {
            fetchLinks();
            toast.success("Documento vinculado al espacio");
        }
    });

    const unlinkMutation = useApiMutation({
        endpoint: (spaceId: string) => `/api/admin/knowledge-assets/${asset?._id}/spaces/${spaceId}`,
        method: 'DELETE',
        onSuccess: () => {
            fetchLinks();
            toast.success("Vínculo eliminado");
        }
    });

    const primaryMutation = useApiMutation({
        endpoint: (spaceId: string) => `/api/admin/knowledge-assets/${asset?._id}/spaces/${spaceId}/primary`,
        method: 'PATCH',
        onSuccess: () => {
            fetchLinks();
            toast.success("Espacio principal actualizado");
        }
    });

    const handleLink = (spaceId: string) => {
        if (links.find(l => l.spaceId === spaceId)) return;
        linkMutation.mutate({ spaceId });
    };

    const handleUnlink = (spaceId: string) => {
        unlinkMutation.mutate(spaceId);
    };

    const handleSetPrimary = (spaceId: string) => {
        primaryMutation.mutate(spaceId);
    };

    const filteredSpaces = spaces.filter(s => !links.find(l => l.spaceId === s._id));

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl border-slate-200">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                            <FolderPlus size={20} />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold">Gestionar Espacios</DialogTitle>
                            <DialogDescription className="text-slate-500">
                                Un documento puede existir en múltiples carpetas sin duplicar espacio de almacenamiento.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {/* Current Links */}
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Ubicaciones Actuales</h4>
                        <div className="space-y-2">
                            {isLoadingLinks ? (
                                <div className="text-center py-4 text-slate-400 text-sm">Cargando ubicaciones...</div>
                            ) : links.length === 0 ? (
                                <div className="text-sm text-slate-400 bg-slate-50 rounded-lg p-4 text-center border-2 border-dashed border-slate-100">
                                    Este documento no tiene ubicaciones asignadas.
                                </div>
                            ) : (
                                links.map((link) => (
                                    <div key={link.spaceId} className={`flex items-center justify-between p-3 bg-white border rounded-xl transition-all ${link.isPrimary ? 'border-indigo-200 bg-indigo-50/20' : 'border-slate-200'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${link.isPrimary ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                                                <FolderPlus size={16} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900">{link.spaceName || 'Espacio Desconocido'}</p>
                                                <p className="text-[10px] text-slate-400 font-mono">{link.spacePath}</p>
                                            </div>
                                            {link.isPrimary && (
                                                <Badge className="bg-indigo-600 hover:bg-indigo-600 text-white text-[9px] uppercase px-1.5 py-0">Principal</Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {!link.isPrimary && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-400 hover:text-indigo-600"
                                                    title="Hacer Principal"
                                                    onClick={() => handleSetPrimary(link.spaceId)}
                                                >
                                                    <Star size={14} />
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                                title="Eliminar de este espacio"
                                                onClick={() => handleUnlink(link.spaceId)}
                                                disabled={link.isPrimary && links.length > 1}
                                            >
                                                <Trash2 size={14} />
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Add to New Space */}
                    <div className="pt-4 border-t border-slate-100">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Vincular a nueva Carpeta</h4>
                        <div className="relative mb-2">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <Input
                                placeholder="Buscar carpeta/espacio..."
                                className="pl-9 border-slate-200 h-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <ScrollArea className="h-[200px] border border-slate-100 rounded-lg p-2 bg-slate-50/50">
                            {isLoadingSpaces ? (
                                <div className="text-center py-8 text-slate-400 text-sm">Buscando espacios...</div>
                            ) : filteredSpaces.length === 0 ? (
                                <div className="text-center py-8 text-slate-400 text-sm">No hay más espacios disponibles</div>
                            ) : (
                                <div className="space-y-1">
                                    {filteredSpaces.map((space) => (
                                        <div key={space._id} className="flex items-center justify-between p-2 hover:bg-white hover:shadow-sm rounded-md transition-all group">
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-slate-700 truncate">{space.name}</p>
                                                <p className="text-[10px] text-slate-400 font-mono">{space.materializedPath}</p>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-7 gap-1 border-indigo-200 text-indigo-600 hover:bg-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => handleLink(space._id)}
                                            >
                                                <LinkIcon size={12} /> Vincular
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
