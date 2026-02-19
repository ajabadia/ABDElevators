"use client"

import React, { useState, useRef, useEffect } from "react"
import {
    Search,
    Send,
    Loader2,
    X,
    Bot,
    ChevronRight,
    FileText,
    Sparkles,
    User,
    RefreshCw
} from "lucide-react"
import { ContentCard } from "@/components/ui/content-card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import ReactMarkdown from "react-markdown"
import { useTranslations } from "next-intl"
import { humanizeConfidence, confidencePercent } from "@/lib/confidence-humanizer"

interface Message {
    role: "user" | "assistant"
    content: string
    documents?: any[]
    trace?: string[]
}

const SUGGESTED_QUERIES = [
    "q1",
    "q2",
    "q3",
    "q4"
]

/**
 * ConversationalSearch — ERA 6 Optimized (FASE 192)
 * 
 * Full chat interface for technical documentation.
 * Enforces design tokens (primary) and humanized confidence.
 */
export function ConversationalSearch() {
    const t = useTranslations("common.navigation.search");
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [streamingContent, setStreamingContent] = useState("")
    const [currentDocs, setCurrentDocs] = useState<any[]>([])
    const [currentTrace, setCurrentTrace] = useState<string[]>([])
    const [retryCount, setRetryCount] = useState(0)
    const MAX_RETRIES = 2

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, streamingContent])

    const handleSendMessage = async (e?: React.FormEvent, overrideInput?: string, isRetry = false) => {
        if (e) e.preventDefault()

        const textToSend = overrideInput || input
        if (!textToSend.trim() || (isLoading && !isRetry)) return

        if (!isRetry) {
            const userMessage: Message = { role: "user", content: textToSend }
            setMessages(prev => [...prev, userMessage])
            setInput("")
        }

        setIsLoading(true)
        setStreamingContent("")
        setCurrentDocs([])
        setCurrentTrace([])

        const performFetch = async (attempt: number): Promise<boolean> => {
            try {
                const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
                const response = await fetch(`${baseUrl}/api/technical/rag/chat`, {
                    method: "POST",
                    cache: "no-store",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        messages: isRetry ? messages : [...messages, { role: "user", content: textToSend }],
                        stream: true
                    })
                })

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const reader = response.body?.getReader()
                const decoder = new TextDecoder()
                let fullAssistantContent = ""

                if (!reader) return false

                let isDone = false
                while (true) {
                    const { done, value } = await reader.read()
                    if (done) {
                        isDone = true
                        break
                    }

                    const chunk = decoder.decode(value)
                    const lines = chunk.split("\n")

                    for (const line of lines) {
                        if (!line || !line.startsWith('data: ')) continue;
                        const jsonStr = line.replace('data: ', '');
                        if (jsonStr === '[DONE]') {
                            isDone = true;
                            break;
                        }

                        try {
                            const event = JSON.parse(jsonStr);
                            if (event.type === 'token') {
                                fullAssistantContent += event.data
                                setStreamingContent(fullAssistantContent)
                            } else if (event.type === 'docs') {
                                setCurrentDocs(event.data)
                            } else if (event.type === 'trace') {
                                setCurrentTrace(event.data)
                            }
                        } catch (e) {
                            // Silent fail for incomplete chunks
                        }
                    }
                }

                if (isDone || fullAssistantContent.length > 0) {
                    setMessages(prev => [...prev, {
                        role: "assistant",
                        content: fullAssistantContent,
                        documents: currentDocs,
                        trace: currentTrace
                    }])
                    setStreamingContent("")
                    setRetryCount(0)
                    return true
                }
                return false
            } catch (error) {
                console.error(`Attempt ${attempt} failed:`, error)
                return false
            }
        }

        let success = await performFetch(1)

        if (!success) {
            for (let i = 1; i <= MAX_RETRIES; i++) {
                setRetryCount(i)
                const delay = Math.pow(2, i) * 1000
                await new Promise(resolve => setTimeout(resolve, delay))
                success = await performFetch(i + 1)
                if (success) break
            }
        }

        if (!success) {
            toast.error(t("error_connection"))
            setMessages(prev => [...prev, {
                role: "assistant",
                content: "error_retry"
            }])
        }

        setIsLoading(false)
        setTimeout(() => inputRef.current?.focus(), 100)
    }

    return (
        <div className="max-w-4xl mx-auto flex flex-col h-[75vh] relative bg-white dark:bg-slate-950 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">

            {/* Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm z-10">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 text-white">
                    <Bot className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="font-bold text-foreground leading-none mb-1">{t("title")}</h3>
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest flex items-center gap-1.5 leading-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {t("subtitle")}
                    </p>
                </div>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                <AnimatePresence initial={false}>
                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-8 p-8">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-800"
                            >
                                <Sparkles className="w-10 h-10 text-primary opacity-50" />
                            </motion.div>

                            <div className="space-y-2 max-w-md">
                                <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">
                                    {t("welcome_title")}
                                </h2>
                                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                    {t("welcome_desc")}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-lg text-left">
                                {SUGGESTED_QUERIES.map((key, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSendMessage(undefined, t(`suggested.${key}`))}
                                        className="group p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-primary dark:hover:border-primary hover:bg-primary/5 transition-all flex items-center justify-between shadow-sm"
                                    >
                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 group-hover:text-primary transition-colors">
                                            {t(`suggested.${key}`)}
                                        </span>
                                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-all" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {messages.map((m, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn(
                                "flex items-start gap-4 max-w-3xl w-full",
                                m.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                            )}
                        >
                            {/* Avatar */}
                            <div className={cn(
                                "shrink-0 w-8 h-8 rounded-lg flex items-center justify-center shadow-sm border mt-1",
                                m.role === 'user'
                                    ? "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500"
                                    : "bg-primary border-primary text-white"
                            )}>
                                {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                            </div>

                            {/* Bubble */}
                            <div className={cn(
                                "p-5 rounded-2xl text-[14px] leading-relaxed shadow-sm",
                                m.role === 'user'
                                    ? "bg-primary text-white rounded-tr-none font-medium"
                                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-tl-none text-slate-700 dark:text-slate-200"
                            )}>
                                {m.role === 'user' ? (
                                    <p>{m.content}</p>
                                ) : m.content === "error_retry" ? (
                                    <div className="space-y-3">
                                        <p className="text-destructive font-bold text-xs uppercase tracking-wider">
                                            {t("error_message")}
                                        </p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleSendMessage(undefined, messages[messages.length - 1].content, true)}
                                            className="h-9 px-4 gap-2 border-destructive/20 hover:bg-destructive/5 text-destructive font-bold"
                                        >
                                            <RefreshCw className="w-4 h-4" />
                                            Reintentar
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-5">
                                        <div className="prose prose-sm prose-slate dark:prose-invert max-w-none prose-p:leading-relaxed">
                                            <ReactMarkdown>{m.content}</ReactMarkdown>
                                        </div>

                                        {/* Sources section */}
                                        {m.documents && m.documents.length > 0 && (
                                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                                <p className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-3 flex items-center gap-1.5">
                                                    <Sparkles className="w-3 h-3 text-primary" /> {t("sources_label")}
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {m.documents.map((doc, idx) => (
                                                        <SourceChip key={idx} doc={doc} />
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}

                    {/* Streaming State */}
                    {isLoading && (
                        <div className="flex items-start gap-4 mr-auto max-w-3xl w-full">
                            <div className="shrink-0 w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white mt-1">
                                <Bot size={16} />
                            </div>
                            <div className="p-5 rounded-2xl rounded-tl-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm w-full">
                                {streamingContent ? (
                                    <div className="prose prose-sm prose-slate dark:prose-invert max-w-none">
                                        <ReactMarkdown>{streamingContent}</ReactMarkdown>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center gap-3 text-slate-400">
                                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">
                                                {retryCount > 0
                                                    ? `${t("analyzing")} (${retryCount}/${MAX_RETRIES})`
                                                    : t("analyzing")}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 backdrop-blur-sm">
                <form onSubmit={(e) => handleSendMessage(e)} className="relative flex items-center gap-2 max-w-4xl mx-auto group">
                    <div className="relative flex-1">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={t("placeholder")}
                            className="w-full pl-5 pr-12 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm font-semibold shadow-sm outline-none"
                            disabled={isLoading}
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            {input && (
                                <button
                                    type="button"
                                    onClick={() => setInput("")}
                                    className="p-1.5 text-slate-300 hover:text-slate-500 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                    <Button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="h-[52px] w-[52px] rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 shrink-0 text-white p-0"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send size={20} />}
                    </Button>
                </form>
                <div className="text-center mt-3">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest opacity-60">
                        {t("disclaimer")}
                    </p>
                </div>
            </div>
        </div>
    )
}

function SourceChip({ doc }: { doc: any }) {
    const fileName = doc.source.split('/').pop().replace('.pdf', '').replace(/_/g, ' ')
    const conf = doc.score != null ? humanizeConfidence(doc.score) : null;

    return (
        <a
            href={doc.cloudinaryUrl || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-primary transition-all group shadow-sm"
        >
            <FileText className="w-3 h-3 text-slate-400 group-hover:text-primary transition-colors" />
            <div className="flex flex-col text-left leading-none gap-0.5">
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 truncate max-w-[120px] group-hover:text-primary">
                    {fileName}
                </span>
                <div className="flex items-center gap-2">
                    {doc.approxPage && (
                        <span className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter">
                            p.{doc.approxPage}
                        </span>
                    )}
                    {conf && (
                        <span className={cn("text-[8px] font-black uppercase tracking-tighter flex items-center gap-0.5", conf.colorClass)}>
                            {conf.icon} {confidencePercent(doc.score)}%
                        </span>
                    )}
                </div>
            </div>
        </a>
    )
}
