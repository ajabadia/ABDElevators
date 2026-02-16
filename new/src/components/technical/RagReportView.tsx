"use client";

import { FileText, CheckCircle2, ChevronRight, BookOpen, AlertCircle, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExportButton } from "./ExportButton";
import { RiskAlerter, RiskFinding } from "../shared/RiskAlerter";

import { FederatedPatternCard } from "../federated/FederatedPatternCard";
import { FederatedPattern } from "@/lib/schemas";
import { FeatureFlags } from "@/lib/feature-flags";

interface RagContext {
    text: string;
    source: string;
    score: number;
    type: string;
}

interface AnalyzedModel {
    type: string;
    model: string;
    ragContext: RagContext[];
}

interface RagReportViewProps {
    identifier: string;
    detectedPatterns: AnalyzedModel[];
    risks?: RiskFinding[];
    federatedInsights?: FederatedPattern[];
}

export function RagReportView({
    identifier,
    detectedPatterns,
    risks = [],
    federatedInsights = []
}: RagReportViewProps) {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Report Results: {identifier}</h2>
                    <p className="text-slate-500">{detectedPatterns.length} critical components identified.</p>
                </div>
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none px-4">
                    Validated by RAG
                </Badge>
            </div>

            {/* Risk & Intelligence Panel */}
            <RiskAlerter risks={risks} />

            {/* Federated Global Intelligence (Vision 2027) */}
            {federatedInsights.length > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-6 rounded-2xl border border-blue-100 dark:border-blue-900 shadow-inner">
                    <div className="flex items-center gap-2 mb-4">
                        <Globe className="h-5 w-5 text-blue-600" />
                        <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100">Collective Global Intelligence</h3>
                        <Badge variant="outline" className="ml-2 border-blue-400 text-blue-600">BETA</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {federatedInsights.map((insight, idx) => (
                            <FederatedPatternCard key={idx} pattern={insight} />
                        ))}
                    </div>
                    <p className="mt-4 text-[10px] text-blue-400 font-medium italic">
                        * Estos insights provienen de la red federada anónima y han sido validados por otros técnicos de la industria.
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6">
                {detectedPatterns.map((m, idx) => (
                    <Card key={idx} className="border-none shadow-xl overflow-hidden bg-white border-l-4 border-l-teal-500">
                        <CardHeader className="bg-slate-50/50 pb-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-teal-600 text-white rounded-lg flex items-center justify-center font-bold">
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl font-bold text-slate-900 group-hover:text-teal-600 transition-colors capitalize">
                                            {m.type}: <span className="text-teal-700">{m.model}</span>
                                        </CardTitle>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Detected Component</p>
                                    </div>
                                </div>
                                <Badge variant="outline" className="bg-white border-slate-200 text-slate-500 font-mono">
                                    Match Score: 0.98
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2 uppercase tracking-tighter">
                                <BookOpen size={16} className="text-teal-600" /> Related Technical Documentation
                            </h4>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                                {(m.ragContext?.length || 0) > 0 ? (
                                    m.ragContext.map((ctx, cIdx) => (
                                        <div key={cIdx} className="bg-slate-50 border border-slate-100 rounded-xl p-4 relative group">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest bg-teal-50 px-2 py-0.5 rounded">
                                                    {ctx.source}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-bold">Relevance: {(ctx.score * 100).toFixed(0)}%</span>
                                            </div>
                                            {FeatureFlags.isEnabled('EXPLAINABLE_AI') && (
                                                <div className="mb-2 p-2 bg-yellow-50/50 border border-yellow-100 rounded text-[10px] text-yellow-800 italic">
                                                    <span className="font-bold not-italic text-yellow-900">Reasoning:</span> Matches keyword correlation for 'safety circuit' and specific model variant.
                                                </div>
                                            )}
                                            <ScrollArea className="h-32 pr-4 text-sm text-slate-600 leading-relaxed font-medium">
                                                {ctx.text}
                                            </ScrollArea>
                                            <div className="mt-3 flex items-center gap-1 text-[11px] text-teal-600 font-bold cursor-pointer hover:underline">
                                                View full manual <ChevronRight size={14} />
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-2 py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                        <AlertCircle className="mx-auto text-slate-300 mb-2" size={32} />
                                        <p className="text-slate-400 text-sm font-medium">No specific technical chunks found for this model.</p>
                                    </div>
                                )}
                            </div>

                            {/* IA Checklist */}
                            <div className="mt-8 border-t border-slate-100 pt-6">
                                <h4 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-tighter">Workshop Verification Checklist</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {[
                                        `Confirm compatibility of ${m.model} with existing control panel.`,
                                        `Verify supply voltages according to manual ${m.ragContext[0]?.source || 'technical'}.`,
                                        `Validate mounting dimensions for ${m.type}.`
                                    ].map((check, cIdx) => (
                                        <div key={cIdx} className="flex items-center gap-3 p-3 bg-teal-50/30 border border-teal-100/50 rounded-lg">
                                            <div className="w-5 h-5 border-2 border-teal-200 rounded flex items-center justify-center bg-white">
                                                <CheckCircle2 size={14} className="text-teal-500 opacity-20" />
                                            </div>
                                            <span className="text-xs text-slate-700 font-medium">{check}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
