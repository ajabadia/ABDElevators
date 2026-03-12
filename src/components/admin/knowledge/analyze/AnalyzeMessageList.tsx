"use client";

import { useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, FileText, ExternalLink, Bot, User, BrainCircuit, Activity } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { ChatMessage } from "@/hooks/useQuickAnalyze";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface AnalyzeMessageListProps {
    messages: ChatMessage[];
    isQuerying: boolean;
    status: string;
}

export function AnalyzeMessageList({ messages, isQuerying, status }: AnalyzeMessageListProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const t = useTranslations("knowledge_hub");

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, status]);

    return (
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 dark:bg-black/10">
            {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full">
                        <BrainCircuit size={40} className="text-slate-400" />
                    </div>
                    <div className="max-w-xs">
                        <p className="font-bold text-slate-600 dark:text-slate-300">
                            {t('analyze_modal.empty.title')}
                        </p>
                        <p className="text-sm text-slate-500">
                            {t('analyze_modal.empty.description')}
                        </p>
                    </div>
                </div>
            ) : (
                <>
                    {messages.map((msg, i) => (
                        <div key={i} className={cn(
                            "flex gap-4",
                            msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                        )}>
                            <div className={cn(
                                "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                                msg.role === 'user' 
                                    ? "bg-slate-900 text-white" 
                                    : "bg-teal-600 text-white"
                            )}>
                                {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                            </div>

                            <div className={cn(
                                "max-w-[85%] space-y-3",
                                msg.role === 'user' ? "text-right" : "text-left"
                            )}>
                                <div className={cn(
                                    "p-5 rounded-3xl shadow-sm border",
                                    msg.role === 'user'
                                        ? "bg-slate-900 text-white border-slate-800 rounded-tr-none"
                                        : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 rounded-tl-none"
                                )}>
                                    <div className="prose prose-sm dark:prose-invert max-w-none font-medium leading-relaxed">
                                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                                    </div>

                                    {msg.confidence !== undefined && (
                                        <div className="mt-4 flex items-center gap-2">
                                            <div className="flex-1 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div 
                                                    className={cn(
                                                        "h-full transition-all duration-1000",
                                                        msg.confidence > 0.8 ? "bg-emerald-500" : msg.confidence > 0.5 ? "bg-amber-500" : "bg-red-500"
                                                    )}
                                                    style={{ width: `${msg.confidence * 100}%` }}
                                                />
                                            </div>
                                            <span className="text-[10px] font-black opacity-60">
                                                {Math.round(msg.confidence * 100)}% {t('analyze_modal.confidence')}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {msg.sources && msg.sources.length > 0 && (
                                    <div className="flex flex-wrap gap-2 pt-1 justify-start">
                                        {msg.sources.map((src: any, idx: number) => (
                                            <Badge 
                                                key={idx} 
                                                variant="outline" 
                                                className="bg-white/50 dark:bg-slate-900/50 hover:bg-teal-50 dark:hover:bg-teal-900/20 border-slate-200 dark:border-slate-800 text-[10px] py-1 gap-1.5 font-bold cursor-help transition-all"
                                                title={src.text}
                                            >
                                                <FileText size={10} className="text-teal-600" />
                                                <span className="max-w-[120px] truncate">{src.metadata?.filename || t('analyze_modal.source')}</span>
                                                <span className="opacity-40 font-mono">p.{src.metadata?.page || '?'}</span>
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {status && (
                        <div className="flex items-center gap-3 py-2 px-4 bg-teal-50/50 dark:bg-teal-900/10 border border-teal-100/50 dark:border-teal-900/20 rounded-2xl w-fit animate-pulse">
                            <Activity size={14} className="text-teal-600 animate-spin-slow" />
                            <span className="text-xs font-bold text-teal-700 dark:text-teal-400 italic">
                                {status}...
                            </span>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
