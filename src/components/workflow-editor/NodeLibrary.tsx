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
        <aside className="w-72 border-r border-border bg-muted/30 flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b border-border bg-card">
                <h2 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Node Library</h2>
            </div>

            <ScrollArea className="flex-grow">
                <div className="p-4 space-y-6">
                    <section className="space-y-3">
                        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">{t('triggers')}</h3>
                        <div
                            className="group flex items-center gap-3 p-3 bg-card border border-border rounded-xl cursor-grab hover:border-primary hover:shadow-md transition-all active:scale-95"
                            draggable
                            onDragStart={(e) => onDragStart(e, 'trigger', t('nodes.checklist_failed'))}
                        >
                            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg group-hover:bg-amber-100 dark:group-hover:bg-amber-900/40 transition-colors">
                                <Zap className="w-4 h-4 text-amber-500" />
                            </div>
                            <span className="text-sm font-bold text-foreground">{t('nodes.event_trigger')}</span>
                        </div>
                    </section>

                    <section className="space-y-3">
                        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">{t('actions')}</h3>
                        <div className="grid gap-2">
                            {[
                                { type: 'action', key: 'send_email', icon: Mail, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40' },
                                { type: 'action', key: 'log_db', icon: Database, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40' },
                                { type: 'action', key: 'slack_alert', icon: MessageSquare, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/40' },
                                { type: 'action', key: 'custom_action', icon: Zap, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20 group-hover:bg-rose-100 dark:group-hover:bg-rose-900/40', italic: true },
                            ].map((node) => (
                                <div
                                    key={node.key}
                                    className="group flex items-center gap-3 p-3 bg-card border border-border rounded-xl cursor-grab hover:border-primary hover:shadow-md transition-all active:scale-95"
                                    draggable
                                    onDragStart={(e) => onDragStart(e, node.type, t(`nodes.${node.key}` as any))}
                                >
                                    <div className={cn("p-2 rounded-lg transition-colors", node.bg)}>
                                        <node.icon className={cn("w-4 h-4", node.color)} />
                                    </div>
                                    <span className={cn("text-sm font-bold text-foreground", node.italic && "italic")}>
                                        {t(`nodes.${node.key}` as any)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="space-y-3">
                        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">{t('industrial')}</h3>
                        <div className="grid gap-2">
                            {[
                                { type: 'humanValidation', key: 'human_validation', icon: MessageSquare, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/40' },
                                { type: 'ragCheck', key: 'rag_check', icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40' },
                                { type: 'sovereignTool', key: 'sovereign_tool', icon: Terminal, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/40' },
                            ].map((node) => (
                                <div
                                    key={node.key}
                                    className="group flex items-center gap-3 p-3 bg-card border border-border rounded-xl cursor-grab hover:border-primary hover:shadow-md transition-all active:scale-95"
                                    draggable
                                    onDragStart={(e) => onDragStart(e, node.type, t(`nodes.${node.key}` as any))}
                                >
                                    <div className={cn("p-2 rounded-lg transition-colors", node.bg)}>
                                        <node.icon className={cn("w-4 h-4", node.color)} />
                                    </div>
                                    <span className="text-sm font-bold text-foreground">{t(`nodes.${node.key}` as any)}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="space-y-3 pb-8">
                        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">{t('logic')}</h3>
                        <div className="grid gap-2">
                            {[
                                { type: 'condition', key: 'condition', icon: Split, color: 'text-muted-foreground', bg: 'bg-muted group-hover:bg-muted/80' },
                                { type: 'switch', key: 'switch', icon: GitBranch, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/40' },
                                { type: 'wait', key: 'wait', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/40' },
                                { type: 'loop', key: 'loop', icon: RefreshCw, color: 'text-sky-500', bg: 'bg-sky-50 dark:bg-sky-900/20 group-hover:bg-sky-100 dark:group-hover:bg-sky-900/40' },
                                { type: 'subflow', key: 'subflow', icon: GitFork, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/20 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/40' },
                            ].map((node) => (
                                <div
                                    key={node.key}
                                    className="group flex items-center gap-3 p-3 bg-card border border-border rounded-xl cursor-grab hover:border-primary hover:shadow-md transition-all active:scale-95"
                                    draggable
                                    onDragStart={(e) => onDragStart(e, node.type, t(`nodes.${node.key}` as any))}
                                    role="listitem"
                                    aria-label={`Draggable ${t(`nodes.${node.key}` as any)} node`}
                                >
                                    <div className={cn("p-2 rounded-lg transition-colors", node.bg)}>
                                        <node.icon className={cn("w-4 h-4", node.color)} aria-hidden="true" />
                                    </div>
                                    <span className="text-sm font-bold text-foreground">{t(`nodes.${node.key}` as any)}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </ScrollArea>
        </aside>
    );
};
