'use client';

import React from 'react';
import { MessageSquare, Zap, Split, Mail, Database, GitBranch, Clock, RefreshCw, GitFork, ShieldCheck, Terminal } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export const NodeLibrary = () => {
    const t = useTranslations('admin.workflows.library');

    const onDragStart = (event: React.DragEvent, nodeType: string, label: string) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.setData('application/reactflow-label', label);
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <aside className="w-72 border-r border-slate-200 bg-slate-50/50 flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-white">
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Node Library</h2>
            </div>

            <ScrollArea className="flex-grow">
                <div className="p-4 space-y-6">
                    <section className="space-y-3">
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">{t('triggers')}</h3>
                        <div
                            className="group flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl cursor-grab hover:border-teal-500 hover:shadow-md transition-all active:scale-95"
                            draggable
                            onDragStart={(e) => onDragStart(e, 'trigger', t('nodes.checklist_failed'))}
                        >
                            <div className="p-2 bg-amber-50 rounded-lg group-hover:bg-amber-100 transition-colors">
                                <Zap className="w-4 h-4 text-amber-500" />
                            </div>
                            <span className="text-sm font-bold text-slate-700">{t('nodes.event_trigger')}</span>
                        </div>
                    </section>

                    <section className="space-y-3">
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">{t('actions')}</h3>
                        <div className="grid gap-2">
                            {[
                                { type: 'action', key: 'send_email', icon: Mail, color: 'text-blue-500', bg: 'bg-blue-50' },
                                { type: 'action', key: 'log_db', icon: Database, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                                { type: 'action', key: 'slack_alert', icon: MessageSquare, color: 'text-purple-500', bg: 'bg-purple-50' },
                                { type: 'action', key: 'custom_action', icon: Zap, color: 'text-rose-500', bg: 'bg-rose-50', italic: true },
                            ].map((node) => (
                                <div
                                    key={node.key}
                                    className="group flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl cursor-grab hover:border-teal-500 hover:shadow-md transition-all active:scale-95"
                                    draggable
                                    onDragStart={(e) => onDragStart(e, node.type, t(`nodes.${node.key}` as any))}
                                >
                                    <div className={cn("p-2 rounded-lg group-hover:bg-opacity-80 transition-colors", node.bg)}>
                                        <node.icon className={cn("w-4 h-4", node.color)} />
                                    </div>
                                    <span className={cn("text-sm font-bold text-slate-700", node.italic && "italic")}>
                                        {t(`nodes.${node.key}` as any)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="space-y-3">
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">{t('industrial')}</h3>
                        <div className="grid gap-2">
                            {[
                                { type: 'humanValidation', key: 'human_validation', icon: MessageSquare, color: 'text-amber-500', bg: 'bg-amber-50' },
                                { type: 'ragCheck', key: 'rag_check', icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                                { type: 'sovereignTool', key: 'sovereign_tool', icon: Terminal, color: 'text-indigo-500', bg: 'bg-indigo-50' },
                            ].map((node) => (
                                <div
                                    key={node.key}
                                    className="group flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl cursor-grab hover:border-teal-500 hover:shadow-md transition-all active:scale-95"
                                    draggable
                                    onDragStart={(e) => onDragStart(e, node.type, t(`nodes.${node.key}` as any))}
                                >
                                    <div className={cn("p-2 rounded-lg group-hover:bg-opacity-80 transition-colors", node.bg)}>
                                        <node.icon className={cn("w-4 h-4", node.color)} />
                                    </div>
                                    <span className="text-sm font-bold text-slate-700">{t(`nodes.${node.key}` as any)}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="space-y-3 pb-8">
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">{t('logic')}</h3>
                        <div className="grid gap-2">
                            {[
                                { type: 'condition', key: 'condition', icon: Split, color: 'text-slate-500', bg: 'bg-slate-50' },
                                { type: 'switch', key: 'switch', icon: GitBranch, color: 'text-indigo-500', bg: 'bg-indigo-50' },
                                { type: 'wait', key: 'wait', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
                                { type: 'loop', key: 'loop', icon: RefreshCw, color: 'text-sky-500', bg: 'bg-sky-50' },
                                { type: 'subflow', key: 'subflow', icon: GitFork, color: 'text-purple-600', bg: 'bg-purple-100' },
                            ].map((node) => (
                                <div
                                    key={node.key}
                                    className="group flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl cursor-grab hover:border-teal-500 hover:shadow-md transition-all active:scale-95"
                                    draggable
                                    onDragStart={(e) => onDragStart(e, node.type, t(`nodes.${node.key}` as any))}
                                    role="listitem"
                                    aria-label={`Draggable ${t(`nodes.${node.key}` as any)} node`}
                                >
                                    <div className={cn("p-2 rounded-lg group-hover:bg-opacity-80 transition-colors", node.bg)}>
                                        <node.icon className={cn("w-4 h-4", node.color)} aria-hidden="true" />
                                    </div>
                                    <span className="text-sm font-bold text-slate-700">{t(`nodes.${node.key}` as any)}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </ScrollArea>
        </aside>
    );
};
