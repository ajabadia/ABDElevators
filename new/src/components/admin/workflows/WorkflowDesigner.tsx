"use client";

import React, { useState, useEffect } from 'react';
import { WorkflowDefinition, WorkflowState, WorkflowTransition, ChecklistConfig } from '@/lib/schemas';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
    Plus,
    Trash2,
    Save,
    Zap,
    GitBranch,
    Settings2,
    Brain,
    ChevronRight,
    Search,
    CheckCircle,
    Loader2,
    ArrowRight,
    ListChecks
} from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiMutation';
import { useApiList } from '@/hooks/useApiList';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslations } from 'next-intl';

interface WorkflowDesignerProps {
    initialWorkflow: WorkflowDefinition;
}

export function WorkflowDesigner({ initialWorkflow }: WorkflowDesignerProps) {
    const t = useTranslations('workflows');
    const { toast } = useToast();
    const [workflow, setWorkflow] = useState<WorkflowDefinition>(initialWorkflow);
    const [activeTab, setActiveTab] = useState('states');

    // ⚡ FASE 128: Fetch available checklists
    const { data: checklists } = useApiList<ChecklistConfig>({
        endpoint: '/api/admin/checklist-configs',
        dataKey: 'items', // Assuming standard API response structure
        autoFetch: true
    });

    const { mutate: saveWorkflow, isLoading: isSaving } = useApiMutation({
        endpoint: `/api/admin/workflow-definitions/${workflow._id}`,
        method: 'PATCH',
        onSuccess: () => {
            toast({
                title: t('saveSuccess'),
                description: t('saveSuccessDesc'),
                variant: "success"
            });
        }
    });

    const handleSave = () => {
        saveWorkflow(workflow);
    };

    const addState = () => {
        const newState: WorkflowState = {
            id: `new_state_${workflow.states.length}`,
            label: t('states.newState'),
            color: '#64748b',
            roles_allowed: ['ADMIN'],
            can_edit: true,
            is_initial: false,
            is_final: false,
            requires_validation: false
        };
        setWorkflow({ ...workflow, states: [...workflow.states, newState] });
    };

    const updateState = (index: number, updates: Partial<WorkflowState>) => {
        const newStates = [...workflow.states];
        newStates[index] = { ...newStates[index], ...updates };
        setWorkflow({ ...workflow, states: newStates });
    };

    const removeState = (index: number) => {
        const newStates = workflow.states.filter((_, i) => i !== index);
        setWorkflow({ ...workflow, states: newStates });
    };

    const addTransition = () => {
        const newTransition: WorkflowTransition = {
            from: workflow.states[0]?.id || '',
            to: workflow.states[1]?.id || workflow.states[0]?.id || '',
            label: t('transitions.add'),
            decisionStrategy: 'USER'
        };
        setWorkflow({ ...workflow, transitions: [...workflow.transitions, newTransition] });
    };

    const updateTransition = (index: number, updates: Partial<WorkflowTransition>) => {
        const newTransitions = [...workflow.transitions];
        newTransitions[index] = { ...newTransitions[index], ...updates };
        setWorkflow({ ...workflow, transitions: newTransitions });
    };

    const removeTransition = (index: number) => {
        const newTransitions = workflow.transitions.filter((_, i) => i !== index);
        setWorkflow({ ...workflow, transitions: newTransitions });
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header / Actions */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                        <GitBranch className="text-sidebar-primary" size={32} />
                        {workflow.name}
                    </h2>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-[10px] uppercase opacity-60">
                            {workflow.industry} | {workflow.entityType}
                        </Badge>
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 uppercase text-[10px] font-bold">
                            V{workflow.version} {workflow.active ? 'ACTIVE' : 'INACTIVE'}
                        </Badge>
                    </div>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-sidebar-primary hover:bg-sidebar-primary/90 text-white font-bold gap-2 shadow-lg shadow-sidebar-primary/20 px-8"
                >
                    {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    {t('publish')}
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="bg-slate-100/50 p-1 border border-slate-200/60 rounded-xl">
                    <TabsTrigger value="states" className="gap-2 px-6 py-2.5 text-xs font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Zap size={14} /> {t('tabs.states')}
                    </TabsTrigger>
                    <TabsTrigger value="transitions" className="gap-2 px-6 py-2.5 text-xs font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <ArrowRight size={14} /> {t('tabs.transitions')}
                    </TabsTrigger>
                    <TabsTrigger value="config" className="gap-2 px-6 py-2.5 text-xs font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Settings2 size={14} /> {t('tabs.config')}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="states" className="space-y-6 outline-none">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {workflow.states.map((state, idx) => (
                            <Card key={idx} className="border-2 border-slate-100 shadow-sm hover:border-sidebar-primary/20 transition-all group">
                                <CardHeader className="p-5 pb-2 flex flex-row items-center justify-between space-y-0">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-4 h-4 rounded-full"
                                            style={{ backgroundColor: state.color }}
                                        />
                                        <CardTitle className="text-sm font-black uppercase tracking-tighter">
                                            {state.id}
                                        </CardTitle>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeState(idx)}
                                        className="h-8 w-8 text-slate-300 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </Button>
                                </CardHeader>
                                <CardContent className="p-5 pt-0 space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('states.label')}</Label>
                                            <Input
                                                value={state.label}
                                                onChange={(e) => updateState(idx, { label: e.target.value })}
                                                className="h-8 text-xs font-bold bg-slate-50 border-none shadow-none focus:ring-1 ring-sidebar-primary/20"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('states.color')}</Label>
                                            <Input
                                                value={state.color}
                                                onChange={(e) => updateState(idx, { color: e.target.value })}
                                                className="h-8 text-xs font-mono bg-slate-50 border-none shadow-none focus:ring-1 ring-sidebar-primary/20"
                                            />
                                        </div>
                                    </div>

                                    {/* LLM Node Section */}
                                    <div className="bg-teal-50/50 p-4 rounded-xl border border-teal-100/50 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Brain size={16} className="text-teal-600" />
                                                <Label className="text-xs font-black uppercase tracking-tight text-teal-800">{t('states.iaLayer')}</Label>
                                            </div>
                                            <Switch
                                                checked={state.llmNode?.enabled}
                                                onCheckedChange={(val) => updateState(idx, {
                                                    llmNode: {
                                                        promptKey: state.llmNode?.promptKey || 'WORKFLOW_NODE_ANALYZER',
                                                        schemaKey: state.llmNode?.schemaKey || 'GENERAL_ANALYSIS',
                                                        enabled: val,
                                                        temperature: state.llmNode?.temperature || 0.1,
                                                        auto_transition: state.llmNode?.auto_transition || false
                                                    }
                                                })}
                                            />
                                        </div>

                                        {state.llmNode?.enabled && (
                                            <div className="grid grid-cols-1 gap-3 animate-in fade-in slide-in-from-top-2">
                                                <div className="space-y-1">
                                                    <Label className="text-[9px] font-bold text-teal-600 uppercase tracking-widest">{t('states.promptKey')}</Label>
                                                    <Input
                                                        value={state.llmNode.promptKey}
                                                        onChange={(e) => updateState(idx, {
                                                            llmNode: { ...state.llmNode!, promptKey: e.target.value }
                                                        })}
                                                        placeholder="e.g. ANALYSIS_PROMPT"
                                                        className="h-7 text-[11px] bg-white border-teal-200"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[9px] font-bold text-teal-600 uppercase tracking-widest">{t('states.schemaKey')}</Label>
                                                    <Input
                                                        value={state.llmNode.schemaKey}
                                                        onChange={(e) => updateState(idx, {
                                                            llmNode: { ...state.llmNode!, schemaKey: e.target.value }
                                                        })}
                                                        placeholder="e.g. AUDIT_SCHEMA"
                                                        className="h-7 text-[11px] bg-white border-teal-200"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* ⚡ FASE 128: Validation & Checklist Section */}
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <ListChecks size={16} className="text-slate-600" />
                                                <Label className="text-xs font-black uppercase tracking-tight text-slate-700">{t('states.validation')}</Label>
                                            </div>
                                            <Switch
                                                checked={state.requires_validation}
                                                onCheckedChange={(val) => updateState(idx, { requires_validation: val })}
                                            />
                                        </div>

                                        {state.requires_validation && (
                                            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                                                <Label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{t('states.checklist')}</Label>
                                                <Select
                                                    value={state.checklistConfigId || "none"}
                                                    onValueChange={(val) => updateState(idx, { checklistConfigId: val === "none" ? undefined : val })}
                                                >
                                                    <SelectTrigger className="h-8 text-xs font-bold bg-white border-slate-200">
                                                        <SelectValue placeholder="Select checklist..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none" className="text-xs italic text-slate-400">None</SelectItem>
                                                        {checklists.map(c => (
                                                            <SelectItem key={c._id?.toString()} value={c._id?.toString() || ''} className="text-xs font-bold">
                                                                {c.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        <Button
                            variant="outline"
                            onClick={addState}
                            className="h-full min-h-[160px] border-2 border-dashed border-slate-200 bg-slate-50/30 hover:bg-slate-50 hover:border-sidebar-primary/30 text-slate-400 hover:text-sidebar-primary flex flex-col gap-2 rounded-2xl group transition-all"
                        >
                            <div className="w-12 h-12 rounded-full border-2 border-slate-200 group-hover:border-sidebar-primary/20 flex items-center justify-center bg-white shadow-sm transition-all group-hover:scale-110">
                                <Plus size={24} />
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest">{t('states.newState')}</span>
                        </Button>
                    </div>
                </TabsContent>

                <TabsContent value="transitions" className="space-y-6 outline-none">
                    <div className="space-y-4">
                        {workflow.transitions.map((transition, idx) => (
                            <Card key={idx} className="border-2 border-slate-100 shadow-sm p-4 hover:border-sidebar-primary/20 transition-all">
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                                    <div className="lg:col-span-3 flex items-center gap-3">
                                        <div className="space-y-3 flex-1">
                                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('transitions.from')}</Label>
                                            <Select
                                                value={transition.from}
                                                onValueChange={(val) => updateTransition(idx, { from: val })}
                                            >
                                                <SelectTrigger className="h-9 text-xs font-bold uppercase tracking-tight bg-slate-50 border-none">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {workflow.states.map(s => (
                                                        <SelectItem key={s.id} value={s.id} className="text-xs font-bold uppercase">{s.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="mt-6 text-slate-300">
                                            <ChevronRight />
                                        </div>
                                        <div className="space-y-3 flex-1">
                                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('transitions.to')}</Label>
                                            <Select
                                                value={transition.to}
                                                onValueChange={(val) => updateTransition(idx, { to: val })}
                                            >
                                                <SelectTrigger className="h-9 text-xs font-bold uppercase tracking-tight bg-slate-50 border-none">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {workflow.states.map(s => (
                                                        <SelectItem key={s.id} value={s.id} className="text-xs font-bold uppercase">{s.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="lg:col-span-3 space-y-3">
                                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('transitions.label')}</Label>
                                        <Input
                                            value={transition.label}
                                            onChange={(e) => updateTransition(idx, { label: e.target.value })}
                                            className="h-9 text-xs font-bold bg-slate-50 border-none focus:ring-1 ring-sidebar-primary/20"
                                        />
                                    </div>

                                    <div className="lg:col-span-3 space-y-3">
                                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('transitions.strategy')}</Label>
                                        <Select
                                            value={transition.decisionStrategy || 'USER'}
                                            onValueChange={(val) => updateTransition(idx, { decisionStrategy: val as any })}
                                        >
                                            <SelectTrigger className="h-9 text-xs font-bold bg-indigo-50 text-indigo-700 border-none">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="USER" className="text-xs font-bold">{t('transitions.strategies.user')}</SelectItem>
                                                <SelectItem value="LLM_DIRECT" className="text-xs font-bold">{t('transitions.strategies.llm_direct')}</SelectItem>
                                                <SelectItem value="LLM_SUGGEST_HUMAN_APPROVE" className="text-xs font-bold">{t('transitions.strategies.llm_suggest')}</SelectItem>
                                                <SelectItem value="HUMAN_ONLY" className="text-xs font-bold">{t('transitions.strategies.human')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="lg:col-span-2 flex justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-slate-300 hover:text-slate-800"
                                        >
                                            <Settings2 size={18} />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeTransition(idx)}
                                            className="text-slate-300 hover:text-red-500"
                                        >
                                            <Trash2 size={18} />
                                        </Button>
                                    </div>

                                    {/* LLM Routing Sub-Config */}
                                    {(transition.decisionStrategy === 'LLM_DIRECT' || transition.decisionStrategy === 'LLM_SUGGEST_HUMAN_APPROVE') && (
                                        <div className="lg:col-span-12 mt-2 pt-4 border-t border-dashed border-slate-100 animate-in fade-in zoom-in-95">
                                            <div className="flex items-start gap-4 p-4 bg-indigo-50/30 rounded-xl border border-indigo-100/50">
                                                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                                                    <Brain size={18} />
                                                </div>
                                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[9px] font-black uppercase text-indigo-600 tracking-widest">{t('transitions.routing.promptKey')}</Label>
                                                        <Input
                                                            value={transition.llmRouting?.promptKey || ''}
                                                            onChange={(e) => updateTransition(idx, {
                                                                llmRouting: { ...transition.llmRouting!, promptKey: e.target.value, branches: transition.llmRouting?.branches || [] }
                                                            })}
                                                            placeholder="e.g. WORKFLOW_ROUTER"
                                                            className="h-8 text-xs font-bold bg-white border-indigo-200"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5 text-right">
                                                        <Label className="text-[9px] font-black uppercase text-indigo-600 tracking-widest block mb-1">Rutas Dinámicas</Label>
                                                        <Badge className="bg-indigo-600 text-white font-black">{t('transitions.routing.branches', { count: transition.llmRouting?.branches?.length || 0 })}</Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        ))}

                        <Button
                            variant="outline"
                            onClick={addTransition}
                            className="w-full py-6 border-2 border-dashed border-slate-200 bg-slate-50/20 hover:bg-slate-50 hover:border-sidebar-primary/20 text-slate-400 hover:text-sidebar-primary flex items-center gap-2 rounded-2xl transition-all"
                        >
                            <Plus size={18} />
                            <span className="text-xs font-black uppercase tracking-widest">{t('transitions.add')}</span>
                        </Button>
                    </div>
                </TabsContent>

                <TabsContent value="config">
                    <Card className="border-2 border-slate-100">
                        <CardHeader>
                            <CardTitle className="text-lg font-black uppercase tracking-tight">{t('config.global')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                    <h4 className="text-sm font-bold text-slate-800">{t('config.identity')}</h4>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('config.name')}</Label>
                                            <Input
                                                value={workflow.name}
                                                onChange={(e) => setWorkflow({ ...workflow, name: e.target.value })}
                                                className="bg-white"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('config.environment')}</Label>
                                                <Badge className="w-full justify-center h-10 bg-white border-slate-200 text-slate-600 font-bold uppercase tracking-tight">{workflow.environment}</Badge>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('config.version')}</Label>
                                                <Badge variant="outline" className="w-full justify-center h-10 border-slate-200 text-slate-600 font-bold uppercase tracking-tight">v{workflow.version}</Badge>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 p-6 bg-amber-50/50 rounded-2xl border border-amber-100">
                                    <h4 className="text-sm font-bold text-amber-800">{t('config.publication')}</h4>
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label className="text-xs font-bold text-amber-900">{t('config.active')}</Label>
                                                <p className="text-[10px] text-amber-700/70 uppercase font-black">{t('config.activeDesc')}</p>
                                            </div>
                                            <Switch
                                                checked={workflow.active}
                                                onCheckedChange={(val) => setWorkflow({ ...workflow, active: val })}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label className="text-xs font-bold text-amber-900">{t('config.default')}</Label>
                                                <p className="text-[10px] text-amber-700/70 uppercase font-black">{t('config.defaultDesc')}</p>
                                            </div>
                                            <Switch
                                                checked={workflow.is_default}
                                                onCheckedChange={(val) => setWorkflow({ ...workflow, is_default: val })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
