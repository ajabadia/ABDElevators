
'use client';

import React from 'react';
import { MessageSquare, Zap, Split, Play, Mail, Database, GitBranch, Clock, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';

export const NodeLibrary = () => {
    const t = useTranslations('admin.workflows.library');

    const onDragStart = (event: React.DragEvent, nodeType: string, label: string) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.setData('application/reactflow-label', label);
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <aside className="w-64 border-r border-slate-200 bg-slate-50 p-4 flex flex-col gap-4 h-full">
            <div className="font-semibold text-sm text-slate-500 uppercase tracking-wider">{t('triggers')}</div>
            <div
                className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded cursor-grab hover:shadow-sm"
                draggable
                onDragStart={(e) => onDragStart(e, 'trigger', t('nodes.checklist_failed'))}
            >
                <Zap className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium">{t('nodes.event_trigger')}</span>
            </div>

            <div className="font-semibold text-sm text-slate-500 uppercase tracking-wider mt-4">{t('actions')}</div>
            <div
                className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded cursor-grab hover:shadow-sm"
                draggable
                onDragStart={(e) => onDragStart(e, 'action', t('nodes.send_email'))}
            >
                <Mail className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium">{t('nodes.send_email')}</span>
            </div>
            <div
                className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded cursor-grab hover:shadow-sm"
                draggable
                onDragStart={(e) => onDragStart(e, 'action', t('nodes.log_incident'))}
            >
                <Database className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-medium">{t('nodes.log_db')}</span>
            </div>
            <div
                className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded cursor-grab hover:shadow-sm"
                draggable
                onDragStart={(e) => onDragStart(e, 'action', t('nodes.slack_alert'))}
            >
                <MessageSquare className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium">{t('nodes.slack_alert')}</span>
            </div>
            <div
                className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded cursor-grab hover:shadow-sm"
                draggable
                onDragStart={(e) => onDragStart(e, 'action', t('nodes.custom_action'))}
            >
                <Zap className="w-4 h-4 text-rose-500" />
                <span className="text-sm font-medium italic">{t('nodes.custom_action')}</span>
            </div>

            <div className="font-semibold text-sm text-slate-500 uppercase tracking-wider mt-4">{t('logic')}</div>
            <div
                className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded cursor-grab hover:shadow-sm"
                draggable
                onDragStart={(e) => onDragStart(e, 'condition', t('nodes.simple_if'))}
            >
                <Split className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-medium">{t('nodes.condition')}</span>
            </div>
            <div
                className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded cursor-grab hover:shadow-sm"
                draggable
                onDragStart={(e) => onDragStart(e, 'switch', t('nodes.multi_path'))}
            >
                <GitBranch className="w-4 h-4 text-indigo-500" />
                <span className="text-sm font-medium">{t('nodes.switch')}</span>
            </div>
            <div
                className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded cursor-grab hover:shadow-sm"
                draggable
                onDragStart={(e) => onDragStart(e, 'wait', t('nodes.wait_5s'))}
            >
                <Clock className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium">{t('nodes.wait')}</span>
            </div>
            <div
                className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded cursor-grab hover:shadow-sm"
                draggable
                onDragStart={(e) => onDragStart(e, 'loop', t('nodes.foreach'))}
            >
                <RefreshCw className="w-4 h-4 text-sky-500" />
                <span className="text-sm font-medium">{t('nodes.loop')}</span>
            </div>
        </aside>
    );
};
