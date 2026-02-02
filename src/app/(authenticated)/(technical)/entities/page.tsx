"use client";

import { useState } from "react";
import { Upload, FileText, Search, Zap, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RagReportView } from "@/components/technical/RagReportView";
import { AgentTraceViewer } from "@/components/agent/AgentTraceViewer";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// New generic components and hooks
import { useApiList } from "@/hooks/useApiList";
import { useApiMutation } from "@/hooks/useApiMutation";
import { EntityEngine } from "@/core/engine/EntityEngine";
import { useSession } from "next-auth/react";
import { formatDateTime } from "@/lib/date-utils";

import { DynamicFormModal } from "@/components/shared/DynamicFormModal";
import { useFormModal } from "@/hooks/useFormModal";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";

export default function EntitiesPage() {
    const { data: session } = useSession();
    const { toast } = useToast();

    // 0. Get entity definition from "Cerebro" (Entity Vision)
    const entity = EntityEngine.getInstance().getEntity('pedido')!;

    const [isUploading, setIsUploading] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<any>(null);
    const [file, setFile] = useState<File | null>(null);
    const [currentEntityId, setCurrentEntityId] = useState<string | null>(null);
    const [showTrace, setShowTrace] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Hook for dynamic edit modal
    const editModal = useFormModal<any>();

    // 1. Data management with generic hook for recent list
    const { data: entities, isLoading: isLoadingList, refresh } = useApiList<any>({
        endpoint: entity.api.list,
        dataKey: 'entities', // Aligned with API
        filters: { limit: 5 }
    });

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const ingestAndStartAnalysis = async () => {
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("ingestOnly", "true");

        try {
            // Using endpoint defined in ontology
            const resp = await fetch(entity.api.analyze!, {
                method: "POST",
                body: formData,
            });
            const data = await resp.json();

            if (data.success && (data.entity_id || data.pedido_id)) {
                setCurrentEntityId(data.entity_id || data.pedido_id);
                setShowTrace(true);
                toast({
                    title: `${entity.name} processed`,
                    description: "Starting agentic brain for technical analysis..."
                });
                refresh();
            } else {
                toast({
                    title: "Error",
                    description: data.message || `Could not process ${entity.name}`,
                    variant: "destructive"
                });
            }
        } catch (err) {
            console.error(err);
            toast({ title: "Fatal error", description: "Connection failure", variant: "destructive" });
        } finally {
            setIsUploading(false);
        }
    };

    const handleAnalysisComplete = async () => {
        if (!currentEntityId) return;

        try {
            const detailUrl = entity.api.detail!.replace(':id', currentEntityId);
            const res = await fetch(detailUrl);
            const data = await res.json();

            // Adapt response based on whether it comes from generic core or legacy
            const entityData = data.entity || data.pedido;

            if (entityData) {
                setAnalysisResult({
                    entityId: entityData.identifier || entityData.id || entityData.numero_pedido,
                    patterns: entityData.detectedPatterns || entityData.modelos_detectados || entityData.metadata?.modelos || [],
                    risks: entityData.risks || entityData.metadata?.risks || [],
                    federatedInsights: entityData.federatedInsights || entityData.metadata?.federatedInsights || []
                });
                setShowTrace(false);
                refresh();
            }
        } catch (err) {
            toast({ title: "Error", description: "Could not retrieve final results", variant: "destructive" });
        }
    };

    return (
        <PageContainer>
            <PageHeader
                title="Analysis"
                highlight={`of ${entity.plural}`}
                subtitle="Agentic processing and technical validation of specifications (System Engine)."
                actions={
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-full border border-slate-100 dark:border-slate-800">
                        <Zap size={14} className="text-amber-500" />
                        Powered by AI Engine
                    </div>
                }
            />

            {analysisResult ? (
                <div className="space-y-6">
                    <Button variant="ghost" onClick={() => setAnalysisResult(null)} className="text-slate-500 hover:text-teal-600 gap-2">
                        &larr; Back to New Analysis
                    </Button>
                    <RagReportView
                        identifier={analysisResult.entityId}
                        detectedPatterns={analysisResult.patterns}
                        risks={analysisResult.risks}
                        federatedInsights={analysisResult.federatedInsights}
                    />
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Side: Upload Area */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="border-none shadow-2xl bg-slate-900 text-white overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Upload size={120} />
                            </div>
                            <CardHeader>
                                <CardTitle className="text-xl font-bold">New Analysis</CardTitle>
                                <CardDescription className="text-slate-400">Drop the {entity.name.toLowerCase()} PDF here</CardDescription>
                            </CardHeader>
                            <CardContent className="relative z-10">
                                <div
                                    onClick={() => document.getElementById('file-upload')?.click()}
                                    className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center hover:border-teal-500 transition-all cursor-pointer bg-slate-800/50 group"
                                >
                                    <input
                                        id="file-upload"
                                        type="file"
                                        className="hidden"
                                        onChange={handleFileUpload}
                                        accept=".pdf"
                                    />
                                    <div className="w-12 h-12 bg-teal-500/20 text-teal-400 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                        <Upload size={24} />
                                    </div>
                                    <p className="text-sm font-medium">{file ? file.name : "Click to browse"}</p>
                                    <p className="text-xs text-slate-500 mt-1 uppercase font-bold">PDF of {entity.name.toLowerCase()} (Max 10MB)</p>
                                </div>
                                <Button
                                    onClick={ingestAndStartAnalysis}
                                    disabled={!file || isUploading || showTrace}
                                    className="w-full mt-6 bg-teal-600 hover:bg-teal-700 text-white border-none py-6 text-lg font-bold shadow-teal-500/20 shadow-lg active:scale-[0.98] transition-transform"
                                >
                                    {isUploading ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Processing...
                                        </>
                                    ) : `Analyze ${entity.name}`}
                                </Button>
                            </CardContent>
                        </Card>

                        {showTrace && currentEntityId && (
                            <div className="animate-in fade-in zoom-in duration-500">
                                <AgentTraceViewer
                                    correlationId={currentEntityId}
                                    onComplete={handleAnalysisComplete}
                                />
                            </div>
                        )}

                        <Card className="border-none shadow-lg bg-teal-50/50 dark:bg-slate-900/50">
                            <CardContent className="pt-6 space-y-4">
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="text-teal-600 mt-1 shrink-0" size={18} />
                                    <p className="text-sm text-slate-700 dark:text-slate-300">Automatic detection of models and components.</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="text-teal-600 mt-1 shrink-0" size={18} />
                                    <p className="text-sm text-slate-700 dark:text-slate-300">Intelligent cross-referencing with active manuals.</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="text-teal-600 mt-1 shrink-0" size={18} />
                                    <p className="text-sm text-slate-700 dark:text-slate-300">AI-generated compatibility checklist.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Side: History / Recents PURE REAL DATA */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Recents</h3>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <Input
                                        placeholder={`Search ${entity.plural.toLowerCase()}...`}
                                        className="pl-9 w-64 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-sm focus:ring-teal-500"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {isLoadingList ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="h-24 bg-slate-100 dark:bg-slate-900 animate-pulse rounded-2xl" />
                                ))
                            ) : entities && entities.length > 0 ? (
                                entities.map((p: any) => (
                                    <Card
                                        key={p._id}
                                        className="border-none shadow-sm hover:shadow-xl transition-all duration-300 bg-white dark:bg-slate-900 group cursor-pointer border-l-4 border-l-teal-500"
                                    >
                                        <CardContent className="p-4 flex items-center justify-between">
                                            <div
                                                className="flex items-center gap-4 flex-1"
                                                onClick={() => {
                                                    setCurrentEntityId(p._id);
                                                    handleAnalysisComplete();
                                                }}
                                            >
                                                <div className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-2xl group-hover:text-teal-500 group-hover:bg-teal-50 dark:group-hover:bg-teal-900/20 transition-all duration-300">
                                                    <FileText size={24} />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-900 dark:text-white text-lg">
                                                        {p.identifier || p.filename || p.numero_pedido}
                                                    </h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge variant="outline" className="text-[10px] uppercase font-bold py-0 h-5 border-teal-500/20 text-teal-600 bg-teal-50/50">
                                                            {(p.detectedPatterns?.length || p.modelos_detectados?.length || 0)} Patterns
                                                        </Badge>
                                                        <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
                                                            {formatDateTime(p.createdAt || p.creado || p.fecha_analisis)}
                                                        </span>
                                                        <Badge className={cn(
                                                            "text-[10px] uppercase font-bold py-0 h-5",
                                                            (p.status || p.status) === 'analyzed' ? "bg-green-500/10 text-green-600" : "bg-orange-500/10 text-orange-600"
                                                        )}>
                                                            {p.status || p.status}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        editModal.openEdit(p);
                                                    }}
                                                    className="text-slate-300 hover:text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <ArrowRight size={20} className="-rotate-45" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-slate-300 group-hover:text-teal-600 group-hover:bg-teal-50 dark:group-hover:bg-teal-900/20 transition-all"
                                                    onClick={() => {
                                                        setCurrentEntityId(p._id);
                                                        handleAnalysisComplete();
                                                    }}
                                                >
                                                    <ArrowRight size={20} />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            ) : (
                                <Card className="border-dashed border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 p-12 text-center">
                                    <div className="flex flex-col items-center gap-4 text-slate-400">
                                        <FileText size={48} className="opacity-20" />
                                        <p className="font-medium">No {entity.plural.toLowerCase()} have been analyzed recently.</p>
                                    </div>
                                </Card>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <DynamicFormModal
                open={editModal.isOpen}
                entitySlug="pedido"
                mode="edit"
                initialData={editModal.data}
                onClose={() => editModal.close()}
                onSuccess={() => {
                    refresh();
                    editModal.close();
                }}
            />
        </PageContainer>
    );
}
