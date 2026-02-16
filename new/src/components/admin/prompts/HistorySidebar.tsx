import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, X, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Version {
    version: number;
    createdAt: string;
    changeReason: string;
    changedBy: string;
}

interface HistorySidebarProps {
    isOpen: boolean;
    onClose: () => void;
    loading: boolean;
    versions: Version[];
    onRollback: (version: number) => void;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
    isOpen,
    onClose,
    loading,
    versions,
    onRollback
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ x: -300, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -300, opacity: 0 }}
                    className="absolute left-0 top-0 w-80 h-full bg-slate-950 border-r border-slate-800 z-50 p-6 flex flex-col shadow-2xl"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                            <History size={16} className="text-teal-400" /> Historial
                        </h3>
                        <button onClick={onClose} className="text-slate-500 hover:text-white">
                            <X size={16} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-800">
                        {loading ? (
                            <div className="p-8 text-center text-slate-600 text-xs">Cargando versiones...</div>
                        ) : versions.length > 0 ? (
                            versions.map(v => (
                                <div key={v.version} className="p-3 bg-slate-900/50 border border-slate-800 rounded-xl space-y-2 hover:border-slate-700 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <Badge className="bg-slate-800 text-teal-400 text-[9px] font-black">V{v.version}</Badge>
                                        <span className="text-[9px] text-slate-500 font-mono">{new Date(v.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-[10px] text-white font-medium italic line-clamp-2">"{v.changeReason}"</p>
                                    <div className="flex items-center justify-between pt-2">
                                        <span className="text-[9px] text-slate-500">Por {v.changedBy.split('@')[0]}</span>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => onRollback(v.version)}
                                            className="h-6 px-2 text-[9px] text-teal-500 hover:bg-teal-500/10"
                                        >
                                            <RotateCcw size={10} className="mr-1" /> Restaurar
                                        </Button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center text-slate-600 text-xs italic">No hay historial previo</div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
