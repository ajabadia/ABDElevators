import React from 'react';
import { Plus, Trash2, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Variable {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'json';
    description?: string;
    required: boolean;
}

interface VariableManagerProps {
    variables: Variable[];
    onAdd: () => void;
    onUpdate: (index: number, updates: Partial<Variable>) => void;
    onRemove: (index: number) => void;
}

export const VariableManager: React.FC<VariableManagerProps> = ({
    variables,
    onAdd,
    onUpdate,
    onRemove
}) => {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Type size={12} /> Variables Dinámicas
                </h3>
                <Button onClick={onAdd} variant="outline" size="sm" className="h-7 border-slate-800 bg-slate-800/50 text-teal-400 hover:bg-teal-400/10 rounded-lg text-[10px]">
                    <Plus size={12} className="mr-1" /> Añadir Variable
                </Button>
            </div>

            <div className="space-y-3">
                {variables.map((v, i) => (
                    <div key={i} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center gap-3">
                        <div className="flex flex-col gap-2 flex-1">
                            <div className="flex gap-2">
                                <Input
                                    value={v.name}
                                    onChange={e => onUpdate(i, { name: e.target.value })}
                                    placeholder="Nombre var"
                                    className="bg-slate-900 border-slate-800 h-8 text-xs font-mono text-teal-400"
                                />
                                <select
                                    value={v.type}
                                    onChange={e => onUpdate(i, { type: e.target.value as 'string' | 'number' | 'boolean' | 'json' })}
                                    className="bg-slate-900 border-slate-800 rounded-lg text-[10px] px-2 outline-none text-slate-300"
                                >
                                    <option value="string">String</option>
                                    <option value="number">Number</option>
                                    <option value="boolean">Boolean</option>
                                </select>
                            </div>
                            <Input
                                value={v.description}
                                onChange={e => onUpdate(i, { description: e.target.value })}
                                placeholder="Descripción de la variable..."
                                className="bg-slate-900/50 border-none h-6 text-[10px] text-slate-500"
                            />
                        </div>
                        <button onClick={() => onRemove(i)} className="p-2 text-slate-600 hover:text-rose-500 transition-colors">
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
                {variables.length === 0 && (
                    <p className="text-center text-xs text-slate-600 italic py-4">Sin variables configuradas</p>
                )}
            </div>
        </div>
    );
};
