import { FederatedKnowledgeService } from "@/lib/federated-knowledge-service";
import { FederatedPattern } from "@/lib/schemas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BrainCircuit, Globe } from "lucide-react";

interface FederatedSuggestionsProps {
    query: string;
}

export async function FederatedSuggestions({ query }: FederatedSuggestionsProps) {
    if (!query || query.length < 5) return null;

    const patterns = await FederatedKnowledgeService.searchGlobalPatterns(query, 2);

    if (!patterns || patterns.length === 0) return null;

    return (
        <div className="mt-6 space-y-4">
            <div className="flex items-center gap-2 text-teal-400">
                <Globe className="w-4 h-4" />
                <h3 className="text-sm font-bold uppercase tracking-wider">Community Knowledge (Global Federation)</h3>
            </div>

            <div className="grid gap-3">
                {patterns.map((pattern: any, idx: number) => (
                    <Card key={idx} className="bg-slate-900/50 border-teal-500/20 hover:border-teal-500/40 transition-colors">
                        <CardHeader className="py-3 px-4 pb-2">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-sm font-medium text-slate-200">
                                    {pattern.problemVector}
                                </CardTitle>
                                <Badge variant="outline" className="border-teal-500/30 text-teal-400 text-[10px]">
                                    {Math.round(pattern.similarity * 100)}% Match
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="px-4 py-3 text-xs text-slate-400">
                            {pattern.solutionVector}
                            <div className="flex gap-2 mt-2">
                                {pattern.keywords.map((k: string) => (
                                    <span key={k} className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-500">#{k}</span>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
