
import React from 'react';
import { useDraggable } from '@dnd-kit/core'; // Using dnd-kit or HTML5 drag API? React Flow recommends HTML5 for simplicity
import { MessageSquare, Zap, Split, Play, Mail, Database } from 'lucide-react';

export const NodeLibrary = () => {
    const onDragStart = (event: React.DragEvent, nodeType: string, label: string) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.setData('application/reactflow-label', label);
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <aside className="w-64 border-r border-slate-200 bg-slate-50 p-4 flex flex-col gap-4 h-full">
            <div className="font-semibold text-sm text-slate-500 uppercase tracking-wider">Triggers</div>
            <div
                className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded cursor-grab hover:shadow-sm"
                draggable
                onDragStart={(e) => onDragStart(e, 'trigger', 'Checklist Failed')}
            >
                <Zap className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium">Event Trigger</span>
            </div>

            <div className="font-semibold text-sm text-slate-500 uppercase tracking-wider mt-4">Actions</div>
            <div
                className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded cursor-grab hover:shadow-sm"
                draggable
                onDragStart={(e) => onDragStart(e, 'action', 'Send Email')}
            >
                <Mail className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium">Send Email</span>
            </div>
            <div
                className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded cursor-grab hover:shadow-sm"
                draggable
                onDragStart={(e) => onDragStart(e, 'action', 'Log Incident')}
            >
                <Database className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-medium">Log to DB</span>
            </div>
            <div
                className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded cursor-grab hover:shadow-sm"
                draggable
                onDragStart={(e) => onDragStart(e, 'action', 'Slack Alert')}
            >
                <MessageSquare className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium">Slack Alert</span>
            </div>

            <div className="font-semibold text-sm text-slate-500 uppercase tracking-wider mt-4">Logic</div>
            <div
                className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded cursor-grab hover:shadow-sm"
                draggable
                onDragStart={(e) => onDragStart(e, 'condition', 'If Score < 50')}
            >
                <Split className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-medium">Condition</span>
            </div>
        </aside>
    );
};
