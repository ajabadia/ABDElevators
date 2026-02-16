"use client";

import React, { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTranslations } from 'next-intl';

interface AuditEvent {
    _id: string;
    timestamp: string; // Serialized date
    actor: {
        email: string;
        role: string;
    };
    action: string;
    target: string;
    changes: {
        field: string;
        oldValue: any;
        newValue: any;
    }[];
    reason?: string;
}

interface ConfigAuditTableProps {
    events: AuditEvent[];
}

export function ConfigAuditTable({ events }: ConfigAuditTableProps) {
    const t = useTranslations('observability.audit');
    const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

    const toggleExpand = (id: string) => {
        setExpandedEvent(expandedEvent === id ? null : id);
    };

    if (events.length === 0) {
        return (
            <div className="text-center p-12 text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                <Settings className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>{t('empty_state')}</p>
            </div>
        );
    }

    return (
        <div className="rounded-md border bg-white dark:bg-slate-950">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50px]"></TableHead>
                        <TableHead>{t('table.date')}</TableHead>
                        <TableHead>{t('table.actor')}</TableHead>
                        <TableHead>{t('table.action')}</TableHead>
                        <TableHead>{t('table.target')}</TableHead>
                        <TableHead className="text-right">{t('table.changes')}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {events.map((event) => (
                        <React.Fragment key={event._id}>
                            <TableRow
                                className={`cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 ${expandedEvent === event._id ? 'bg-slate-50 dark:bg-slate-900' : ''}`}
                                onClick={() => toggleExpand(event._id)}
                            >
                                <TableCell>
                                    {expandedEvent === event._id ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                                </TableCell>
                                <TableCell className="whitespace-nowrap font-mono text-xs text-slate-500">
                                    {format(new Date(event.timestamp), "dd/MM/yyyy HH:mm", { locale: es })}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xs font-bold">
                                            {event.actor.email[0].toUpperCase()}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{event.actor.email}</span>
                                            <span className="text-[10px] text-slate-400">{event.actor.role}</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="font-mono text-[10px]">
                                        {event.action}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <span className="text-sm text-slate-600 dark:text-slate-400">{event.target}</span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                        {t('table.changes_count', { count: event.changes.length })}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                            {expandedEvent === event._id && (
                                <TableRow className="bg-slate-50 dark:bg-slate-900 border-b hover:bg-slate-50 dark:hover:bg-slate-900">
                                    <TableCell colSpan={6} className="p-0">
                                        <div className="p-4 pl-12 space-y-3 animate-in fade-in duration-200">
                                            {event.reason && (
                                                <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-3 rounded-lg border border-indigo-100 dark:border-indigo-900 mb-4">
                                                    <span className="text-xs font-bold text-indigo-500 block mb-1">{t('table.reason_title')}</span>
                                                    <p className="text-sm text-indigo-700 dark:text-indigo-300 italic">"{event.reason}"</p>
                                                </div>
                                            )}

                                            <div className="space-y-2">
                                                {event.changes.map((change, idx) => (
                                                    <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center p-3 bg-white dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800">
                                                        <div className="font-mono text-xs font-bold text-slate-500">
                                                            {change.field}
                                                        </div>
                                                        <div className="bg-rose-50 dark:bg-rose-950/30 p-2 rounded text-xs font-mono text-rose-600 dark:text-rose-400 overflow-hidden text-ellipsis">
                                                            <div className="text-[9px] uppercase text-rose-400 mb-1">{t('table.before')}</div>
                                                            {JSON.stringify(change.oldValue)}
                                                        </div>
                                                        <div className="bg-emerald-50 dark:bg-emerald-950/30 p-2 rounded text-xs font-mono text-emerald-600 dark:text-emerald-400 overflow-hidden text-ellipsis flex items-center justify-between">
                                                            <div>
                                                                <div className="text-[9px] uppercase text-emerald-400 mb-1">{t('table.after')}</div>
                                                                {JSON.stringify(change.newValue)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </React.Fragment>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
