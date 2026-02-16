import React from 'react';
import { HelpCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SYSTEM_VARIABLES_DOC } from './constants';

interface PromptSystemGuideProps {
    promptKey: string;
}

export const PromptSystemGuide: React.FC<PromptSystemGuideProps> = ({ promptKey }) => {
    const systemDoc = SYSTEM_VARIABLES_DOC[promptKey];
    if (!systemDoc) return null;

    return (
        <div className="p-4 bg-teal-950/20 border border-teal-500/20 rounded-2xl animate-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center gap-2 mb-2">
                <HelpCircle size={14} className="text-teal-400" />
                <h4 className="text-[10px] font-bold text-teal-400 uppercase tracking-widest">Guía de Datos del Sistema</h4>
            </div>
            <p className="text-[10px] text-slate-400 mb-3 italic">
                {systemDoc.desc}
            </p>
            <div className="flex flex-wrap gap-1.5">
                {systemDoc.vars.map(v => (
                    <Badge key={v} variant="outline" className="bg-teal-500/5 text-teal-500/80 border-teal-500/10 text-[9px] py-0 px-2 font-mono">
                        {`{{${v}}}`}
                    </Badge>
                ))}
            </div>
            <p className="text-[9px] text-slate-500 mt-3 font-medium">
                * Estas variables son inyectadas automáticamente por el motor de negocio.
            </p>
        </div>
    );
};
