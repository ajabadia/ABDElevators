"use client";

import React, { useState } from 'react';
import {
    X, History, Calendar, User, Search, Loader2, Code, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useApiList } from '@/hooks/useApiList';
import { useTranslations } from 'next-intl';

interface PromptGlobalHistoryProps {
    onClose: () => void;
}

export const PromptGlobalHistory: React.FC<PromptGlobalHistoryProps> = ({ onClose }) => {
    const t = useTranslations('admin.prompts');
    const [search, setSearch] = useState('');

    // 1. Gestión de datos con hook genérico
    const {
        data: history,
        isLoading: loading
    } = useApiList<any>({
        endpoint: '/api/admin/prompts/history',
        dataKey: 'history',
        filters: { search } // Aunque el hook soporta debounce, el filtrado local del original era inmediato.
    });

    // Filtrado local para búsqueda instantánea (mantenemos comportamiento del original)
    const filtered = history.filter(item =>
        item.promptName.toLowerCase().includes(search.toLowerCase()) ||
        item.promptKey.toLowerCase().includes(search.toLowerCase()) ||
        (item.changeReason || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-slate-950/80 backdrop-blur-md"
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="bg-slate-900 border border-slate-800 w-full max-w-4xl max-h-[85vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden"
            >
                {/* Header */}
                <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-teal-500/10 rounded-xl">
                                <History className="w-6 h-6 text-teal-400" />
                            </div>
                            <h2 className="text-2xl font-black text-white tracking-tight">{t('history.title')}</h2>
                        </div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mt-2 ml-1">
                            {t('history.subtitle')}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 bg-slate-800 text-slate-400 hover:text-white rounded-2xl transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Sub-Header / Search */}
                <div className="p-6 bg-slate-950/50 border-b border-slate-800 flex items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                        <input
                            placeholder={t('history.search')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-2xl text-xs py-3 pl-12 focus:ring-2 ring-teal-500/20 outline-none transition-all text-white"
                        />
                    </div>
                    <Badge variant="outline" className="h-10 px-4 rounded-xl border-slate-800 bg-slate-950 text-slate-400 font-bold uppercase text-[10px]">
                        {filtered.length} {t('history.records')}
                    </Badge>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar space-y-4 bg-slate-900/20">
                    {loading && history.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="w-10 h-10 text-teal-500 animate-spin opacity-20" />
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest animate-pulse">Sincronizando historial...</p>
                        </div>
                    ) : filtered.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4">
                            {filtered.map((entry, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.03 }}
                                    className="p-5 bg-slate-950 border border-slate-800 rounded-3xl group hover:border-teal-500/30 transition-all flex flex-col md:flex-row gap-6 md:items-center"
                                >
                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-center gap-3">
                                            <Badge className="bg-teal-500/10 text-teal-400 border-none px-2 py-0.5 text-[9px] font-black uppercase">
                                                {entry.promptKey}
                                            </Badge>
                                            <h4 className="text-sm font-black text-white">{entry.promptName}</h4>
                                            <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-full text-slate-400 font-mono">
                                                {t('history.version')}{entry.version}
                                            </span>
                                        </div>
                                        <div className="flex items-start gap-2 bg-slate-900/50 p-3 rounded-2xl border border-slate-800/50">
                                            <Clock size={14} className="text-slate-500 mt-0.5 shrink-0" />
                                            <p className="text-xs text-slate-300 font-medium leading-relaxed italic">
                                                "{entry.changeReason || t('history.no_reason')}"
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-row md:flex-col gap-4 md:gap-2 text-[10px] md:border-l border-slate-800 md:pl-6 min-w-[150px]">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <User size={12} className="text-teal-500/50" />
                                            <span className="font-bold">{entry.changedBy?.split('@')[0] || t('history.system')}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Calendar size={12} className="text-teal-500/50" />
                                            <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
                                            <span className="opacity-50 text-[8px] font-mono">{new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-500 pt-1">
                                            <Badge variant="outline" className="text-[8px] border-slate-800 text-slate-500 py-0 opacity-50">
                                                {entry.tenantId}
                                            </Badge>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-600 gap-4 border-2 border-dashed border-slate-800 rounded-[2.5rem]">
                            <Code size={48} className="opacity-10" />
                            <p className="text-sm font-bold tracking-tight">{t('history.no_records')}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-800 bg-slate-950/50 flex justify-center">
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.3em]">
                        &copy; 2026 ABD RAG Platform - Enterprise Audit Logging
                    </p>
                </div>
            </motion.div>
        </motion.div>
    );
};
