"use client"

import React, { useState, useRef } from "react"
import {
    Search,
    Sparkles,
    MessageSquare,
    ExternalLink,
    ThumbsUp,
    ThumbsDown,
    Loader2,
    BrainCircuit,
    AlertCircle
} from "lucide-react"
import { ContentCard } from "@/components/ui/content-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useTranslations } from "next-intl"

interface SearchSource {
    title: string
    page?: number
    snippet: string
    type: string
    cloudinaryUrl?: string
}

interface SearchResponse {
    success: boolean
    answer: string
    sources: SearchSource[]
    confidence: number
    correlationId: string
}

export function UserSemanticSearch() {
    const t = useTranslations("search")
    const [query, setQuery] = useState("")
    const [isSearching, setIsSearching] = useState(false)
    const [response, setResponse] = useState<SearchResponse | null>(null)
    const [feedback, setFeedback] = useState<"up" | "down" | null>(null)
    const resultsRef = useRef<HTMLDivElement>(null)

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if (!query.trim()) return

        setIsSearching(true)
        setResponse(null)
        setFeedback(null)

        try {
            const res = await fetch("/api/user/search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query, limit: 10 })
            })

            const data = await res.json()
            if (data.success) {
                setResponse(data)
                // Scroll to results
                setTimeout(() => {
                    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
                }, 100)
            } else {
                toast.error(data.message || t('error_search'))
            }
        } catch (error) {
            console.error("Search error:", error)
            toast.error(t('error_connection'))
        } finally {
            setIsSearching(false)
        }
    }

    const handleFeedback = (type: "up" | "down") => {
        if (feedback) return
        setFeedback(type)
        toast.success(t('feedback_thanks'))
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Search Bar */}
            <ContentCard className="border-none shadow-2xl p-2 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950" noPadding>
                <form onSubmit={handleSearch} className="relative flex items-center gap-2">
                    <div className="absolute left-6 text-teal-600">
                        <Search className={cn("w-6 h-6", isSearching && "animate-pulse")} />
                    </div>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={t('input_placeholder_semantic')}
                        className="w-full pl-16 pr-36 py-7 bg-transparent border-none focus:ring-0 text-lg font-medium placeholder:text-slate-400"
                        disabled={isSearching}
                    />
                    <div className="absolute right-4">
                        <Button
                            type="submit"
                            disabled={isSearching || !query.trim()}
                            className="bg-teal-600 hover:bg-teal-700 h-14 px-8 rounded-2xl font-bold shadow-lg shadow-teal-500/20 text-md transition-all active:scale-95"
                        >
                            {isSearching ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                t('ask_button')
                            )}
                        </Button>
                    </div>
                </form>
            </ContentCard>

            {/* Loading State */}
            {isSearching && (
                <div className="flex flex-col items-center justify-center py-20 space-y-6 animate-in fade-in duration-500">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full border-4 border-teal-500/10 border-t-teal-500 animate-spin" />
                        <BrainCircuit className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 text-teal-600" />
                        <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-amber-500 animate-pulse" />
                    </div>
                    <div className="text-center space-y-2">
                        <p className="text-xl font-bold text-foreground">{t('synthesizing')}</p>
                        <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground font-mono">
                            <span className="inline-block w-2 h-2 bg-teal-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <span className="inline-block w-2 h-2 bg-teal-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <span className="inline-block w-2 h-2 bg-teal-500 rounded-full animate-bounce" />
                            <span>{t('consulting_network')}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Results Section */}
            {response && (
                <div ref={resultsRef} className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
                    {/* AI Answer */}
                    <ContentCard className="border-none shadow-2xl bg-slate-900 text-white overflow-hidden relative" noPadding>
                        <div className="absolute top-0 right-0 p-16 opacity-10 bg-teal-500 blur-3xl rounded-full" />
                        <div className="p-10 space-y-6 relative z-10">
                            <div className="flex items-center justify-between">
                                <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/40 px-3 py-1.5 gap-2 uppercase text-[10px] font-black tracking-widest h-auto">
                                    <Sparkles className="w-3 h-3 text-teal-400" />
                                    {t('global_intelligence')}
                                </Badge>
                                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest bg-slate-800/50 px-3 py-1 rounded-full">
                                    {t('precision')}: {Math.round(response.confidence * 100)}%
                                </div>
                            </div>

                            <div className="text-2xl leading-relaxed font-semibold italic text-slate-100 pl-6 border-l-4 border-teal-500 py-2">
                                {response.answer}
                            </div>

                            <div className="flex items-center justify-between pt-8 border-t border-slate-800/50">
                                <div className="flex items-center gap-6 text-xs text-slate-400 font-medium">
                                    <span className="opacity-70">{t('feedback_prompt')}</span>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => handleFeedback("up")}
                                            className={cn(
                                                "p-2.5 rounded-xl transition-all border border-transparent shadow-sm",
                                                feedback === "up"
                                                    ? "bg-teal-500 text-white shadow-teal-500/20"
                                                    : "bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                                            )}
                                        >
                                            <ThumbsUp className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleFeedback("down")}
                                            className={cn(
                                                "p-2.5 rounded-xl transition-all border border-transparent shadow-sm",
                                                feedback === "down"
                                                    ? "bg-red-500 text-white shadow-red-500/20"
                                                    : "bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                                            )}
                                        >
                                            <ThumbsDown className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="text-[10px] font-mono text-slate-600 bg-black/40 px-3 py-1 rounded-lg">
                                    {t('ref_id')}: {response.correlationId.split('-')[0].toUpperCase()}
                                </div>
                            </div>
                        </div>
                    </ContentCard>

                    {/* Sources */}
                    <div className="space-y-5">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-teal-600" />
                                {t('technical_sources')} ({response.sources.length})
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {response.sources.map((source, i) => (
                                <SourceCard key={i} source={source} />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Help Section when no query */}
            {!isSearching && !response && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-12 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                    <HelpPreview
                        title={t('help_data_title')}
                        description={t('help_data_desc')}
                        icon={<BrainCircuit className="w-6 h-6 text-purple-500" />}
                    />
                    <HelpPreview
                        title={t('help_schematic_title')}
                        description={t('help_schematic_desc')}
                        icon={<AlertCircle className="w-6 h-6 text-amber-500" />}
                    />
                </div>
            )}
        </div>
    )
}

function SourceCard({ source }: { source: SearchSource }) {
    const t = useTranslations("search")
    const fileName = source.title.split('/').pop() || t('source_document')

    return (
        <div className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl hover:border-teal-500/50 hover:shadow-2xl transition-all duration-300 flex flex-col h-full">
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0 pr-4">
                    <p className="text-[9px] font-black uppercase text-teal-600 tracking-widest mb-1.5 opacity-80">
                        {source.type || 'DOCUMENT'}
                    </p>
                    <h4 className="font-bold text-sm text-foreground truncate group-hover:text-teal-600 transition-colors">
                        {fileName}
                    </h4>
                </div>
                {source.page && (
                    <Badge variant="secondary" className="text-[10px] font-bold px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 shrink-0">
                        {t('source_page')} {source.page}
                    </Badge>
                )}
            </div>

            <p className="text-xs text-muted-foreground line-clamp-4 leading-relaxed italic mb-6 flex-1 pl-4 border-l-2 border-slate-100 dark:border-slate-800">
                "...{source.snippet}..."
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800/50">
                <span className="text-[9px] font-mono text-slate-400 group-hover:text-slate-600 transition-colors">
                    TYPE: {source.type || 'RAW_TEXT'}
                </span>
                {source.cloudinaryUrl ? (
                    <a
                        href={source.cloudinaryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-[10px] font-black text-teal-600 hover:text-teal-700 transition-all hover:translate-x-1"
                    >
                        {t('source_view_original')}
                        <ExternalLink className="w-3 h-3" />
                    </a>
                ) : (
                    <div className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">{t('source_restricted')}</div>
                )}
            </div>
        </div>
    )
}

function HelpPreview({ title, description, icon }: { title: string, description: string, icon: React.ReactNode }) {
    return (
        <div className="flex gap-5 items-start p-7 rounded-3xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 hover:border-teal-500/20 hover:bg-white dark:hover:bg-slate-900 transition-all group">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 shadow-sm shrink-0 transition-transform group-hover:scale-110 group-hover:rotate-3">
                {icon}
            </div>
            <div className="space-y-1.5">
                <h4 className="font-bold text-base text-foreground group-hover:text-teal-600 transition-colors">{title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                    {description}
                </p>
            </div>
        </div>
    )
}
