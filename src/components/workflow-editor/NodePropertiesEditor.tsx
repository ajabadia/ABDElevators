
import React, { useState, useEffect } from 'react';
import { Node } from '@xyflow/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Settings, X, Plus, Trash2, Clock, GitBranch, Repeat } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface NodePropertiesEditorProps {
    node: Node | null;
    onUpdate: (nodeId: string, newData: any) => void;
    onClose: () => void;
}

export const NodePropertiesEditor = ({ node, onUpdate, onClose }: NodePropertiesEditorProps) => {
    const t = useTranslations('admin.workflows.properties');
    const [label, setLabel] = useState("");
    const [metadata, setMetadata] = useState<Record<string, any>>({});

    useEffect(() => {
        if (node) {
            const nodeLabel = node.data?.label;
            setLabel(typeof nodeLabel === 'string' ? nodeLabel : "");
            // Extract all non-label, non-analytics, non-orphan data as metadata
            const { label: _, analytics: __, isOrphan: ___, ...rest } = node.data as any;
            setMetadata((rest || {}) as Record<string, any>);
        }
    }, [node]);

    if (!node) return null;

    const nodeType = node.type || 'action';

    const handleSave = () => {
        onUpdate(node.id, { ...node.data, label, ...metadata });
    };

    const addMeta = () => {
        setMetadata({ ...metadata, [`key_${Object.keys(metadata).length}`]: "value" });
    };

    const removeMeta = (key: string) => {
        const newMeta = { ...metadata };
        delete newMeta[key];
        setMetadata(newMeta);
    };

    const updateMeta = (oldKey: string, newKey: string, value: any) => {
        const newMeta = { ...metadata };
        if (oldKey !== newKey) {
            delete newMeta[oldKey];
            newMeta[newKey] = value;
        } else {
            newMeta[newKey] = value;
        }
        setMetadata(newMeta);
    };

    const updateWaitProp = (prop: string, value: any) => {
        setMetadata({ ...metadata, [prop]: value });
    };

    const addSwitchPath = () => {
        const paths = metadata.paths || [];
        setMetadata({
            ...metadata,
            paths: [...paths, { id: `path_${paths.length}`, condition: "true", label: `Caso ${paths.length + 1}` }]
        });
    };

    return (
        <div className="absolute right-0 top-0 w-80 h-full bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-slate-500" />
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">{t('title')}</h3>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-md transition-colors">
                    <X size={18} className="text-slate-400" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Info de Tipo */}
                <div className="px-3 py-2 bg-slate-100 rounded-lg flex items-center gap-2 border border-slate-200">
                    {nodeType === 'wait' && <Clock className="w-4 h-4 text-amber-500" />}
                    {nodeType === 'switch' && <GitBranch className="w-4 h-4 text-purple-500" />}
                    {nodeType === 'loop' && <Repeat className="w-4 h-4 text-blue-500" />}
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('node_type', { type: nodeType })}</span>
                </div>

                <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-slate-400">{t('main_label')}</Label>
                    <Input
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        className="h-8 text-sm font-medium"
                    />
                </div>

                {/* Specialized Editor for Wait */}
                {nodeType === 'wait' && (
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                        <Label className="text-[10px] uppercase font-bold text-slate-400">{t('wait_config')}</Label>
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <Input
                                    type="number"
                                    value={metadata.duration || 1}
                                    onChange={(e) => updateWaitProp('duration', parseInt(e.target.value))}
                                    className="h-8 text-sm"
                                    placeholder={t('duration')}
                                />
                            </div>
                            <div className="w-24">
                                <Select
                                    value={metadata.unit || 's'}
                                    onValueChange={(v) => updateWaitProp('unit', v)}
                                >
                                    <SelectTrigger className="h-8 text-xs font-medium">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ms">{t('units.ms')}</SelectItem>
                                        <SelectItem value="s">{t('units.s')}</SelectItem>
                                        <SelectItem value="m">{t('units.m')}</SelectItem>
                                        <SelectItem value="h">{t('units.h')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                )}

                {/* Specialized Editor for Switch */}
                {nodeType === 'switch' && (
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                            <Label className="text-[10px] uppercase font-bold text-slate-400">{t('switch_config')}</Label>
                            <Button variant="ghost" size="sm" onClick={addSwitchPath} className="h-6 px-2 text-[10px] text-purple-600 font-bold">
                                <Plus size={12} className="mr-1" /> {t('branch')}
                            </Button>
                        </div>
                        <div className="space-y-3">
                            {(metadata.paths || []).map((path: any, idx: number) => (
                                <div key={idx} className="p-2 border border-slate-100 rounded bg-slate-50 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-purple-600">{t('branch')} #{idx + 1}</span>
                                        <button
                                            onClick={() => {
                                                const newPaths = [...metadata.paths];
                                                newPaths.splice(idx, 1);
                                                setMetadata({ ...metadata, paths: newPaths });
                                            }}
                                            className="text-slate-300 hover:text-red-400"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                    <Input
                                        placeholder={t('condition_placeholder')}
                                        value={path.condition}
                                        onChange={(e) => {
                                            const newPaths = [...metadata.paths];
                                            newPaths[idx] = { ...newPaths[idx], condition: e.target.value };
                                            setMetadata({ ...metadata, paths: newPaths });
                                        }}
                                        className="h-7 text-[10px] font-mono"
                                    />
                                    <Input
                                        placeholder={t('label_placeholder')}
                                        value={path.label}
                                        onChange={(e) => {
                                            const newPaths = [...metadata.paths];
                                            newPaths[idx] = { ...newPaths[idx], label: e.target.value };
                                            setMetadata({ ...metadata, paths: newPaths });
                                        }}
                                        className="h-7 text-[10px]"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Specialized Editor for Loop */}
                {nodeType === 'loop' && (
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                        <Label className="text-[10px] uppercase font-bold text-slate-400">{t('loop_config')}</Label>
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <Label className="text-[9px] text-slate-500">{t('data_source')}</Label>
                                <Input
                                    placeholder={t('data_source_placeholder')}
                                    value={metadata.source || ""}
                                    onChange={(e) => updateWaitProp('source', e.target.value)}
                                    className="h-8 text-sm"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[9px] text-slate-500">{t('iterations')}</Label>
                                <Input
                                    type="number"
                                    value={metadata.maxIterations || 10}
                                    onChange={(e) => updateWaitProp('maxIterations', parseInt(e.target.value))}
                                    className="h-8 text-sm"
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                        <Label className="text-[10px] uppercase font-bold text-slate-400">{t('extra_features')}</Label>
                        <Button variant="ghost" size="sm" onClick={addMeta} className="h-6 px-2 text-[10px] text-teal-600 font-bold">
                            <Plus size={12} className="mr-1" /> {t('add')}
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {Object.entries(metadata).filter(([k]) => !['duration', 'unit', 'paths', 'source', 'maxIterations'].includes(k)).map(([key, value]) => (
                            <div key={key} className="flex gap-2 items-start group">
                                <div className="flex-1 space-y-1">
                                    <Input
                                        placeholder={t('property')}
                                        value={key}
                                        onChange={(e) => updateMeta(key, e.target.value, value)}
                                        className="h-7 text-[10px] uppercase font-mono bg-slate-50 border-transparent focus:border-slate-200"
                                    />
                                    <Input
                                        placeholder={t('value')}
                                        value={typeof value === 'object' ? JSON.stringify(value) : value as string}
                                        onChange={(e) => updateMeta(key, key, e.target.value)}
                                        className="h-7 text-[11px] font-medium"
                                    />
                                </div>
                                <button
                                    onClick={() => removeMeta(key)}
                                    className="p-1.5 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-all"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}

                        {Object.keys(metadata).length === 0 && (
                            <p className="text-[10px] text-slate-400 italic text-center py-4 bg-slate-50 rounded border border-dashed border-slate-200">
                                {t('no_features')}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 space-y-2">
                <Button onClick={handleSave} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold h-10 shadow-lg">
                    {t('apply')}
                </Button>
                <p className="text-[9px] text-slate-400 text-center italic">
                    {t('sync_notice')}
                </p>
            </div>
        </div>
    );
};

