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
    HelpCircle
} from "lucide-react"
import { ContentCard } from "@/components/ui/content-card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import ReactMarkdown from "react-markdown"
import { useTranslations } from "next-intl"

interface Message {
    role: "user" | "assistant"
    content: string
    documents?: any[]
    // Trace is hidden in Phase 96 for business users
    trace?: string[]
}

const SUGGESTED_QUERIES = [
    "q1",
    "q2",
    "q3",
    "q4"
]

export function ConversationalSearch() {
    const t = useTranslations("common.navigation.search");
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [streamingContent, setStreamingContent] = useState("")
    const [currentDocs, setCurrentDocs] = useState<any[]>([])
    // Trace state kept for potential debug mode, but not shown by default
    const [currentTrace, setCurrentTrace] = useState<string[]>([])

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, streamingContent])

    const handleSendMessage = async (e?: React.FormEvent, overrideInput?: string) => {
        if (e) e.preventDefault()

        const textToSend = overrideInput || input
        if (!textToSend.trim() || isLoading) return

        const userMessage: Message = { role: "user", content: textToSend }
        setMessages(prev => [...prev, userMessage])
        setInput("")
        setIsLoading(true)
        setStreamingContent("")
        setCurrentDocs([])
        setCurrentTrace([])

        try {
            const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
            const response = await fetch(`${baseUrl}/api/technical/rag/chat`, {
                method: "POST",
                cache: "no-store",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    messages: [...messages, userMessage], // Include history
                    stream: true
                })
            })

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Error ${response.status}: ${errorText}`);
            }

            const reader = response.body?.getReader()
            const decoder = new TextDecoder()
            let fullAssistantContent = ""

            if (!reader) return

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                const chunk = decoder.decode(value)
                const lines = chunk.split("\n")

                for (const line of lines) {
                    if (!line || !line.startsWith('data: ')) continue;
                    const jsonStr = line.replace('data: ', '');
                    if (jsonStr === '[DONE]') break;

                    try {
                        const event = JSON.parse(jsonStr);

                        if (event.type === 'connected') {
                            // Connection acknowledged
                            continue;
                        }

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

            setMessages(prev => [...prev, {
                role: "assistant",
                content: fullAssistantContent,
                documents: currentDocs,
                trace: currentTrace
            }])
            setStreamingContent("")

        } catch (error) {
            console.error("Chat error:", error)
            toast.error(t("error_connection"))

            // Add error message to chat for UX clarity
            setMessages(prev => [...prev, {
                role: "assistant",
                content: t("error_message")
            }])
        } finally {
            setIsLoading(false)
            // Refocus input for flow
            setTimeout(() => inputRef.current?.focus(), 100)
        }
    }

    return (
        <div className="max-w-4xl mx-auto flex flex-col h-[75vh] relative bg-white dark:bg-slate-950 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">

            {/* Header - Friendly & Professional */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm z-10">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-teal-500/20 text-white">
                    <Bot className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="font-bold text-foreground">{t("title")}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        {t("subtitle")}
                    </p>
                </div>
                <div className="ml-auto">
                    {/* Placeholder for future actions like 'Clear Chat' */}
                </div>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                <AnimatePresence initial={false}>
                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-8 p-8">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4"
                            >
                                <Sparkles className="w-10 h-10 text-teal-500" />
                            </motion.div>

                            <div className="space-y-2 max-w-md">
                                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                                    {t("welcome_title")}
                                </h2>
                                <p className="text-slate-500">
                                    {t("welcome_desc")}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-lg text-left">
                                {SUGGESTED_QUERIES.map((key, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSendMessage(undefined, t(`suggested.${key}`))}
                                        className="group p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-teal-400 dark:hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/10 transition-all flex items-center justify-between"
                                    >
                                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300 group-hover:text-teal-700 dark:group-hover:text-teal-300">
                                            {t(`suggested.${key}`)}
                                        </span>
                                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-teal-500 opacity-0 group-hover:opacity-100 transition-all" />
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
                                "flex items-start gap-3 max-w-3xl",
                                m.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                            )}
                        >
                            {/* Avatar */}
                            <div className={cn(
                                "shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm border mt-1",
                                m.role === 'user'
                                    ? "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                                    : "bg-teal-600 border-teal-500 text-white"
                            )}>
                                {m.role === 'user' ? <div className="w-full h-full bg-slate-200 dark:bg-slate-700 rounded-full" /> : <Bot className="w-4 h-4" />}
                            </div>

                            {/* Bubble */}
                            <div className={cn(
                                "p-4 rounded-2xl text-[15px] leading-relaxed shadow-sm",
                                m.role === 'user'
                                    ? "bg-teal-600 text-white rounded-tr-none"
                                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-tl-none text-slate-700 dark:text-slate-200"
                            )}>
                                {m.role === 'user' ? (
                                    <p>{m.content}</p>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="prose prose-sm prose-slate dark:prose-invert max-w-none">
                                            <ReactMarkdown>{m.content}</ReactMarkdown>
                                        </div>

                                        {/* Sources Card - Phase 96: Clean & Professional */}
                                        {m.documents && m.documents.length > 0 && (
                                            <div className="mt-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                                                <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-2 flex items-center gap-1.5">
                                                    <FileText className="w-3 h-3" /> {t("sources_label")}
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
                        <div className="flex items-start gap-3 mr-auto max-w-3xl">
                            <div className="shrink-0 w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white mt-1 border border-teal-500">
                                <Bot className="w-4 h-4" />
                            </div>
                            <div className="p-4 rounded-2xl rounded-tl-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm w-full">
                                {streamingContent ? (
                                    <div className="prose prose-sm prose-slate dark:prose-invert max-w-none">
                                        <ReactMarkdown>{streamingContent}</ReactMarkdown>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <Loader2 className="w-4 h-4 animate-spin text-teal-500" />
                                        <span className="text-sm font-medium animate-pulse">{t("analyzing")}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800">
                <form onSubmit={(e) => handleSendMessage(e)} className="relative flex items-center gap-2 max-w-4xl mx-auto">
                    <div className="relative flex-1">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={t("placeholder")}
                            className="w-full pl-5 pr-12 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-base font-medium placeholder:text-slate-400"
                            disabled={isLoading}
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            {input && (
                                <button
                                    type="button"
                                    onClick={() => setInput("")}
                                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                    <Button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="h-[50px] w-[50px] rounded-xl bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-600/20 shrink-0"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </Button>
                </form>
                <div className="text-center mt-2">
                    <p className="text-[10px] text-slate-400">
                        {t("disclaimer")}
                    </p>
                </div>
            </div>
        </div>
    )
}

function SourceChip({ doc }: { doc: any }) {
    // Phase 96: Clean usage of filename. Simplify "manual_tecnico_v3.pdf" -> "manual_tecnico_v3"
    const fileName = doc.source.split('/').pop().replace('.pdf', '').replace(/_/g, ' ')

    return (
        <a
            href={doc.cloudinaryUrl || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-teal-400 transition-colors group text-decoration-none"
        >
            <FileText className="w-3 h-3 text-teal-600 dark:text-teal-400" />
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate max-w-[150px] group-hover:text-teal-600 dark:group-hover:text-teal-400">
                {fileName}
            </span>
            {doc.approxPage && (
                <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-700 px-1 rounded-sm">
                    p.{doc.approxPage}
                </span>
            )}
        </a>
    )
}
