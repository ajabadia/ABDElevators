'use client';

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { useApiItem } from '@/hooks/useApiItem';
import { Loader2, Database, FileJson, AlertCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface KeyDebugModalProps {
    isOpen: boolean;
    onClose: () => void;
    locale: string;
    translationKey: string;
}

export function KeyDebugModal({ isOpen, onClose, locale, translationKey }: KeyDebugModalProps) {
    const { data: debugInfo, isLoading, error } = useApiItem<any>({
        endpoint: isOpen ? `/api/admin/i18n/${locale}/debug?key=${translationKey}` : null!,
    });

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Badge variant="outline" className="text-[10px] font-mono">
                            {locale.toUpperCase()}
                        </Badge>
                        <span className="truncate">{translationKey}</span>
                    </DialogTitle>
                    <DialogDescription>
                        Estado técnico y overrides en base de datos.
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-4">
                        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                        <p className="text-sm text-muted-foreground font-medium">Consultando capas de traducción...</p>
                    </div>
                ) : error ? (
                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-3 text-destructive">
                        <AlertCircle className="w-5 h-5" />
                        <p className="text-sm font-medium">Error al cargar info de debug</p>
                    </div>
                ) : debugInfo ? (
                    <div className="space-y-6 py-4">
                        {/* Capa JSON Local */}
                        <section className="space-y-3">
                            <div className="flex items-center gap-2 text-sm font-bold text-slate-500 uppercase tracking-wider">
                                <FileJson className="w-4 h-4" />
                                Archivo JSON Local (mensajes/{locale}/...)
                            </div>
                            <div className="p-4 bg-muted/30 rounded-xl border border-border">
                                {(() => {
                                    const rawVal = debugInfo.values?.json || debugInfo.jsonValue;
                                    if (!rawVal) return <span className="text-xs text-muted-foreground italic">Llave no encontrada en archivos locales</span>;

                                    let parsedVal = rawVal;
                                    try {
                                        if (typeof rawVal === 'string' && (rawVal.startsWith('{') || rawVal.startsWith('['))) {
                                            parsedVal = JSON.parse(rawVal);
                                        }
                                    } catch (e) { /* ignore */ }

                                    return (
                                        typeof parsedVal === 'object' ? (
                                            <pre className="text-xs font-mono text-foreground break-all whitespace-pre-wrap">
                                                {JSON.stringify(parsedVal, null, 2)}
                                            </pre>
                                        ) : (
                                            <code className="text-xs font-mono text-foreground break-all">
                                                "{String(parsedVal)}"
                                            </code>
                                        )
                                    );
                                })()}
                            </div>
                        </section>

                        {/* Capa Base de Datos */}
                        <section className="space-y-3">
                            <div className="flex items-center gap-2 text-sm font-bold text-slate-500 uppercase tracking-wider">
                                <Database className="w-4 h-4" />
                                Overrides en Base de Datos (MongoDB)
                            </div>

                            {(debugInfo.values?.db?.length || debugInfo.dbEntries?.length) > 0 ? (
                                <div className="space-y-2">
                                    {(debugInfo.values?.db || debugInfo.dbEntries || []).map((entry: any, i: number) => (
                                        <div key={i} className="p-4 bg-background border border-border rounded-xl shadow-sm space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant={entry.tenantId === 'platform_master' ? 'default' : 'secondary'} className="text-[9px] font-black tracking-tighter">
                                                        {(entry.tenantId || 'UNKNOWN').toUpperCase()}
                                                    </Badge>
                                                    <Badge variant="outline" className="text-[8px] opacity-70">
                                                        {entry.namespace || 'no-ns'}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {entry.isObsolete && (
                                                        <Badge variant="outline" className="text-destructive border-destructive text-[8px] font-bold">OBSOLETO</Badge>
                                                    )}
                                                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                        <Clock className="w-3 h-3" />
                                                        {entry.lastUpdated ? format(new Date(entry.lastUpdated), 'PPp', { locale: es }) : 'N/A'}
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-xs font-mono bg-muted/50 p-2 rounded-lg border border-border/50 break-all whitespace-pre-wrap">
                                                {(() => {
                                                    try {
                                                        const p = JSON.parse(entry.value);
                                                        return JSON.stringify(p, null, 2);
                                                    } catch {
                                                        return `"${entry.value}"`;
                                                    }
                                                })()}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 border border-dashed border-border rounded-xl text-center space-y-2">
                                    <Database className="w-8 h-8 mx-auto text-muted-foreground/30" />
                                    <p className="text-xs text-muted-foreground font-medium">No hay overrides para esta llave en la DB</p>
                                </div>
                            )}
                        </section>

                        {/* Estado de Caché */}
                        <section className="flex items-center justify-between p-4 bg-teal-50 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/50 rounded-xl">
                            <span className="text-sm font-bold text-teal-800 dark:text-teal-400">Master Cache Existe</span>
                            <Badge variant={debugInfo.masterCacheExists ? 'default' : 'outline'} className={debugInfo.masterCacheExists ? 'bg-teal-600' : ''}>
                                {debugInfo.masterCacheExists ? 'ACTIVA' : 'INACTIVA'}
                            </Badge>
                        </section>
                    </div>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}
