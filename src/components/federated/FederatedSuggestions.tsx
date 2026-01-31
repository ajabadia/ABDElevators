"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, Loader2 } from "lucide-react";

interface FederatedSuggestionsProps {
    query: string;
}

export function FederatedSuggestions({ query }: FederatedSuggestionsProps) {
    const [patterns, setPatterns] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchPatterns = async () => {
            if (!query || query.length < 5) return;

            setLoading(true);
            try {
                const res = await fetch('/api/v1/federated/search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query, limit: 2 })
                });
                const data = await res.json();
                if (data.success) {
                    setPatterns(data.data);
                }
            } catch (err) {
                console.error("Federated Suggestion Error:", err);
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(fetchPatterns, 500); // Debounce
        return () => clearTimeout(timer);
    }, [query]);

    if (!loading && patterns.length === 0) return null;

    return (
        <div className="mt-6 space-y-4">
            <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400">
                <Globe className="w-4 h-4 animate-pulse" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Collective Intelligence (Federated)</h3>
            </div>

            <div className="grid gap-3">
                {loading && (
                    <div className="flex items-center gap-2 text-slate-400 text-[10px] italic">
                        <Loader2 className="w-3 h-3 animate-spin" /> Investigating global patterns...
                    </div>
                )}

                {!loading && patterns.map((pattern: any, idx: number) => (
                    <Card key={idx} className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-900 border-teal-500/20 hover:border-teal-500/40 transition-all shadow-sm">
                        <CardHeader className="py-3 px-4 pb-2">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                    {pattern.problemVector}
                                </CardTitle>
                                <Badge variant="outline" className="border-teal-500/30 text-teal-600 dark:text-teal-400 text-[9px] font-black">
                                    {Math.round(pattern.similarity * 100)}% MATCH
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="px-4 py-3 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed italic">
                            {pattern.solutionVector}
                            <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar pb-1">
                                {pattern.keywords.map((k: string) => (
                                    <span key={k} className="px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[9px] font-bold text-slate-500 uppercase tracking-tighter">#{k}</span>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
