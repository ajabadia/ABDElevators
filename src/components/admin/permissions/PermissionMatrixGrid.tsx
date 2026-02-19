"use client";

import React, { useState, useMemo } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Check, X, Shield, Lock, Unlock, AlertCircle } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useTranslations } from 'next-intl';
import { PermissionPolicy } from '@/lib/schemas';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PermissionMatrixGridProps {
    policies: PermissionPolicy[];
    isLoading?: boolean;
}

/**
 * 📊 PermissionMatrixGrid (Guardian V3)
 * Provides a high-density visualization of Roles vs Resources.
 * Era 5 Industrial Standard.
 */
export function PermissionMatrixGrid({ policies, isLoading }: PermissionMatrixGridProps) {
    const t = useTranslations('admin.guardian.matrix');

    // Extract unique resources and roles/groups from policies
    const { resources, actions } = useMemo(() => {
        const resSet = new Set<string>();
        const actSet = new Set<string>();

        policies.forEach(p => {
            p.resources.forEach(r => resSet.add(r));
            p.actions.forEach(a => actSet.add(a));
        });

        return {
            resources: Array.from(resSet).sort(),
            actions: Array.from(actSet).sort()
        };
    }, [policies]);

    if (isLoading) {
        return (
            <div className="h-64 flex flex-col items-center justify-center gap-4 animate-pulse">
                <Shield className="w-12 h-12 text-slate-200" />
                <div className="h-4 w-48 bg-slate-100 rounded" />
            </div>
        );
    }

    if (policies.length === 0) {
        return (
            <div className="h-64 flex flex-col items-center justify-center gap-4 border-2 border-dashed rounded-3xl border-slate-100 p-8 text-center">
                <AlertCircle className="w-12 h-12 text-slate-200" />
                <div>
                    <h3 className="text-lg font-bold text-slate-400">{t('table.empty')}</h3>
                    <p className="text-sm text-slate-300 max-w-xs mx-auto">No se han detectado políticas de seguridad activas en este entorno.</p>
                </div>
            </div>
        );
    }

    return (
        <TooltipProvider>
            <div className="rounded-3xl border border-slate-100 bg-white shadow-xl shadow-slate-200/50 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="overflow-x-auto custom-scrollbar">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/50 border-b border-slate-100 hover:bg-transparent">
                                <TableHead className="w-[200px] font-black text-[10px] uppercase tracking-widest text-slate-400 py-6 px-6 sticky left-0 bg-slate-50/80 backdrop-blur-sm z-20">
                                    Recursos \ Acciones
                                </TableHead>
                                {actions.map(action => (
                                    <TableHead key={action} className="text-center font-black text-[10px] uppercase tracking-tighter text-slate-600 min-w-[100px] py-6">
                                        <div className="flex flex-col items-center gap-1">
                                            <span className="px-2 py-1 bg-slate-100 rounded-md text-slate-500">{action}</span>
                                        </div>
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {resources.map((resource) => (
                                <TableRow key={resource} className="group hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0">
                                    <TableCell className="font-bold text-xs py-4 px-6 sticky left-0 bg-white group-hover:bg-slate-50/80 backdrop-blur-sm z-10 border-r border-slate-50">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 rounded-lg bg-teal-50 text-teal-600">
                                                <Lock size={12} />
                                            </div>
                                            <span className="truncate max-w-[160px]" title={resource}>{resource}</span>
                                        </div>
                                    </TableCell>
                                    {actions.map(action => {
                                        const matchingPolicies = policies.filter(p =>
                                            p.resources.includes(resource) &&
                                            p.actions.includes(action)
                                        );

                                        const isAllowed = matchingPolicies.some(p => p.effect === 'ALLOW' && p.isActive);
                                        const isDenied = matchingPolicies.some(p => p.effect === 'DENY' && p.isActive);

                                        return (
                                            <TableCell key={`${resource}-${action}`} className="text-center py-4">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="flex justify-center cursor-help">
                                                            {isDenied ? (
                                                                <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 scale-100 group-hover:scale-110 transition-transform">
                                                                    <X size={14} strokeWidth={3} />
                                                                </div>
                                                            ) : isAllowed ? (
                                                                <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 scale-100 group-hover:scale-110 transition-transform">
                                                                    <Check size={14} strokeWidth={3} />
                                                                </div>
                                                            ) : (
                                                                <div className="w-6 h-1 rounded-full bg-slate-100 opacity-50" />
                                                            )}
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent className="p-0 border-none bg-transparent shadow-none" sideOffset={10}>
                                                        {matchingPolicies.length > 0 ? (
                                                            <div className="bg-slate-900 text-white rounded-xl p-3 shadow-2xl border border-slate-800 animate-in zoom-in-95 duration-200">
                                                                <div className="flex items-center gap-2 mb-2 border-b border-white/10 pb-2">
                                                                    <Shield size={14} className="text-teal-400" />
                                                                    <span className="text-[10px] font-black uppercase tracking-widest">{matchingPolicies.length} Políticas</span>
                                                                </div>
                                                                <div className="space-y-1.5">
                                                                    {matchingPolicies.map((p, idx) => (
                                                                        <div key={idx} className="flex items-center justify-between gap-4">
                                                                            <span className="text-[10px] font-medium text-slate-300">{p.name}</span>
                                                                            <Badge variant="outline" className={cn(
                                                                                "text-[8px] h-3.5 py-0 px-1 font-bold border-none",
                                                                                p.effect === 'ALLOW' ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                                                                            )}>
                                                                                {p.effect}
                                                                            </Badge>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="bg-slate-800 text-slate-400 text-[10px] font-bold px-3 py-1.5 rounded-lg border border-slate-700">
                                                                Acceso no definido (Inherited DENY)
                                                            </div>
                                                        )}
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <div className="mt-8 flex items-center justify-end gap-6 p-6 bg-slate-50/50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Allow Access</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Deny Access</span>
                </div>
                <div className="flex items-center gap-2 border-l border-slate-200 pl-6 ml-2">
                    <Unlock size={14} className="text-slate-300" />
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Inherited Def.</span>
                </div>
            </div>
        </TooltipProvider>
    );
}
