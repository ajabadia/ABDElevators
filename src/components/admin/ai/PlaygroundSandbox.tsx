"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Database, Beaker, BarChart3, Settings2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AI_MODELS, DEFAULT_MODEL } from "@/lib/constants/ai-models";
import { toast } from "sonner";

export function PlaygroundSandbox() {
    const tLab = useTranslations("rag_eval");

    const [isLoading, setIsLoading] = useState(false);
    const [config, setConfig] = useState<{
        model: string;
        temperature: number;
        chunkSize: number;
        topK: number;
    }>({
        model: DEFAULT_MODEL as string,
        temperature: 0.7,
        chunkSize: 500,
        topK: 3
    });
    const [query, setQuery] = useState("");
    const [baseInstruction, setBaseInstruction] = useState(tLab("playground.default_prompt"));
    const [resultData, setResultData] = useState<Record<string, unknown> | null>(null);

    const handleRun = async () => {
        if (!query.trim()) {
            toast.error(tLab("playground.error_empty_query"));
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch("/api/admin/rag/experiment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query,
                    model: config.model,
                    temperature: config.temperature,
                    chunkSize: config.chunkSize,
                    topK: config.topK,
                    baseInstruction
                })
            });

            const data = await res.json();
            if (!data.success) throw new Error(data.message || tLab("playground.error_run"));

            setResultData(data.result);
            toast.success(tLab("playground.success_run"));
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : String(error));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
            {/* Configuration Sidebar */}
            <div className="lg:col-span-4 space-y-6">
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <Settings2 className="w-4 h-4 text-primary" />
                            {tLab("playground.parameters")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-xs">{tLab("playground.model")}</Label>
                            <Select value={config.model} onValueChange={(v) => setConfig({ ...config, model: v })}>
                                <SelectTrigger className="bg-background/50 h-9">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {AI_MODELS.map(m => (
                                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <Label className="text-xs">{tLab("playground.temperature")}</Label>
                                <span className="text-[10px] font-mono opacity-60">{config.temperature}</span>
                            </div>
                            <Slider
                                min={0} max={1} step={0.1}
                                value={[config.temperature]}
                                onValueChange={([v]) => setConfig({ ...config, temperature: v })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs">{tLab("playground.chunk_settings")}</Label>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <span className="text-[10px] text-muted-foreground uppercase">{tLab("playground.chunk_size")}</span>
                                    <Input
                                        type="number"
                                        value={config.chunkSize}
                                        onChange={(e) => setConfig({ ...config, chunkSize: parseInt(e.target.value) })}
                                        className="h-8 text-xs bg-background/50"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] text-muted-foreground uppercase">{tLab("playground.top_k")}</span>
                                    <Input
                                        type="number"
                                        value={config.topK}
                                        onChange={(e) => setConfig({ ...config, topK: parseInt(e.target.value) })}
                                        className="h-8 text-xs bg-background/50"
                                    />
                                </div>
                            </div>
                        </div>

                        <Button
                            className="w-full h-9 gap-2 font-bold"
                            onClick={handleRun}
                            disabled={isLoading}
                        >
                            <Play className={isLoading ? "animate-spin" : "fill-current w-3 h-3"} />
                            {tLab("playground.run_btn")}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-8 flex flex-col gap-6">
                <Card className="flex-1 min-h-[400px]">
                    <Tabs defaultValue="prompt" className="w-full flex flex-col h-full">
                        <CardHeader className="pb-2 border-b">
                            <div className="flex items-center justify-between">
                                <TabsList className="bg-muted/50 h-9 p-1">
                                    <TabsTrigger value="prompt" className="text-xs px-4">{tLab("playground.tab_prompt")}</TabsTrigger>
                                    <TabsTrigger value="response" className="text-xs px-4">{tLab("playground.tab_result")}</TabsTrigger>
                                    <TabsTrigger value="chunks" className="text-xs px-4">{tLab("playground.tab_chunks")}</TabsTrigger>
                                    <TabsTrigger value="metrics" className="text-xs px-4">{tLab("playground.tab_eval")}</TabsTrigger>
                                </TabsList>
                                <Badge variant="outline" className="text-[10px] font-mono opacity-60">TEST_SESSION_01</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4 flex-1">
                            <TabsContent value="prompt" className="mt-0 h-full flex flex-col gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs opacity-70 uppercase tracking-widest">{tLab("playground.label_query")}</Label>
                                    <textarea
                                        className="w-full h-32 bg-muted/20 border rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all resize-none"
                                        placeholder={tLab("playground.placeholder_query")}
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2 flex-1">
                                    <Label className="text-xs opacity-70 uppercase tracking-widest">{tLab("playground.label_context")}</Label>
                                    <textarea
                                        className="w-full flex-1 bg-muted/10 border rounded-lg p-3 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary transition-all resize-none"
                                        value={baseInstruction}
                                        onChange={(e) => setBaseInstruction(e.target.value)}
                                    />
                                </div>
                            </TabsContent>

                            <TabsContent value="response" className="mt-0 min-h-[250px]">
                                {resultData?.answer ? (
                                    <div className="p-4 bg-muted/5 rounded-lg border text-sm leading-relaxed whitespace-pre-wrap">
                                        {resultData.answer as React.ReactNode}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                                        <Beaker className="w-12 h-12 text-muted-foreground opacity-20 mb-4" />
                                        <p className="text-muted-foreground text-sm max-w-xs">{tLab("playground.no_results")}</p>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="chunks" className="mt-0 space-y-4">
                                <div className="flex items-center gap-2 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg text-[10px] text-blue-500/80 font-bold mb-4 uppercase">
                                    <Database className="w-3 h-3" />
                                    {tLab("playground.chunks_title")} ({(resultData?.context as any[])?.length || 0})
                                </div>
                                {(resultData?.context as any[])?.map((chunk: Record<string, unknown>, i: number) => (
                                    <div key={i} className="p-3 border rounded-lg bg-muted/10 space-y-2">
                                        <div className="flex justify-between items-center text-[10px] opacity-70">
                                            <span className="font-bold">{tLab("playground.chunk_label")} {i + 1}</span>
                                            <Badge variant="secondary" className="px-1 text-[8px] h-4">{tLab("playground.relevance_badge")}: {(Number(chunk.score) * 100).toFixed(1)}%</Badge>
                                        </div>
                                        <p className="text-[11px] leading-relaxed italic text-muted-foreground">
                                            "{String(chunk.text)}"
                                        </p>
                                    </div>
                                ))}
                                {!resultData?.context && (
                                    <p className="text-center py-12 text-muted-foreground text-xs uppercase tracking-widest opacity-50">{tLab("playground.no_context")}</p>
                                )}
                            </TabsContent>

                            <TabsContent value="metrics" className="mt-0 space-y-6 pt-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <MetricCard label={tLab("playground.faithfulness")} score={Number((resultData?.metrics as any)?.faithfulness || 0.0)} color="bg-emerald-500" />
                                        <MetricCard label={tLab("playground.relevance")} score={Number((resultData?.metrics as any)?.answer_relevance || 0.0)} color="bg-blue-500" />
                                        <MetricCard label={tLab("playground.precision")} score={Number((resultData?.metrics as any)?.context_precision || 0.0)} color="bg-amber-500" />
                                    </div>
                                </div>
                                <Card className="bg-muted/30 border-none">
                                    <CardHeader className="py-3">
                                        <CardTitle className="text-xs flex items-center gap-2">
                                            <BarChart3 className="w-3 h-3" />
                                            {tLab("playground.causal_insight")}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pb-4 text-[11px] text-muted-foreground leading-relaxed">
                                        {String((resultData?.metrics as any)?.reasoning || tLab("playground.causal_desc"))}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </CardContent>
                    </Tabs>
                </Card>
            </div>
        </div>
    );
}

function MetricCard({ label, score, color }: { label: string, score: number, color: string }) {
    return (
        <div className="p-4 bg-muted/50 rounded-xl border border-border/50 space-y-3">
            <div className="flex justify-between items-end">
                <span className="text-[11px] font-bold uppercase tracking-tight text-muted-foreground">{label}</span>
                <span className="text-lg font-black font-mono">{Math.round(score * 100)}%</span>
            </div>
            <Progress value={score * 100} className="h-1.5" indicatorClassName={color} />
        </div>
    );
}
