"use client";

import { useEffect, useState } from 'react';
import { Users, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Collaborator {
    userId: string;
    userName: string;
}

export function CollaborationPresence({ entityId }: { entityId: string }) {
    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);

    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const res = await fetch('/api/core/collaboration/presence', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ entityId })
                });
                const data = await res.json();
                if (data.success) {
                    setCollaborators(data.collaborators);
                }
            } catch (e) { }
        }, 5000); // Heartbeat cada 5s

        return () => clearInterval(interval);
    }, [entityId]);

    if (collaborators.length <= 1) return null;

    return (
        <div className="flex items-center gap-2 p-2 bg-slate-900/5 dark:bg-slate-100/5 rounded-full border border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="flex -space-x-2 overflow-hidden">
                {collaborators.map((u, i) => (
                    <motion.div
                        key={u.userId}
                        initial={{ scale: 0, x: -10 }}
                        animate={{ scale: 1, x: 0 }}
                        className={cn(
                            "w-8 h-8 rounded-full border-2 border-white dark:border-slate-950 flex items-center justify-center text-[10px] font-black text-white shadow-lg",
                            i % 2 === 0 ? "bg-teal-500" : "bg-purple-500"
                        )}
                        title={u.userName}
                    >
                        {u.userName.substring(0, 2).toUpperCase()}
                    </motion.div>
                ))}
            </div>
            <div className="px-2">
                <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                    <Users size={12} className="text-teal-600" />
                    {collaborators.length - 1} más analizando
                </p>
            </div>
            <Badge variant="secondary" className="bg-amber-50 text-amber-700 text-[9px] font-black gap-1">
                <Sparkles size={10} /> Trabajo en Equipo
            </Badge>
        </div>
    );
}
