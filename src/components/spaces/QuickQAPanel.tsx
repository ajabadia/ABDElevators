"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
    Send,
    Sparkles,
    Save,
    Trash2,
    MessageSquare,
    StickyNote,
    Loader2,
    CheckCircle2,
    PlusCircle,
    Zap
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { useTranslations } from "next-intl";

/**
 * ⚡ QuickQAPanel (Phase 125.3)
 * Ephemeral chat interface for "Paste & Ask" functionality.
 */
export function QuickQAPanel() {
    const t = useTranslations("common.spaces.quick_qa");
    const [snippet, setSnippet] = useState("");
    const [context, setContext] = useState("");
    const [question, setQuestion] = useState("");
    const [responses, setResponses] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSharing, setIsSharing] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [responses]);

    const handleAsk = async () => {
        if (!snippet || !question) {
            toast.error(t("validation_error"));
            return;
        }

        setIsLoading(true);
        const userQ = question;
        setQuestion("");
        setResponses(prev => [...prev, { role: 'user', content: userQ }]);

        try {
            const response = await fetch("/api/core/quick-qa", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ snippet, context, question: userQ }),
            });

            if (!response.ok) throw new Error("Error en la respuesta");

            const reader = response.body?.getReader();
            const decoder = new TextEncoder();
            let assistantMessage = "";

            setResponses(prev => [...prev, { role: 'assistant', content: "" }]);

            while (true) {
                const { done, value } = await reader!.read();
                if (done) break;

                const chunk = new TextDecoder().decode(value);
                const lines = chunk.split("\n");

                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            if (data.text) {
                                assistantMessage += data.text;
                                setResponses(prev => {
                                    const next = [...prev];
                                    next[next.length - 1].content = assistantMessage;
                                    return next;
                                });
                            }
                        } catch (e) { /* ignore parse errors for partial chunks */ }
                    }
                }
            }
        } catch (error) {
            toast.error(t("ia_error"));
        } finally {
            setIsLoading(false);
        }
    };

    const handlePromote = async () => {
        if (!snippet) return;

        setIsSharing(true);
        try {
            const title = "Snippet: " + (snippet.substring(0, 30) || "Sin título") + "...";
            const res = await fetch("/api/core/quick-qa/promote", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ snippet, title }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success(t("promote_success"));
            } else {
                toast.error(data.message || t("promote_error"));
            }
        } catch (error) {
            toast.error(t("conn_error"));
        } finally {
            setIsSharing(false);
        }
    };

    const clearAll = () => {
        setSnippet("");
        setContext("");
        setQuestion("");
        setResponses([]);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch h-[calc(100vh-140px)]">
            {/* Input Section */}
            <Card className="lg:col-span-5 flex flex-col shadow-lg border-primary/10">
                <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-primary">
                        <Zap className="w-5 h-5 fill-primary" />
                        {t("title")}
                    </CardTitle>
                    <CardDescription>
                        {t("desc")}
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-4 overflow-hidden flex flex-col">
                    <div className="space-y-2 flex-1 flex flex-col">
                        <Label htmlFor="snippet" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                            <span>{t("snippet_label")}</span>
                            <Badge variant="outline" className="text-[9px] font-normal uppercase">{t("snippet_badge")}</Badge>
                        </Label>
                        <Textarea
                            id="snippet"
                            placeholder={t("snippet_placeholder")}
                            className="flex-1 resize-none bg-muted/20 font-mono text-[11px] leading-relaxed"
                            value={snippet}
                            onChange={(e) => setSnippet(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="context" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("context_label")}</Label>
                        <Input
                            id="context"
                            placeholder={t("context_placeholder")}
                            className="h-9 text-xs"
                            value={context}
                            onChange={(e) => setContext(e.target.value)}
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t bg-muted/20 p-4">
                    <Button variant="ghost" size="sm" onClick={clearAll} className="text-xs h-8">
                        <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                        {t("clear_all")}
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={handlePromote}
                        disabled={isSharing || !snippet}
                        className="text-xs h-8"
                    >
                        {isSharing ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                        {t("promote")}
                    </Button>
                </CardFooter>
            </Card>

            {/* Chat Section */}
            <Card className="lg:col-span-7 flex flex-col shadow-xl border-primary/5 bg-slate-50/30 dark:bg-slate-900/30">
                <CardHeader className="pb-2 border-b">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            < MessageSquare className="w-4 h-4 text-primary" />
                            <span className="font-semibold text-sm">{t("chat_title")}</span>
                        </div>
                        <Badge variant="secondary" className="h-5 text-[9px]">GEMINI 2.5 FLASH</Badge>
                    </div>
                </CardHeader>

                <CardContent className="flex-1 p-0 overflow-hidden relative">
                    <ScrollArea className="h-full p-4" ref={scrollRef}>
                        <div className="space-y-6 max-w-2xl mx-auto py-4">
                            {responses.length === 0 && (
                                <div className="h-[200px] flex flex-col items-center justify-center text-center opacity-30 select-none">
                                    <Sparkles className="w-10 h-10 mb-4 text-primary" />
                                    <p className="text-sm font-medium">{t("chat_welcome_title")}</p>
                                    <p className="text-[10px] mt-1">{t("chat_welcome_desc")}</p>
                                </div>
                            )}
                            {responses.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                                        ? 'bg-primary text-primary-foreground rounded-tr-none'
                                        : 'bg-white dark:bg-slate-800 border rounded-tl-none prose dark:prose-invert prose-sm'
                                        }`}>
                                        {msg.role === 'assistant' ? (
                                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                                        ) : (
                                            msg.content
                                        )}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-white dark:bg-slate-800 border rounded-2xl rounded-tl-none p-4 flex items-center gap-2">
                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                                        <span className="text-xs text-muted-foreground italic">{t("status_loading")}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>

                <CardFooter className="p-4 border-t bg-background">
                    <div className="flex w-full gap-2 relative">
                        <Input
                            placeholder={t("chat_input_placeholder")}
                            className="h-11 pl-4 pr-12 text-sm shadow-inner"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleAsk()}
                        />
                        <Button
                            className="absolute right-1.5 top-1.5 h-8 w-8 p-0 rounded-md"
                            disabled={isLoading || !question || !snippet}
                            onClick={handleAsk}
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
