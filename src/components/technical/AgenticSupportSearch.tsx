"use client";

import React from 'react';
import { Search, Sparkles, Terminal, BookOpen, AlertCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FederatedSuggestions } from "@/components/federated/FederatedSuggestions";
import { useWorkspaceStore } from '@/store/workspace-store';

export function AgenticSupportSearch() {
    const {
        searchQuery,
        setSearchQuery,
        isSearching,
        searchResult,
        performSearch,
        showTrace,
        toggleTrace
    } = useWorkspaceStore();

    return (
        <div className="space-y-6">
            <Card className="border-none shadow-xl bg-gradient-to-br from-indigo-600 via-blue-600 to-blue-700 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Sparkles size={120} />
                </div>
                <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <CardTitle className="text-2xl font-black tracking-tight">Cerebro Agéntico RAG</CardTitle>
                    </div>
                    <CardDescription className="text-blue-100/80 text-lg">
                        Haz consultas técnicas complejas. Nuestra IA buscará en manuales, verificará alucinaciones y te dará una respuesta de alta fidelidad.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-3 bg-white/10 p-2 rounded-2xl backdrop-blur-md border border-white/20">
                        <Input
                            placeholder="Ej: ¿Protocolo de rescate en manual Otis 2000?"
                            className="bg-transparent border-none text-white placeholder:text-blue-200/50 focus-visible:ring-0 text-lg h-12"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && performSearch()}
                        />
                        <Button
                            onClick={performSearch}
                            disabled={isSearching || !searchQuery}
                            className="h-12 px-8 rounded-xl bg-white text-blue-600 hover:bg-blue-50 font-bold shadow-lg"
                        >
                            {isSearching ? <Loader2 className="animate-spin h-5 w-5" /> : <Search className="h-5 w-5 mr-2" />}
                            {isSearching ? "Pensando..." : "Consultar"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {isSearching && (
                <div className="py-12 text-center animate-pulse">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700">El agente está investigando...</h3>
                    <p className="text-slate-500 text-sm italic">Recuperando documentos, validando contra alucinaciones y redactando solución.</p>
                </div>
            )}

            {searchResult && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Respuesta Principal */}
                    <Card className="border-none shadow-lg bg-white overflow-hidden">
                        <div className="p-1 bg-emerald-500" />
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-center">
                                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none px-3 font-bold uppercase tracking-widest text-[10px]">
                                    Respuesta Verificada
                                </Badge>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-slate-400 hover:text-blue-600 text-xs font-bold gap-1"
                                    onClick={toggleTrace}
                                >
                                    {showTrace ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                    {showTrace ? "Ocultar proceso" : "Ver razonamiento de la IA"}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="prose dark:prose-invert max-w-none">
                                <p className="text-slate-800 leading-relaxed text-lg font-medium whitespace-pre-wrap">
                                    {searchResult.answer}
                                </p>
                            </div>

                            {/* Trace Viewer (User Experience Version) */}
                            {showTrace && (
                                <div className="mt-4 p-4 bg-slate-900 rounded-xl border border-slate-800 font-mono text-[12px] text-emerald-400/90 space-y-2 animate-in slide-in-from-top-2 duration-300">
                                    <div className="flex items-center gap-2 border-b border-slate-800 pb-2 mb-2 text-slate-500">
                                        <Terminal size={14} />
                                        <span className="font-bold uppercase tracking-tighter">Proceso de Pensamiento Agéntico</span>
                                    </div>
                                    {searchResult.trace.map((step, idx) => (
                                        <div key={idx} className="flex gap-3">
                                            <span className="text-slate-600 shrink-0">[{idx + 1}]</span>
                                            <span className="leading-tight">{step}</span>
                                        </div>
                                    ))}
                                    <div className="text-emerald-500/50 pt-2 italic flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                        Conclusión generada tras verificación multietapa.
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Sugerencias de Inteligencia Colectiva (Federación) */}
                    <FederatedSuggestions query={searchQuery} />

                    {/* Documentos de Apoyo */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <BookOpen size={16} /> Fuentes Técnicas Utilizadas
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {searchResult.documents.map((doc, idx) => (
                                <Card key={idx} className="border-none shadow-sm bg-slate-50 hover:bg-slate-100 transition-colors">
                                    <CardContent className="p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <Badge variant="outline" className="text-[10px] bg-white">
                                                {doc.source || "Manual Técnico"}
                                            </Badge>
                                            <span className="text-[10px] font-bold text-slate-400">Puntuación: {(doc.score || 0.95).toFixed(2)}</span>
                                        </div>
                                        <ScrollArea className="h-24 text-xs text-slate-600 leading-relaxed font-medium">
                                            {doc.text}
                                        </ScrollArea>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {!searchResult && !isSearching && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-8">
                    {[
                        { title: "Consultar Torque", desc: "Verificar valores oficiales de manuales.", query: "¿Cuál es el par de apriete para cables de tracción Otis?" },
                        { title: "Seguridad Foso", desc: "Protocolos de seguridad críticos.", query: "Procedimiento de bypass puerta de foso Schindler" },
                        { title: "Puertas Quantum", desc: "Ajustes precisos de componentes.", query: "Configuración potenciómetro Quantum P1" }
                    ].map((example, idx) => (
                        <Card
                            key={idx}
                            className="border-dashed border-slate-200 bg-white/50 cursor-pointer hover:bg-blue-50/50 transition-colors"
                            onClick={() => {
                                setSearchQuery(example.query);
                                performSearch();
                            }}
                        >
                            <CardContent className="p-4 text-center space-y-2">
                                <AlertCircle className="w-5 h-5 text-blue-400 mx-auto" />
                                <p className="text-xs font-bold text-slate-600 uppercase">{example.title}</p>
                                <p className="text-xs text-slate-400">{example.desc}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
